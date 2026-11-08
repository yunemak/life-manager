import { useCallback, useEffect, useRef, useState } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { localDate, type Task, type Transaction } from "./domain";
import AppLayout from "./components/layout/AppLayout";
import AppPages from "./components/layout/AppPages";
import AppDialogs from "./components/layout/AppDialogs";
import todayEntriesStyles from "./components/entries/TodayEntriesPage.module.css";
import { pageLabels, type Page } from "./app/types";
import useAppData from "./app/useAppData";
import usePreferences from "./app/usePreferences";
import useCalendarState from "./app/useCalendarState";
import useNotice from "./app/useNotice";
import useEntryWorkflow from "./app/useEntryWorkflow";
import useBackupActions from "./app/useBackupActions";
import useCategoryActions from "./app/useCategoryActions";
import { t } from "./i18n";
import {
    selectCategoryTotals,
    selectMonthTransactions,
    selectPageEntries,
    selectTodayEntries,
    selectTransactionTotals,
} from "./app/selectors";

function App() {
    const preferences = usePreferences();
    const { notice, notify, clearNotice } = useNotice();
    const handleLoadError = useCallback(
        () => notify(t("Veriler yüklenemedi", preferences.language)),
        [notify, preferences.language],
    );
    const { items, categories, habits, completions, refresh } =
        useAppData(handleLoadError);
    const calendar = useCalendarState(handleLoadError);
    const [page, setPage] = useState<Page>("home");
    const [query, setQuery] = useState("");
    const [moreOpen, setMoreOpen] = useState(false);
    const [financeMonth, setFinanceMonth] = useState(() => new Date());
    const nativeBackAction = useRef<(() => void) | undefined>(undefined);

    const language = preferences.language;
    const text = (value: string) => t(value, language);
    const pageLabel = (target: Page) =>
        target === "dayEntries" && language === "en"
            ? "Today's entries"
            : text(pageLabels[target]);
    const today = localDate();
    const monthPrefix = today.slice(0, 7);
    const financeMonthPrefix = localDate(financeMonth).slice(0, 7);
    const entries = useEntryWorkflow(page, today, refresh, notify, text);
    const transactions = items.filter(
        (item): item is Transaction =>
            item.kind === "expense" || item.kind === "income",
    );
    const todayEntries =
        page === "dayEntries" ? selectTodayEntries(items, today, query) : [];
    const pendingTasks =
        page === "home"
            ? items.filter(
                  (item): item is Task =>
                      item.localDate === today &&
                      item.kind === "task" &&
                      !item.completed,
              )
            : [];
    const { todaySpent, todayIncome, monthSpent, monthIncome } =
        selectTransactionTotals(transactions, today, monthPrefix);
    const filtered = ["finance", "journal", "tasks"].includes(page)
        ? selectPageEntries(items, page, query)
        : [];
    const monthTransactions = selectMonthTransactions(
        transactions,
        financeMonth,
    );
    const currentMonthTransactions = transactions.filter((item) =>
        item.localDate.startsWith(monthPrefix),
    );
    const incomeCategories = selectCategoryTotals(
        categories,
        currentMonthTransactions,
        "income",
        language,
    );
    const expenseCategories = selectCategoryTotals(
        categories,
        currentMonthTransactions,
        "expense",
        language,
    );
    const financeTotals = selectTransactionTotals(
        transactions,
        "",
        financeMonthPrefix,
    );
    const backup = useBackupActions(
        today,
        transactions,
        categories,
        refresh,
        notify,
        text,
    );
    const categoryActions = useCategoryActions(today, refresh, notify, text);
    const daysInMonth = new Date(
        calendar.month.getFullYear(),
        calendar.month.getMonth() + 1,
        0,
    ).getDate();
    const offset =
        (new Date(
            calendar.month.getFullYear(),
            calendar.month.getMonth(),
            1,
        ).getDay() +
            6) %
        7;

    const pageState = {
        page,
        language,
        text,
        pageLabel,
        today,
        monthPrefix,
        query,
        setQuery,
        calendarMonth: calendar.month,
        setCalendarMonth: calendar.setMonth,
        selectedDate: calendar.selectedDate,
        setSelectedDate: calendar.setSelectedDate,
        completedHabitIds: calendar.completedHabitIds,
        financeMonth,
        setFinanceMonth,
        theme: preferences.theme,
        accent: preferences.accent,
        setLanguage: preferences.setLanguage,
        setTheme: preferences.setTheme,
        changeAccent: preferences.changeAccent,
    };
    const pageData = {
        items,
        categories,
        habits,
        completions,
        todayEntries,
        todaysTasks: pendingTasks,
        todaySpent,
        todayIncome,
        monthSpent,
        monthIncome,
        financeMonthSpent: financeTotals.monthSpent,
        filtered,
        daysInMonth,
        offset,
        monthTransactions,
        incomeCategories,
        expenseCategories,
        refresh,
    };
    const pageActions = {
        openEntry: entries.openEntry,
        requestDelete: entries.requestDelete,
        toggleTask: entries.toggleTaskCompletion,
        setPage,
        notify,
        exportCsv: backup.exportCsv,
        exportJson: backup.exportJson,
        importJson: (file: File) => void backup.importJson(file),
        updateCategoryColor: categoryActions.changeColor,
        addCategory: categoryActions.openDialog,
    };

    useEffect(() => {
        nativeBackAction.current = () => {
            if (entries.deleteCandidate) {
                entries.cancelDelete();
            } else if (entries.open) {
                entries.close();
            } else if (categoryActions.open) {
                categoryActions.close();
            } else if (moreOpen) {
                setMoreOpen(false);
            } else if (page !== "home") {
                setPage("home");
            } else {
                void CapacitorApp.exitApp();
            }
        };
    });

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        let cancelled = false;
        let removeListener: (() => void) | undefined;
        void CapacitorApp.addListener("backButton", () => {
            nativeBackAction.current?.();
        }).then((listener) => {
            if (cancelled) {
                void listener.remove();
            } else {
                removeListener = () => void listener.remove();
            }
        });

        return () => {
            cancelled = true;
            removeListener?.();
        };
    }, []);

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;
        void StatusBar.setOverlaysWebView({ overlay: false });
        void StatusBar.setStyle({
            style: preferences.theme === "dark" ? Style.Dark : Style.Light,
        });
        void StatusBar.setBackgroundColor({
            color: preferences.theme === "dark" ? "#151a18" : "#f7f9f7",
        });
    }, [preferences.theme]);

    return (
        <>
            <AppLayout
                page={page}
                language={language}
                theme={preferences.theme}
                today={today}
                moreOpen={moreOpen}
                contentClassName={
                    page === "dayEntries" ? todayEntriesStyles.content : ""
                }
                pageLabel={pageLabel}
                onNavigate={(nextPage) => {
                    setPage(nextPage);
                    setMoreOpen(false);
                }}
                onLanguageToggle={() =>
                    preferences.setLanguage(language === "en" ? "tr" : "en")
                }
                onThemeToggle={() =>
                    preferences.setTheme(
                        preferences.theme === "light" ? "dark" : "light",
                    )
                }
                onMoreToggle={() => setMoreOpen((open) => !open)}
                onQuickAdd={() =>
                    entries.openEntry(
                        page === "journal"
                            ? "activity"
                            : page === "tasks"
                              ? "task"
                              : "expense",
                    )
                }
            >
                <AppPages
                    state={pageState}
                    data={pageData}
                    actions={pageActions}
                />
            </AppLayout>
            <AppDialogs
                category={{
                    open: categoryActions.open,
                    name: categoryActions.name,
                    color: categoryActions.color,
                    text,
                    onNameChange: categoryActions.setName,
                    onColorChange: categoryActions.setColor,
                    onClose: categoryActions.close,
                    onSubmit: categoryActions.submit,
                }}
                entry={{
                    open: entries.open,
                    editing: entries.editing,
                    kind: entries.kind,
                    availableKinds: entries.availableKinds,
                    categories,
                    language,
                    today,
                    text,
                    onClose: entries.close,
                    onKindChange: entries.changeKind,
                    onSave: entries.save,
                    onRemove: entries.requestDelete,
                }}
                deletion={{
                    open: Boolean(entries.deleteCandidate),
                    text,
                    onCancel: entries.cancelDelete,
                    onConfirm: () => void entries.confirmDelete(),
                }}
                notice={notice}
                onNoticeClose={clearNotice}
            />
        </>
    );
}

export default App;

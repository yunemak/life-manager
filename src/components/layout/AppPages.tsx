import {
    ArrowDownLeft,
    ArrowUpRight,
    BarChart3,
    Check,
    ChevronRight,
    FileText,
} from "lucide-react";
import { format, addMonths, subMonths, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import {
    money,
    type Category,
    type Entry,
    type Habit,
    type Task,
    type Transaction,
    type RecordKind,
} from "../../domain";
import type { Language } from "../../i18n";
import type { Page } from "../../app/types";
import {
    selectMonthActivityCount,
    selectMonthEntryCount,
} from "../../app/selectors";
import HabitsPage from "../habits/HabitsPage";
import AssetsPage from "../assets/AssetsPage";
import TodayEntriesPage from "../entries/TodayEntriesPage";
import FinancePage from "../finance/FinancePage";
import HomePage from "../home/HomePage";
import CalendarPage from "../calendar/CalendarPage";
import CalendarDayReport from "../calendar/CalendarDayReport";
import { Empty, RecordList, RecordRow } from "../entries/EntryList";
import JournalTasksPage from "../journal/JournalTasksPage";
import StatisticsPage from "../statistics/StatisticsPage";
import SettingsPage from "../settings/SettingsPage";

const amountText = (minor: number) => money(minor);
const balanceText = (minor: number) =>
    amountText(minor).replace(/^([−-])(?=₺)/, "$1 ");

type Translate = (value: string) => string;

interface AppPagesState {
    page: Page;
    language: Language;
    text: Translate;
    pageLabel: (page: Page) => string;
    today: string;
    monthPrefix: string;
    query: string;
    setQuery: (query: string) => void;
    calendarMonth: Date;
    setCalendarMonth: (date: Date) => void;
    selectedDate: string;
    setSelectedDate: (date: string) => void;
    completedHabitIds: string[];
    financeMonth: Date;
    setFinanceMonth: (date: Date) => void;
    theme: string;
    accent: "green" | "blue";
    setLanguage: (language: Language) => void;
    setTheme: (theme: string) => void;
    changeAccent: (accent: "green" | "blue") => void;
}

interface AppPagesData {
    items: Entry[];
    categories: Category[];
    habits: Habit[];
    completions: string[];
    todayEntries: Entry[];
    todaysTasks: Task[];
    todaySpent: number;
    todayIncome: number;
    monthSpent: number;
    monthIncome: number;
    financeMonthSpent: number;
    filtered: Entry[];
    daysInMonth: number;
    offset: number;
    monthTransactions: Transaction[];
    incomeCategories: Array<{
        id: string;
        name: string;
        color: string;
        amount: string;
        total: number;
    }>;
    expenseCategories: Array<{
        id: string;
        name: string;
        color: string;
        amount: string;
        total: number;
    }>;
    refresh: () => Promise<void>;
}

interface AppPagesActions {
    openEntry: (kind?: RecordKind, entry?: Entry | null) => void;
    requestDelete: (entry: Entry) => void;
    toggleTask: (task: Task) => void;
    setPage: (page: Page) => void;
    notify: (message: string) => void;
    exportCsv: () => void;
    exportJson: () => void;
    importJson: (file: File) => void;
    updateCategoryColor: (id: string, color: string) => Promise<void>;
    addCategory: () => void;
}

export default function AppPages({
    state,
    data,
    actions,
}: {
    state: AppPagesState;
    data: AppPagesData;
    actions: AppPagesActions;
}) {
    const {
        page,
        language,
        text,
        pageLabel,
        today,
        monthPrefix,
        query,
        setQuery,
        calendarMonth,
        setCalendarMonth,
        selectedDate,
        setSelectedDate,
        completedHabitIds,
        financeMonth,
        setFinanceMonth,
        theme,
        accent,
        setLanguage,
        setTheme,
        changeAccent,
    } = state;
    const {
        items,
        categories,
        habits,
        completions,
        todayEntries,
        todaysTasks,
        todaySpent,
        todayIncome,
        monthSpent,
        monthIncome,
        financeMonthSpent,
        filtered,
        daysInMonth,
        offset,
        monthTransactions,
        incomeCategories,
        expenseCategories,
        refresh,
    } = data;
    const {
        openEntry: open,
        requestDelete: remove,
        toggleTask,
        setPage,
        notify,
        exportCsv,
        exportJson,
        importJson,
        updateCategoryColor,
        addCategory,
    } = actions;
    const fmtMonth = (date: Date) =>
        format(date, "MMMM yyyy", {
            locale: language === "en" ? undefined : tr,
        });
    const todayDate = parseISO(today);

    return (
        <>
            {page === "home" && (
                <HomePage
                    language={language}
                    dateLabel={format(todayDate, "EEEE, d MMMM yyyy", {
                        locale: language === "en" ? undefined : tr,
                    })}
                    monthLabel={
                        language === "en"
                            ? `${format(todayDate, "MMMM")} total`
                            : `${format(todayDate, "MMMM", { locale: tr })} toplamı`
                    }
                    todaySpent={todaySpent}
                    todayIncome={todayIncome}
                    monthSpent={monthSpent}
                    pendingTaskCount={todaysTasks.length}
                    onQuickAdd={() => open()}
                    onViewAll={() => {
                        setQuery("");
                        setPage("dayEntries");
                    }}
                    onAddTask={() => open("task")}
                    onOpenFinance={() => setPage("finance")}
                    recentEntries={
                        items.slice(0, 5).length ? (
                            items
                                .slice(0, 5)
                                .map((item) => (
                                    <RecordRow
                                        key={item.id}
                                        item={item}
                                        categories={categories}
                                        language={language}
                                        onEdit={() => open(item.kind, item)}
                                        onDelete={() => void remove(item)}
                                        onToggleTask={
                                            item.kind === "task"
                                                ? () => void toggleTask(item)
                                                : undefined
                                        }
                                    />
                                ))
                        ) : (
                            <Empty
                                icon={<FileText />}
                                title="Henüz kayıt yok"
                                text="İlk kaydını ekleyerek başlayabilirsin."
                            />
                        )
                    }
                    pendingTasks={
                        todaysTasks.length ? (
                            todaysTasks.slice(0, 4).map((task) => (
                                <button
                                    key={task.id}
                                    className="task-line"
                                    onClick={() => void toggleTask(task)}
                                >
                                    <span className="check-circle" />
                                    <span>{task.title}</span>
                                    <ChevronRight size={15} />
                                </button>
                            ))
                        ) : (
                            <Empty
                                icon={<Check />}
                                title={text("Her şey yolunda")}
                                text={text("Bugün için bekleyen görevin yok.")}
                            />
                        )
                    }
                />
            )}
            {page === "dayEntries" && (
                <TodayEntriesPage
                    backLabel={
                        language === "en"
                            ? "Back to overview"
                            : "Genel bakışa dön"
                    }
                    dateLabel={format(todayDate, "EEEE, d MMMM yyyy", {
                        locale: language === "en" ? undefined : tr,
                    })}
                    title={pageLabel("dayEntries")}
                    countLabel={
                        language === "en"
                            ? `${todayEntries.length} entries for today`
                            : `Bugün ${todayEntries.length} kayıt`
                    }
                    onBack={() => setPage("home")}
                >
                    <RecordList
                        language={language}
                        items={todayEntries}
                        categories={categories}
                        onEdit={(i) => open(i.kind, i)}
                        onDelete={remove}
                        onToggleTask={(i) => {
                            if (i.kind === "task") void toggleTask(i);
                        }}
                        query={query}
                        setQuery={setQuery}
                        showTimestamp
                    />
                </TodayEntriesPage>
            )}
            {page === "calendar" && (
                <CalendarPage
                    language={language}
                    title={pageLabel("calendar")}
                    eyebrow={text("GEÇMİŞİNE GÖZ AT")}
                    monthLabel={fmtMonth(calendarMonth)}
                    month={calendarMonth}
                    daysInMonth={daysInMonth}
                    offset={offset}
                    today={today}
                    selectedDate={selectedDate}
                    datesWithEntries={
                        new Set(items.map((item) => item.localDate))
                    }
                    onPreviousMonth={() =>
                        setCalendarMonth(subMonths(calendarMonth, 1))
                    }
                    onNextMonth={() =>
                        setCalendarMonth(addMonths(calendarMonth, 1))
                    }
                    onSelectDate={setSelectedDate}
                >
                    <CalendarDayReport
                        date={selectedDate}
                        items={items}
                        categories={categories}
                        habits={habits}
                        completedHabitIds={completedHabitIds}
                        language={language}
                        onEdit={(item) => open(item.kind, item)}
                        onDelete={(item) => void remove(item)}
                        onToggleTask={(task) => void toggleTask(task)}
                    />
                </CalendarPage>
            )}
            {page === "finance" && (
                <FinancePage
                    categories={categories}
                    language={language}
                    month={financeMonth}
                    monthSpent={financeMonthSpent}
                    monthTransactions={monthTransactions}
                    onMonthChange={setFinanceMonth}
                    onAddExpense={() => open("expense")}
                    onExportCsv={exportCsv}
                    expenseEmptyState={
                        <Empty
                            icon={<BarChart3 />}
                            title="Henüz harcama yok"
                            text="İşlemlerin burada görünecek."
                        />
                    }
                    transactionList={
                        <RecordList
                            language={language}
                            items={filtered}
                            categories={categories}
                            onEdit={(item) => open(item.kind, item)}
                            onDelete={remove}
                            query={query}
                            setQuery={setQuery}
                            finance
                            showTimestamp
                        />
                    }
                />
            )}
            {(page === "journal" || page === "tasks") && (
                <JournalTasksPage
                    isTasks={page === "tasks"}
                    language={language}
                    title={pageLabel(page)}
                    onAdd={() => open(page === "journal" ? "activity" : "task")}
                >
                    <RecordList
                        language={language}
                        items={filtered}
                        categories={categories}
                        onEdit={(item) => open(item.kind, item)}
                        onDelete={remove}
                        onToggleTask={(item) => {
                            if (item.kind === "task") void toggleTask(item);
                        }}
                        query={query}
                        setQuery={setQuery}
                    />
                </JournalTasksPage>
            )}
            {page === "habits" && (
                <HabitsPage
                    language={language}
                    onRefresh={refresh}
                    onNotice={notify}
                />
            )}
            {page === "assets" && (
                <AssetsPage language={language} onNotice={notify} />
            )}
            {page === "stats" && (
                <StatisticsPage
                    language={language}
                    title={pageLabel("stats")}
                    income={amountText(monthIncome)}
                    expenses={amountText(monthSpent)}
                    balance={balanceText(monthIncome - monthSpent)}
                    incomeCategories={incomeCategories}
                    expenseCategories={expenseCategories}
                    monthEntries={selectMonthEntryCount(items, monthPrefix)}
                    habitCompletion={
                        habits.length
                            ? `${Math.round((completions.length / habits.length) * 100)}%`
                            : "—"
                    }
                    habitCountLabel={
                        language === "en"
                            ? `${completions.length} / ${habits.length} completed`
                            : `${completions.length} / ${habits.length} tamamlandı`
                    }
                    monthActivities={selectMonthActivityCount(
                        items,
                        monthPrefix,
                    )}
                    emptyIncome={
                        !monthIncome ? (
                            <Empty
                                icon={<ArrowUpRight />}
                                title={text("Henüz gelir kaydı yok")}
                                text={text(
                                    "Gelirlerin burada kategoriye göre özetlenir.",
                                )}
                            />
                        ) : null
                    }
                    emptyExpenses={
                        !monthSpent ? (
                            <Empty
                                icon={<ArrowDownLeft />}
                                title={text("Henüz gider kaydı yok")}
                                text={text(
                                    "Harcamaların burada kategoriye göre özetlenir.",
                                )}
                            />
                        ) : null
                    }
                />
            )}
            {page === "settings" && (
                <SettingsPage
                    language={language}
                    theme={theme}
                    accent={accent}
                    title={pageLabel("settings")}
                    categories={categories}
                    onLanguageChange={setLanguage}
                    onThemeChange={setTheme}
                    onAccentChange={changeAccent}
                    onExportJson={exportJson}
                    onImportFile={(file) => void importJson(file)}
                    onExportCsv={exportCsv}
                    onCategoryColorChange={(categoryId, color) =>
                        void updateCategoryColor(categoryId, color)
                    }
                    onAddCategory={addCategory}
                />
            )}
        </>
    );
}

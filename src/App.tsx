import { useCallback, useEffect, useState } from "react";
import {
    Activity,
    ArrowDownLeft,
    ArrowUpRight,
    BarChart3,
    CalendarDays,
    Check,
    ChevronRight,
    FileText,
    Gem,
    Home,
    Languages,
    ListTodo,
    Moon,
    MoreHorizontal,
    Plus,
    Settings,
    Sun,
    Trash2,
    Wallet,
    X,
} from "lucide-react";
import { format, addMonths, subMonths, getDaysInMonth, getDay } from "date-fns";
import { tr } from "date-fns/locale";
import { db, records } from "./db";
import {
    localDate,
    localDateTime,
    money,
    uid,
    type Category,
    type Entry,
    type Habit,
    type JournalEntry,
    type Task,
    type Transaction,
    type RecordKind,
} from "./domain";
import HabitsPage from "./components/habits/HabitsPage";
import AssetsPage from "./components/assets/AssetsPage";
import TodayEntriesPage from "./components/entries/TodayEntriesPage";
import todayEntriesStyles from "./components/entries/TodayEntriesPage.module.css";
import FinancePage from "./components/finance/FinancePage";
import HomePage from "./components/home/HomePage";
import CalendarPage from "./components/calendar/CalendarPage";
import CalendarDayReport from "./components/calendar/CalendarDayReport";
import { Empty, RecordList, RecordRow } from "./components/entries/EntryList";
import {
    categoryDisplay,
    entryTimestamp,
} from "./components/entries/entryUtils";
import JournalTasksPage from "./components/journal/JournalTasksPage";
import StatisticsPage from "./components/statistics/StatisticsPage";
import SettingsPage, {
    CategoryColorPicker,
} from "./components/settings/SettingsPage";
import { t, type Language } from "./i18n";

type Page =
    | "home"
    | "finance"
    | "calendar"
    | "journal"
    | "tasks"
    | "habits"
    | "assets"
    | "stats"
    | "settings"
    | "dayEntries";
const labels: Record<Page, string> = {
    home: "Genel Bakış",
    finance: "Finans",
    calendar: "Takvim",
    journal: "Günlük",
    tasks: "Görevler",
    habits: "Alışkanlıklar",
    assets: "Varlıklar",
    stats: "İstatistikler",
    settings: "Ayarlar",
    dayEntries: "Günün kayıtları",
};
const defaultCats = [
    { name: "Yemek", color: "#ec9a55" },
    { name: "Ulaşım", color: "#6091d5" },
    { name: "Ev", color: "#a080d0" },
    { name: "Alışveriş", color: "#dc7180" },
    { name: "Sağlık", color: "#51a989" },
    { name: "Diğer", color: "#8c99a8" },
];
const initialCategories = async () => {
    if (!(await db.categories.count()))
        await db.categories.bulkAdd([
            ...defaultCats.map((c) => ({
                ...c,
                id: uid(),
                kind: "expense" as const,
                localDate: localDate(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            })),
            ...["Maaş", "Diğer gelir"].map((name) => ({
                id: uid(),
                name,
                kind: "income" as const,
                color: "#51a989",
                localDate: localDate(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            })),
        ]);
};
const amountText = (minor: number) => money(minor);
const balanceText = (minor: number) =>
    amountText(minor).replace(/^([−-])(?=₺)/, "$1 ");

function App() {
    const [page, setPage] = useState<Page>("home"),
        [items, setItems] = useState<Entry[]>([]),
        [categories, setCategories] = useState<Category[]>([]),
        [habits, setHabits] = useState<Habit[]>([]),
        [completions, setCompletions] = useState<string[]>([]);
    const [modal, setModal] = useState(false),
        [editing, setEditing] = useState<Entry | null>(null),
        [kind, setKind] = useState<RecordKind>("expense"),
        [query, setQuery] = useState(""),
        [moreOpen, setMoreOpen] = useState(false);
    const [deleteCandidate, setDeleteCandidate] = useState<Entry | null>(null),
        [categoryDialog, setCategoryDialog] = useState(false),
        [categoryName, setCategoryName] = useState(""),
        [categoryColor, setCategoryColor] = useState("#65a784");
    const [theme, setTheme] = useState(
            localStorage.getItem("lm-theme") || "light",
        ),
        [accent, setAccent] = useState<"green" | "blue">(() =>
            localStorage.getItem("lm-accent") === "blue" ? "blue" : "green",
        ),
        [month, setMonth] = useState(new Date()),
        [notice, setNotice] = useState("");
    const [language, setLanguage] = useState<Language>(() =>
        localStorage.getItem("lm-language") === "en" ? "en" : "tr",
    );
    const text = (value: string) => t(value, language);
    const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>([]);
    const pageLabel = (p: Page) =>
        p === "dayEntries" && language === "en"
            ? "Today's entries"
            : text(labels[p]);
    const refresh = useCallback(async () => {
        await initialCategories();
        const [all, cats, hs, done] = await Promise.all([
            records.all(),
            db.categories.toArray(),
            db.habits.toArray(),
            db.completions.where("localDate").equals(localDate()).toArray(),
        ]);
        setItems(all.sort((a, b) => b.localDate.localeCompare(a.localDate)));
        setCategories(cats);
        setHabits(hs.filter((h) => !h.archived));
        setCompletions(
            done.filter((d) => d.status !== "skipped").map((d) => d.habitId),
        );
    }, []);
    useEffect(() => {
        void refresh();
    }, [refresh]);
    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        document.documentElement.dataset.accent = accent;
        localStorage.setItem("lm-theme", theme);
        localStorage.setItem("lm-accent", accent);
        localStorage.setItem("lm-language", language);
    }, [theme, accent, language]);
    const changeAccent = (nextAccent: "green" | "blue") => {
        document.documentElement.dataset.accent = nextAccent;
        localStorage.setItem("lm-accent", nextAccent);
        setAccent(nextAccent);
    };
    useEffect(() => {
        if (!notice) return;
        const t = setTimeout(() => setNotice(""), 2800);
        return () => clearTimeout(t);
    }, [notice]);
    const today = localDate(),
        monthPrefix = today.slice(0, 7);
    const calendarDate = query.match(/^\d{4}-\d{2}-\d{2}$/) ? query : today;
    useEffect(() => {
        let active = true;
        void db.completions
            .where("localDate")
            .equals(calendarDate)
            .toArray()
            .then((rows) => {
                if (active)
                    setSelectedHabitIds(
                        rows
                            .filter((row) => row.status !== "skipped")
                            .map((row) => row.habitId),
                    );
            });
        return () => {
            active = false;
        };
    }, [calendarDate]);
    const todayItems = items.filter((i) => i.localDate === today),
        todaysTasks = todayItems.filter(
            (i): i is Task => i.kind === "task" && !i.completed,
        ),
        tx = items.filter(
            (i): i is Transaction =>
                i.kind === "expense" || i.kind === "income",
        );
    const todayEntries = todayItems
        .filter(
            (item) =>
                !query ||
                JSON.stringify(item)
                    .toLocaleLowerCase("tr")
                    .includes(query.toLocaleLowerCase("tr")),
        )
        .sort(
            (a, b) =>
                new Date(entryTimestamp(b)).getTime() -
                new Date(entryTimestamp(a)).getTime(),
        );
    const todaySpent = tx
            .filter((i) => i.kind === "expense" && i.localDate === today)
            .reduce((s, i) => s + i.amountMinor, 0),
        todayIncome = tx
            .filter((i) => i.kind === "income" && i.localDate === today)
            .reduce((s, i) => s + i.amountMinor, 0);
    const monthSpent = tx
        .filter(
            (i) => i.kind === "expense" && i.localDate.startsWith(monthPrefix),
        )
        .reduce((s, i) => s + i.amountMinor, 0);
    const monthIncome = tx
        .filter(
            (i) => i.kind === "income" && i.localDate.startsWith(monthPrefix),
        )
        .reduce((s, i) => s + i.amountMinor, 0);
    const open = (k: RecordKind = "expense", item: Entry | null = null) => {
        setKind(k);
        setEditing(item);
        setModal(true);
    };
    const availableEntryKinds: RecordKind[] =
        page === "finance"
            ? ["expense", "income"]
            : page === "journal"
              ? ["activity", "note"]
              : page === "tasks"
                ? ["task"]
                : ["expense", "income", "activity", "note", "task"];
    const quickAdd = () =>
        open(
            page === "journal"
                ? "activity"
                : page === "tasks"
                  ? "task"
                  : "expense",
        );
    const save = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget),
            now = new Date().toISOString(),
            id = editing?.id || uid(),
            date = String(f.get("date") || today),
            common = {
                id,
                localDate: date,
                createdAt: editing?.createdAt || now,
                updatedAt: now,
            };
        try {
            if (kind === "expense" || kind === "income") {
                const value = Number(String(f.get("amount")).replace(",", "."));
                if (!Number.isFinite(value) || value <= 0)
                    throw new Error("Geçerli bir tutar girin.");
                const occurredAt = String(f.get("dateTime") || localDateTime());
                const r: Transaction = {
                    ...common,
                    localDate: occurredAt.slice(0, 10),
                    kind,
                    amountMinor: Math.round(value * 100),
                    categoryId: String(f.get("category") || ""),
                    description: String(f.get("description") || ""),
                    occurredAt,
                };
                await db.transactions.put(r);
            } else if (kind === "activity" || kind === "note") {
                const title = String(f.get("title") || "").trim();
                if (!title) throw new Error("Başlık gerekli.");
                const occurredAt = String(f.get("dateTime") || localDateTime());
                const r: JournalEntry = {
                    ...common,
                    localDate: occurredAt.slice(0, 10),
                    kind,
                    title,
                    body: String(f.get("body") || ""),
                    category: String(f.get("category") || ""),
                    occurredAt,
                    ...(f.get("duration")
                        ? { durationMinutes: Number(f.get("duration")) }
                        : {}),
                };
                await db.journal.put(r);
            } else {
                const title = String(f.get("title") || "").trim();
                if (!title) throw new Error("Görev başlığı gerekli.");
                const r: Task = {
                    ...common,
                    kind: "task",
                    title,
                    dueDate: String(f.get("dueDate") || ""),
                    priority: String(
                        f.get("priority") || "medium",
                    ) as Task["priority"],
                    completed:
                        editing?.kind === "task" ? editing.completed : false,
                };
                await db.tasks.put(r);
            }
            setModal(false);
            setEditing(null);
            await refresh();
            setNotice(text("Kaydedildi"));
        } catch (error) {
            setNotice(
                error instanceof Error
                    ? text(error.message)
                    : text("Kayıt sırasında hata oluştu"),
            );
        }
    };
    const remove = async (i: Entry) => {
        setDeleteCandidate(i);
    };
    const confirmRemove = async () => {
        if (!deleteCandidate) return;
        const item = deleteCandidate;
        setDeleteCandidate(null);
        setModal(false);
        setEditing(null);
        await records.remove(item.id, item.kind);
        await refresh();
        setNotice(text("Kayıt silindi"));
    };
    const toggleTask = async (task: Task) => {
        await db.tasks.put({
            ...task,
            completed: !task.completed,
            updatedAt: new Date().toISOString(),
        });
        await refresh();
    };
    const download = (name: string, text: string, type: string) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([text], { type }));
        a.download = name;
        a.click();
        URL.revokeObjectURL(a.href);
    };
    const exportJson = async () => {
        const [
            transactions,
            journal,
            tasks,
            habits,
            completions,
            categories,
            assetHoldings,
            assetTypes,
        ] = await Promise.all([
            db.transactions.toArray(),
            db.journal.toArray(),
            db.tasks.toArray(),
            db.habits.toArray(),
            db.completions.toArray(),
            db.categories.toArray(),
            db.assetHoldings.toArray(),
            db.assetTypes.toArray(),
        ]);
        download(
            `life-manager-${today}.json`,
            JSON.stringify(
                {
                    format: "life-manager-backup",
                    version: 1,
                    exportedAt: new Date().toISOString(),
                    data: {
                        transactions,
                        journal,
                        tasks,
                        habits,
                        completions,
                        categories,
                        assetHoldings,
                        assetTypes,
                    },
                },
                null,
                2,
            ),
            "application/json",
        );
    };
    const importJson = async (file: File) => {
        try {
            const b = JSON.parse(await file.text());
            if (
                b.format !== "life-manager-backup" ||
                b.version !== 1 ||
                !b.data
            )
                throw Error("Yedek biçimi tanınmıyor.");
            const d = b.data;
            for (const key of [
                "transactions",
                "journal",
                "tasks",
                "habits",
                "completions",
                "categories",
            ] as const) {
                if (!Array.isArray(d[key]))
                    throw Error(`Yedek verisi eksik: ${key}`);
                for (const row of d[key])
                    if (!row.id || !row.localDate)
                        throw Error(`Geçersiz kayıt: ${key}`);
            }
            if (
                d.assetHoldings !== undefined &&
                !Array.isArray(d.assetHoldings)
            )
                throw Error("Invalid asset holdings in backup.");
            const assetHoldings = Array.isArray(d.assetHoldings)
                ? d.assetHoldings
                : [];
            for (const holding of assetHoldings)
                if (
                    !holding.id ||
                    !holding.localDate ||
                    !holding.assetType ||
                    !holding.unit ||
                    !Number.isFinite(holding.quantity) ||
                    holding.quantity <= 0
                )
                    throw Error("Invalid asset holding in backup.");
            if (d.assetTypes !== undefined && !Array.isArray(d.assetTypes))
                throw Error("Invalid asset types in backup.");
            const assetTypes = Array.isArray(d.assetTypes) ? d.assetTypes : [];
            for (const type of assetTypes)
                if (!type.id || !type.name)
                    throw Error("Invalid asset type in backup.");
            const mode = confirm(
                "Tamam ile birleştir, İptal ile mevcut veriyi silip yedeği yükle?",
            );
            const tables = [
                db.transactions,
                db.journal,
                db.tasks,
                db.habits,
                db.completions,
                db.categories,
                db.assetHoldings,
                db.assetTypes,
            ];
            await db.transaction("rw", tables, async () => {
                if (!mode) await Promise.all(tables.map((t) => t.clear()));
                await db.transactions.bulkPut(d.transactions);
                await db.journal.bulkPut(d.journal);
                await db.tasks.bulkPut(d.tasks);
                await db.habits.bulkPut(d.habits);
                await db.completions.bulkPut(d.completions);
                await db.categories.bulkPut(d.categories);
                await db.assetHoldings.bulkPut(assetHoldings);
                await db.assetTypes.bulkPut(assetTypes);
            });
            await refresh();
            setNotice(text("Yedek başarıyla içe aktarıldı"));
        } catch (e) {
            setNotice(
                e instanceof Error
                    ? text(e.message)
                    : text("Yedek içe aktarılamadı"),
            );
        }
    };
    const exportCsv = () => {
        const rows = [
            ["Tarih", "Tür", "Tutar (kuruş)", "Kategori", "Açıklama"],
            ...tx.map((r) => [
                r.localDate,
                r.kind,
                String(r.amountMinor),
                categories.find((c) => c.id === r.categoryId)?.name || "",
                r.description,
            ]),
        ];
        download(
            `finans-${today}.csv`,
            "\uFEFF" +
                rows
                    .map((r) =>
                        r
                            .map((v) => `"${String(v).replaceAll('"', '""')}"`)
                            .join(";"),
                    )
                    .join("\n"),
            "text/csv;charset=utf-8",
        );
    };
    const filtered = items
        .filter((i) =>
            page === "finance"
                ? i.kind === "expense" || i.kind === "income"
                : page === "journal"
                  ? i.kind === "activity" || i.kind === "note"
                  : page === "tasks"
                    ? i.kind === "task"
                    : true,
        )
        .filter(
            (i) =>
                !query ||
                JSON.stringify(i)
                    .toLocaleLowerCase("tr")
                    .includes(query.toLocaleLowerCase("tr")),
        );
    const fmtMonth = (d: Date) =>
        format(d, "MMMM yyyy", { locale: language === "en" ? undefined : tr });
    const daysInMonth = getDaysInMonth(month),
        offset =
            (getDay(new Date(month.getFullYear(), month.getMonth(), 1)) + 6) %
            7;
    const monthTx = tx.filter((i) =>
        i.localDate.startsWith(format(month, "yyyy-MM")),
    );

    return (
        <div className="app-shell">
            <aside className="sidebar">
                <div className="brand">
                    <div className="brand-mark">L</div>
                    <span>lifemanager</span>
                </div>
                <div className="side-label">
                    {language === "en" ? "MENU" : "MENÜ"}
                </div>
                {(
                    [
                        "home",
                        "finance",
                        "calendar",
                        "journal",
                        "tasks",
                        "habits",
                        "assets",
                        "stats",
                    ] as Page[]
                ).map((p, i) => {
                    const Icon = [
                        Home,
                        Wallet,
                        CalendarDays,
                        FileText,
                        ListTodo,
                        Activity,
                        Gem,
                        BarChart3,
                    ][i];
                    return (
                        <button
                            key={p}
                            className={`nav-item ${page === p ? "active" : ""}`}
                            onClick={() => setPage(p)}
                        >
                            <Icon size={19} />
                            {pageLabel(p)}
                        </button>
                    );
                })}
                <div className="side-bottom">
                    <button
                        className={`nav-item ${page === "settings" ? "active" : ""}`}
                        onClick={() => setPage("settings")}
                    >
                        <Settings size={19} />
                        {pageLabel("settings")}
                    </button>
                    <div className="privacy-note">
                        {language === "en"
                            ? "◈ Your data is safe on this device."
                            : "◈ Verileriniz bu cihazda güvende."}
                    </div>
                </div>
            </aside>
            <main className="main">
                <header className="topbar">
                    <div className="mobile-brand">
                        <div className="brand-mark">L</div>
                        <b>{pageLabel(page)}</b>
                    </div>
                    <div className="top-date">
                        {format(new Date(), "EEEE, d MMMM", {
                            locale: language === "en" ? undefined : tr,
                        })}
                    </div>
                    <div className="top-actions">
                        <button
                            className="icon-button language-button"
                            aria-label={
                                language === "en"
                                    ? "Switch language to Turkish"
                                    : "Switch language to English"
                            }
                            title={language === "en" ? "English" : "Türkçe"}
                            onClick={() =>
                                setLanguage(language === "en" ? "tr" : "en")
                            }
                        >
                            <Languages size={18} />
                            <span>{language.toUpperCase()}</span>
                        </button>
                        <button
                            className="icon-button"
                            aria-label={
                                language === "en"
                                    ? "Toggle appearance"
                                    : "Görünümü değiştir"
                            }
                            onClick={() =>
                                setTheme(theme === "light" ? "dark" : "light")
                            }
                        >
                            {theme === "light" ? (
                                <Moon size={18} />
                            ) : (
                                <Sun size={18} />
                            )}
                        </button>
                        <button
                            className="avatar"
                            onClick={() => setPage("settings")}
                        >
                            Y
                        </button>
                    </div>
                </header>
                <div
                    className={`content ${page === "dayEntries" ? todayEntriesStyles.content : ""}`}
                >
                    {page === "home" && (
                        <HomePage
                            language={language}
                            dateLabel={format(new Date(), "EEEE, d MMMM yyyy", {
                                locale: language === "en" ? undefined : tr,
                            })}
                            monthLabel={
                                language === "en"
                                    ? `${format(new Date(), "MMMM")} total`
                                    : `${format(new Date(), "MMMM", { locale: tr })} toplamı`
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
                                                onEdit={() =>
                                                    open(item.kind, item)
                                                }
                                                onDelete={() =>
                                                    void remove(item)
                                                }
                                                onToggleTask={
                                                    item.kind === "task"
                                                        ? () =>
                                                              void toggleTask(
                                                                  item,
                                                              )
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
                                            onClick={() =>
                                                void toggleTask(task)
                                            }
                                        >
                                            <span className="check-circle" />
                                            <span>{task.title}</span>
                                            <ChevronRight size={15} />
                                        </button>
                                    ))
                                ) : (
                                    <Empty
                                        icon={<Check />}
                                        title="Her şey yolunda"
                                        text="Bugün için bekleyen görevin yok."
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
                            dateLabel={format(
                                new Date(`${today}T12:00:00`),
                                "EEEE, d MMMM yyyy",
                                { locale: language === "en" ? undefined : tr },
                            )}
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
                            monthLabel={fmtMonth(month)}
                            month={month}
                            daysInMonth={daysInMonth}
                            offset={offset}
                            today={today}
                            selectedDate={query}
                            datesWithEntries={items.map(
                                (item) => item.localDate,
                            )}
                            onPreviousMonth={() =>
                                setMonth(subMonths(month, 1))
                            }
                            onNextMonth={() => setMonth(addMonths(month, 1))}
                            onSelectDate={setQuery}
                        >
                            <CalendarDayReport
                                date={calendarDate}
                                items={items}
                                categories={categories}
                                habits={habits}
                                completedHabitIds={selectedHabitIds}
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
                            month={month}
                            monthSpent={monthSpent}
                            monthTransactions={monthTx}
                            onMonthChange={setMonth}
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
                                />
                            }
                        />
                    )}
                    {(page === "journal" || page === "tasks") && (
                        <JournalTasksPage
                            isTasks={page === "tasks"}
                            language={language}
                            title={pageLabel(page)}
                            onAdd={() =>
                                open(page === "journal" ? "activity" : "task")
                            }
                        >
                            <RecordList
                                language={language}
                                items={filtered}
                                categories={categories}
                                onEdit={(item) => open(item.kind, item)}
                                onDelete={remove}
                                onToggleTask={(item) => {
                                    if (item.kind === "task")
                                        void toggleTask(item);
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
                            onNotice={setNotice}
                        />
                    )}
                    {page === "assets" && (
                        <AssetsPage language={language} onNotice={setNotice} />
                    )}
                    {page === "stats" && (
                        <StatisticsPage
                            language={language}
                            title={pageLabel("stats")}
                            income={amountText(monthIncome)}
                            expenses={amountText(monthSpent)}
                            balance={balanceText(monthIncome - monthSpent)}
                            incomeCategories={categories
                                .filter(
                                    (category) => category.kind === "income",
                                )
                                .map((category) => ({
                                    id: category.id,
                                    name: categoryDisplay(
                                        category.name,
                                        language,
                                    ),
                                    color: category.color,
                                    amount: money(
                                        monthTx
                                            .filter(
                                                (item) =>
                                                    item.kind === "income" &&
                                                    item.categoryId ===
                                                        category.id,
                                            )
                                            .reduce(
                                                (sum, item) =>
                                                    sum + item.amountMinor,
                                                0,
                                            ),
                                    ),
                                    total: monthTx
                                        .filter(
                                            (item) =>
                                                item.kind === "income" &&
                                                item.categoryId === category.id,
                                        )
                                        .reduce(
                                            (sum, item) =>
                                                sum + item.amountMinor,
                                            0,
                                        ),
                                }))
                                .filter((category) => category.total > 0)}
                            expenseCategories={categories
                                .filter(
                                    (category) => category.kind === "expense",
                                )
                                .map((category) => ({
                                    id: category.id,
                                    name: categoryDisplay(
                                        category.name,
                                        language,
                                    ),
                                    color: category.color,
                                    amount: money(
                                        monthTx
                                            .filter(
                                                (item) =>
                                                    item.kind === "expense" &&
                                                    item.categoryId ===
                                                        category.id,
                                            )
                                            .reduce(
                                                (sum, item) =>
                                                    sum + item.amountMinor,
                                                0,
                                            ),
                                    ),
                                    total: monthTx
                                        .filter(
                                            (item) =>
                                                item.kind === "expense" &&
                                                item.categoryId === category.id,
                                        )
                                        .reduce(
                                            (sum, item) =>
                                                sum + item.amountMinor,
                                            0,
                                        ),
                                }))
                                .filter((category) => category.total > 0)}
                            monthEntries={
                                items.filter((item) =>
                                    item.localDate.startsWith(monthPrefix),
                                ).length
                            }
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
                            monthActivities={
                                items.filter(
                                    (item) =>
                                        item.kind === "activity" &&
                                        item.localDate.startsWith(monthPrefix),
                                ).length
                            }
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
                                void db.categories
                                    .update(categoryId, {
                                        color,
                                        updatedAt: new Date().toISOString(),
                                    })
                                    .then(refresh)
                            }
                            onAddCategory={() => {
                                setCategoryName("");
                                setCategoryColor("#65a784");
                                setCategoryDialog(true);
                            }}
                        />
                    )}
                </div>
                <nav className="bottom-nav">
                    {(["home", "finance", "calendar", "journal"] as Page[]).map(
                        (p, i) => {
                            const Icon = [Home, Wallet, CalendarDays, FileText][
                                i
                            ];
                            return (
                                <button
                                    key={p}
                                    className={page === p ? "selected" : ""}
                                    onClick={() => {
                                        setPage(p);
                                        setMoreOpen(false);
                                    }}
                                >
                                    <Icon size={20} />
                                    <span>{pageLabel(p)}</span>
                                </button>
                            );
                        },
                    )}
                    <button
                        className={
                            [
                                "tasks",
                                "habits",
                                "assets",
                                "stats",
                                "settings",
                            ].includes(page)
                                ? "selected"
                                : ""
                        }
                        onClick={() => setMoreOpen(!moreOpen)}
                    >
                        <MoreHorizontal size={20} />
                        <span>{text("Daha")}</span>
                    </button>
                </nav>
                {moreOpen && (
                    <div className="more-menu">
                        {(
                            [
                                "tasks",
                                "habits",
                                "assets",
                                "stats",
                                "settings",
                            ] as Page[]
                        ).map((p, i) => {
                            const Icon = [
                                ListTodo,
                                Activity,
                                Gem,
                                BarChart3,
                                Settings,
                            ][i];
                            return (
                                <button
                                    key={p}
                                    onClick={() => {
                                        setPage(p);
                                        setMoreOpen(false);
                                    }}
                                >
                                    <Icon size={17} />
                                    {pageLabel(p)}
                                </button>
                            );
                        })}
                    </div>
                )}
                {!["habits", "assets", "settings"].includes(page) && (
                    <button
                        className="fab"
                        aria-label={
                            language === "en"
                                ? "Add quick entry"
                                : "Hızlı kayıt ekle"
                        }
                        onClick={quickAdd}
                    >
                        <Plus size={26} />
                    </button>
                )}
            </main>
            {categoryDialog && (
                <div
                    className="modal-backdrop"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget)
                            setCategoryDialog(false);
                    }}
                >
                    <section
                        className="category-dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="category-dialog-title"
                    >
                        <div className="sheet-head">
                            <h2 id="category-dialog-title">
                                {text("Gider kategorisi ekle")}
                            </h2>
                            <button
                                className="icon-button"
                                onClick={() => setCategoryDialog(false)}
                                aria-label={text("Kapat")}
                            >
                                <X />
                            </button>
                        </div>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const name = categoryName.trim();
                                if (!name) return;
                                const now = new Date().toISOString();
                                void db.categories
                                    .add({
                                        id: uid(),
                                        name,
                                        kind: "expense",
                                        color: categoryColor,
                                        localDate: today,
                                        createdAt: now,
                                        updatedAt: now,
                                    })
                                    .then(() => {
                                        setCategoryDialog(false);
                                        setCategoryName("");
                                        return refresh();
                                    });
                            }}
                        >
                            <label>
                                {text("Kategori adı?")}
                                <input
                                    autoFocus
                                    value={categoryName}
                                    onChange={(e) =>
                                        setCategoryName(e.target.value)
                                    }
                                    required
                                />
                            </label>
                            <div className="category-color-field">
                                <span>{text("Kategori rengi")}</span>
                                <CategoryColorPicker
                                    value={categoryColor}
                                    label={text("Kategori rengi")}
                                    onChange={setCategoryColor}
                                />
                            </div>
                            <div className="category-dialog-actions">
                                <button
                                    type="button"
                                    className="secondary"
                                    onClick={() => setCategoryDialog(false)}
                                >
                                    {text("İptal")}
                                </button>
                                <button className="primary" type="submit">
                                    {text("Ekle")}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
            {notice && (
                <div className="toast" role="status">
                    <Check size={17} />
                    {notice}
                    <button onClick={() => setNotice("")}>
                        <X size={15} />
                    </button>
                </div>
            )}
            {modal && (
                <div
                    className="modal-backdrop"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) setModal(false);
                    }}
                >
                    <section
                        className="entry-sheet"
                        role="dialog"
                        aria-modal="true"
                        aria-label={text("Yeni kayıt")}
                    >
                        <div className="sheet-handle" />
                        <div className="sheet-head">
                            <div>
                                <div className="eyebrow">
                                    {text("HIZLI KAYIT")}
                                </div>
                                <h2>
                                    {text(
                                        editing
                                            ? "Kaydı düzenle"
                                            : "Aklında kalmasın",
                                    )}
                                </h2>
                            </div>
                            <button
                                className="icon-button"
                                onClick={() => setModal(false)}
                                aria-label={text("Kapat")}
                            >
                                <X />
                            </button>
                        </div>
                        <div className="type-tabs">
                            {(editing
                                ? [editing.kind]
                                : availableEntryKinds
                            ).map((k) => (
                                <button
                                    className={kind === k ? "active" : ""}
                                    onClick={() => {
                                        setKind(k);
                                        if (editing) setEditing(null);
                                    }}
                                    key={k}
                                >
                                    {text(
                                        k === "expense"
                                            ? "Gider"
                                            : k === "income"
                                              ? "Gelir"
                                              : k === "activity"
                                                ? "Aktivite"
                                                : k === "note"
                                                  ? "Not"
                                                  : "Görev",
                                    )}
                                </button>
                            ))}
                        </div>
                        <form onSubmit={save}>
                            <input
                                type="hidden"
                                name="date"
                                value={editing?.localDate || today}
                            />
                            {kind === "expense" || kind === "income" ? (
                                <>
                                    <label>
                                        {text("Tutar")} <span>(₺)</span>
                                        <input
                                            autoFocus
                                            type="number"
                                            name="amount"
                                            inputMode="decimal"
                                            min="0.01"
                                            step="0.01"
                                            placeholder="0,00"
                                            defaultValue={
                                                editing &&
                                                "amountMinor" in editing
                                                    ? editing.amountMinor / 100
                                                    : ""
                                            }
                                            required
                                        />
                                    </label>
                                    <label>
                                        {text("Kategori")}
                                        <select
                                            name="category"
                                            defaultValue={
                                                editing &&
                                                "categoryId" in editing
                                                    ? editing.categoryId
                                                    : categories.find(
                                                          (c) =>
                                                              c.kind === kind,
                                                      )?.id
                                            }
                                        >
                                            {categories
                                                .filter((c) => c.kind === kind)
                                                .map((c) => (
                                                    <option
                                                        value={c.id}
                                                        key={c.id}
                                                    >
                                                        {categoryDisplay(
                                                            c.name,
                                                            language,
                                                        )}
                                                    </option>
                                                ))}
                                            {categories.filter(
                                                (c) => c.kind === kind,
                                            ).length === 0 && (
                                                <option value="">
                                                    {text("Diğer")}
                                                </option>
                                            )}
                                        </select>
                                    </label>
                                    <label>
                                        {text("Açıklama ")}
                                        <span>{text("(isteğe bağlı)")}</span>
                                        <input
                                            name="description"
                                            placeholder="Örn. Öğle yemeği"
                                            defaultValue={
                                                editing &&
                                                "description" in editing
                                                    ? editing.description
                                                    : ""
                                            }
                                        />
                                    </label>
                                    <label>
                                        {text("Tarih ve saat")}
                                        <input
                                            name="dateTime"
                                            type="datetime-local"
                                            defaultValue={
                                                editing &&
                                                "occurredAt" in editing
                                                    ? editing.occurredAt.slice(
                                                          0,
                                                          16,
                                                      )
                                                    : localDateTime()
                                            }
                                        />
                                    </label>
                                </>
                            ) : kind === "activity" || kind === "note" ? (
                                <>
                                    <label>
                                        {text(
                                            kind === "activity"
                                                ? "Aktivite başlığı"
                                                : "Not başlığı",
                                        )}
                                        <input
                                            autoFocus
                                            name="title"
                                            placeholder={
                                                language === "en"
                                                    ? kind === "activity"
                                                        ? "e.g. Worked on a project"
                                                        : "Give your note a title"
                                                    : kind === "activity"
                                                      ? "Örn. Proje üzerinde çalıştım"
                                                      : "Notunu başlıklandır"
                                            }
                                            defaultValue={
                                                editing && "title" in editing
                                                    ? editing.title
                                                    : ""
                                            }
                                            required
                                        />
                                    </label>
                                    <label>
                                        {text("Detaylar")}{" "}
                                        <span>{text("(isteğe bağlı)")}</span>
                                        <textarea
                                            name="body"
                                            rows={3}
                                            placeholder={
                                                language === "en"
                                                    ? "Add a little more detail..."
                                                    : "Biraz daha detay ekle..."
                                            }
                                            defaultValue={
                                                editing && "body" in editing
                                                    ? editing.body
                                                    : ""
                                            }
                                        />
                                    </label>
                                    {kind === "activity" && (
                                        <label>
                                            {text("Süre ")}
                                            <span>
                                                {text("(dakika, isteğe bağlı)")}
                                            </span>
                                            <input
                                                type="number"
                                                min="1"
                                                name="duration"
                                                inputMode="numeric"
                                                placeholder="45"
                                                defaultValue={
                                                    editing &&
                                                    "durationMinutes" in editing
                                                        ? editing.durationMinutes
                                                        : ""
                                                }
                                            />
                                        </label>
                                    )}
                                    <label>
                                        {text("Tarih ve saat")}
                                        <input
                                            name="dateTime"
                                            type="datetime-local"
                                            defaultValue={
                                                editing &&
                                                "occurredAt" in editing
                                                    ? editing.occurredAt.slice(
                                                          0,
                                                          16,
                                                      )
                                                    : localDateTime()
                                            }
                                        />
                                    </label>
                                </>
                            ) : (
                                <>
                                    <label>
                                        {text("Görev")}
                                        <input
                                            autoFocus
                                            name="title"
                                            placeholder="Ne yapman gerekiyor?"
                                            defaultValue={
                                                editing && "title" in editing
                                                    ? editing.title
                                                    : ""
                                            }
                                            required
                                        />
                                    </label>
                                    <label>
                                        {text("Öncelik")}
                                        <select
                                            name="priority"
                                            defaultValue={
                                                editing && "priority" in editing
                                                    ? editing.priority
                                                    : "medium"
                                            }
                                        >
                                            <option value="low">
                                                {text("Düşük")}
                                            </option>
                                            <option value="medium">
                                                Normal
                                            </option>
                                            <option value="high">
                                                {text("Yüksek")}
                                            </option>
                                        </select>
                                    </label>
                                    <label>
                                        {text("Son tarih")}{" "}
                                        <span>{text("(isteğe bağlı)")}</span>
                                        <input
                                            type="date"
                                            name="dueDate"
                                            defaultValue={
                                                editing && "dueDate" in editing
                                                    ? editing.dueDate
                                                    : ""
                                            }
                                        />
                                    </label>
                                </>
                            )}
                            <div className="form-actions">
                                {editing && (
                                    <button
                                        type="button"
                                        className="danger-button"
                                        onClick={() => void remove(editing)}
                                    >
                                        <Trash2 size={17} /> Sil
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="secondary"
                                    onClick={() => setModal(false)}
                                >
                                    {text("Vazgeç")}
                                </button>
                                <button className="primary" type="submit">
                                    <Check size={17} />
                                    {text(
                                        editing
                                            ? "Değişiklikleri kaydet"
                                            : "Kaydet",
                                    )}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
            {deleteCandidate && (
                <div
                    className="modal-backdrop confirm-backdrop"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget)
                            setDeleteCandidate(null);
                    }}
                >
                    <section
                        className="confirm-sheet"
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="delete-confirm-title"
                        aria-describedby="delete-confirm-description"
                    >
                        <div className="confirm-icon">
                            <Trash2 size={20} />
                        </div>
                        <h2 id="delete-confirm-title">{text("Kaydı sil?")}</h2>
                        <p id="delete-confirm-description">
                            {text("Bu kaydı silmek istediğinize emin misiniz?")}
                        </p>
                        <div className="confirm-actions">
                            <button
                                className="secondary"
                                onClick={() => setDeleteCandidate(null)}
                            >
                                {text("Vazgeç")}
                            </button>
                            <button
                                className="danger-button"
                                autoFocus
                                onClick={() => void confirmRemove()}
                            >
                                <Trash2 size={16} />
                                {text("Sil")}
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}

export default App;

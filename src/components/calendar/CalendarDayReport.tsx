import { FileText } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
    money,
    type Category,
    type Entry,
    type Habit,
    type JournalEntry,
    type Task,
    type Transaction,
} from "../../domain";
import type { Language } from "../../i18n";
import { RecordRow } from "../entries/EntryList";
import styles from "./CalendarPage.module.css";

export default function CalendarDayReport({
    date,
    items,
    categories,
    habits,
    completedHabitIds,
    language,
    onEdit,
    onDelete,
    onToggleTask,
}: {
    date: string;
    items: Entry[];
    categories: Category[];
    habits: Habit[];
    completedHabitIds: string[];
    language: Language;
    onEdit: (item: Entry) => void;
    onDelete: (item: Entry) => void;
    onToggleTask: (task: Task) => void;
}) {
    const label = (trText: string, enText: string) =>
        language === "en" ? enText : trText;
    const dayItems = items.filter((item) => item.localDate === date);
    const transactions = dayItems.filter(
        (item): item is Transaction =>
            item.kind === "expense" || item.kind === "income",
    );
    const expenses = transactions
        .filter((item) => item.kind === "expense")
        .reduce((sum, item) => sum + item.amountMinor, 0);
    const income = transactions
        .filter((item) => item.kind === "income")
        .reduce((sum, item) => sum + item.amountMinor, 0);
    const tasks = dayItems.filter((item): item is Task => item.kind === "task");
    const journal = dayItems.filter(
        (item): item is JournalEntry =>
            item.kind === "activity" || item.kind === "note",
    );
    const done = habits.filter((habit) => completedHabitIds.includes(habit.id));
    const dateLabel = format(
        new Date(`${date}T12:00:00`),
        "EEEE, d MMMM yyyy",
        { locale: language === "en" ? undefined : tr },
    );
    return (
        <section
            className={styles.calendarReport}
            aria-label={label("Günlük rapor", "Daily report")}
        >
            <header className={styles.calendarReportHeading}>
                <div>
                    <div className="eyebrow">
                        {label("GÜNLÜK RAPOR", "DAILY REPORT")}
                    </div>
                    <h3>{dateLabel}</h3>
                    <p>
                        {dayItems.length} {label("kayıt", "entries")} ·{" "}
                        {done.length}/{habits.length}{" "}
                        {label("alışkanlık tamamlandı", "habits completed")}
                    </p>
                </div>
            </header>
            <div className={styles.calendarReportSections}>
                <section>
                    <h4>{label("Genel Bakış", "Overview")}</h4>
                    <div className={styles.calendarReportStats}>
                        <div>
                            <small>{label("Kayıtlar", "Entries")}</small>
                            <b>{dayItems.length}</b>
                        </div>
                        <div>
                            <small>{label("Alışkanlıklar", "Habits")}</small>
                            <b>
                                {done.length}/{habits.length}
                            </b>
                        </div>
                        <div>
                            <small>
                                {label(
                                    "Görevler tamamlandı",
                                    "Tasks completed",
                                )}
                            </small>
                            <b>
                                {tasks.filter((task) => task.completed).length}/
                                {tasks.length}
                            </b>
                        </div>
                    </div>
                </section>
                <section>
                    <h4>
                        {label("Finans", "Finance")}{" "}
                        <span>{transactions.length}</span>
                    </h4>
                    {transactions.length ? (
                        transactions.map((item) => (
                            <RecordRow
                                key={item.id}
                                item={item}
                                categories={categories}
                                language={language}
                                className={styles.recordRow}
                                onEdit={() => onEdit(item)}
                                onDelete={() => onDelete(item)}
                            />
                        ))
                    ) : (
                        <p className={styles.calendarReportEmpty}>
                            {label(
                                "Bu gün için finans kaydı yok.",
                                "No finance entries for this day.",
                            )}
                        </p>
                    )}
                    <div className={styles.calendarReportFinanceTotals}>
                        <span>
                            {label("Gelir", "Income")}{" "}
                            <b className="income-text">{money(income)}</b>
                        </span>
                        <span>
                            {label("Gider", "Expenses")}{" "}
                            <b className="expense-text">{money(expenses)}</b>
                        </span>
                        <span>
                            {label("Net bakiye", "Net balance")}{" "}
                            <b>{money(income - expenses)}</b>
                        </span>
                    </div>
                </section>
                <section>
                    <h4>
                        {label("Günlük", "Journal")}{" "}
                        <span>{journal.length}</span>
                    </h4>
                    {journal.length ? (
                        journal.map((entry) => (
                            <div
                                className={styles.calendarReportRow}
                                key={entry.id}
                            >
                                <FileText size={14} />
                                <span>{entry.title}</span>
                                <b>
                                    {entry.kind === "activity"
                                        ? label("Aktivite", "Activity")
                                        : label("Not", "Note")}
                                </b>
                            </div>
                        ))
                    ) : (
                        <p className={styles.calendarReportEmpty}>
                            {label(
                                "Bu gün için günlük kaydı yok.",
                                "No journal entries for this day.",
                            )}
                        </p>
                    )}
                </section>
                <section>
                    <h4>
                        {label("Görevler", "Tasks")} <span>{tasks.length}</span>
                    </h4>
                    {tasks.length ? (
                        tasks.map((task) => (
                            <RecordRow
                                key={task.id}
                                item={task}
                                categories={categories}
                                language={language}
                                className={styles.recordRow}
                                onEdit={() => onEdit(task)}
                                onDelete={() => onDelete(task)}
                                onToggleTask={() => onToggleTask(task)}
                            />
                        ))
                    ) : (
                        <p className={styles.calendarReportEmpty}>
                            {label(
                                "Bu gün için görev yok.",
                                "No tasks for this day.",
                            )}
                        </p>
                    )}
                </section>
                <section>
                    <h4>
                        {label("Alışkanlıklar", "Habits")}{" "}
                        <span>
                            {done.length}/{habits.length}
                        </span>
                    </h4>
                    {habits.length ? (
                        habits.map((habit) => (
                            <div
                                className={styles.calendarReportRow}
                                key={habit.id}
                            >
                                <i
                                    style={{
                                        background:
                                            habit.color || "var(--accent)",
                                    }}
                                />
                                <span>{habit.title}</span>
                                <b
                                    className={
                                        completedHabitIds.includes(habit.id)
                                            ? "income-text"
                                            : ""
                                    }
                                >
                                    {completedHabitIds.includes(habit.id)
                                        ? label("Tamamlandı", "Completed")
                                        : label(
                                              "Tamamlanmadı",
                                              "Not completed",
                                          )}
                                </b>
                            </div>
                        ))
                    ) : (
                        <p className={styles.calendarReportEmpty}>
                            {label(
                                "Aktif alışkanlık yok.",
                                "No active habits.",
                            )}
                        </p>
                    )}
                </section>
                <section>
                    <h4>{label("İstatistikler", "Statistics")}</h4>
                    <div className={styles.calendarReportStats}>
                        <div>
                            <small>{label("Gelir", "Income")}</small>
                            <b className="income-text">{money(income)}</b>
                        </div>
                        <div>
                            <small>{label("Gider", "Expenses")}</small>
                            <b className="expense-text">{money(expenses)}</b>
                        </div>
                        <div>
                            <small>{label("Net bakiye", "Net balance")}</small>
                            <b>{money(income - expenses)}</b>
                        </div>
                        <div>
                            <small>
                                {label("Günlük kayıtlar", "Journal entries")}
                            </small>
                            <b>{journal.length}</b>
                        </div>
                    </div>
                </section>
            </div>
        </section>
    );
}

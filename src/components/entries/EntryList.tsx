import {
    Activity,
    ArrowDownLeft,
    ArrowUpRight,
    Check,
    Edit2,
    FileText,
    Search,
    Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
    money,
    type Category,
    type Entry,
    type JournalEntry,
    type Task,
} from "../../domain";
import type { Language } from "../../i18n";
import { categoryDisplay, entryTimestamp } from "./entryUtils";

export function Empty({
    icon,
    title,
    text,
}: {
    icon: React.ReactNode;
    title: string;
    text: string;
}) {
    return (
        <div className="empty-state">
            <div>{icon}</div>
            <b>{title}</b>
            <p>{text}</p>
        </div>
    );
}
export function RecordList({
    items,
    categories,
    onEdit,
    onDelete,
    onToggleTask,
    query,
    setQuery,
    finance = false,
    language = "tr",
    showTimestamp = false,
}: {
    items: Entry[];
    categories: Category[];
    onEdit: (i: Entry) => void;
    onDelete: (i: Entry) => void;
    onToggleTask?: (i: Entry) => void;
    query: string;
    setQuery: (v: string) => void;
    finance?: boolean;
    language?: Language;
    showTimestamp?: boolean;
}) {
    const list = finance
        ? items.filter((i) => i.kind === "expense" || i.kind === "income")
        : items;
    const word = (trText: string, enText: string) =>
        language === "en" ? enText : trText;
    return (
        <div className="record-list-layout">
            <div className="list-tools">
                <div className="search-box">
                    <Search size={17} />
                    <input
                        placeholder={word(
                            "Kayıtlarda ara...",
                            "Search entries...",
                        )}
                        value={query.match(/^\d{4}-\d{2}-\d{2}$/) ? "" : query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                {finance && (
                    <select
                        className="filter-select"
                        onChange={(e) =>
                            setQuery(
                                e.target.value === "all" ? "" : e.target.value,
                            )
                        }
                    >
                        <option value="all">
                            {word("Tüm işlemler", "All transactions")}
                        </option>
                        <option value="expense">
                            {word("Giderler", "Expenses")}
                        </option>
                        <option value="income">
                            {word("Gelirler", "Income")}
                        </option>
                    </select>
                )}
            </div>
            <div className="record-list">
                {list.length ? (
                    list.map((i) => (
                        <RecordRow
                            key={i.id}
                            item={i}
                            categories={categories}
                            language={language}
                            showTimestamp={showTimestamp}
                            onEdit={() => onEdit(i)}
                            onDelete={() => onDelete(i)}
                            onToggleTask={
                                onToggleTask ? () => onToggleTask(i) : undefined
                            }
                        />
                    ))
                ) : (
                    <Empty
                        icon={<Search />}
                        title={word("Kayıt bulunamadı", "No entries found")}
                        text={word(
                            "Aramana uygun kayıt yok. Yeni kayıt ekleyebilirsin.",
                            "No entries match your search. You can add one.",
                        )}
                    />
                )}
            </div>
        </div>
    );
}
export function RecordRow({
    item,
    categories,
    onEdit,
    onDelete,
    onToggleTask,
    language = "tr",
    showTimestamp = false,
}: {
    item: Entry;
    categories: Category[];
    onEdit: () => void;
    onDelete: () => void;
    onToggleTask?: () => void;
    language?: Language;
    showTimestamp?: boolean;
}) {
    const isTx = item.kind === "expense" || item.kind === "income",
        isTask = item.kind === "task",
        task = isTask ? (item as Task) : null;
    const word = (trText: string, enText: string) =>
        language === "en" ? enText : trText;
    return (
        <div
            className={`record-row ${task ? `task-priority-${task.priority}` : ""} ${task?.completed ? "task-completed" : ""}`}
        >
            {task && onToggleTask ? (
                <button
                    className={`task-toggle ${task.completed ? "checked" : ""}`}
                    aria-label={
                        task.completed
                            ? word(
                                  "Tamamlandı işaretini kaldır",
                                  "Undo completion",
                              )
                            : word("Görevi tamamla", "Complete task")
                    }
                    aria-pressed={task.completed}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleTask();
                    }}
                >
                    {task.completed && <Check size={14} />}
                </button>
            ) : (
                <div className={`record-icon ${item.kind}`}>
                    {item.kind === "expense" ? (
                        <ArrowDownLeft size={17} />
                    ) : item.kind === "income" ? (
                        <ArrowUpRight size={17} />
                    ) : item.kind === "activity" ? (
                        <Activity size={17} />
                    ) : item.kind === "note" ? (
                        <FileText size={17} />
                    ) : (
                        <Check size={17} />
                    )}
                </div>
            )}
            <button
                className="record-info"
                onClick={isTask && onToggleTask ? () => onToggleTask() : onEdit}
            >
                <b>
                    {isTx
                        ? item.description ||
                          categoryDisplay(
                              categories.find((c) => c.id === item.categoryId)
                                  ?.name || word("İşlem", "Transaction"),
                              language,
                          )
                        : (item as JournalEntry | Task).title}
                </b>
                <small>
                    {showTimestamp
                        ? format(
                              new Date(entryTimestamp(item)),
                              "d MMM yyyy, HH:mm",
                              { locale: language === "en" ? undefined : tr },
                          )
                        : format(
                              new Date(`${item.localDate}T12:00:00`),
                              "d MMM",
                              { locale: language === "en" ? undefined : tr },
                          )}{" "}
                    ·{" "}
                    {isTx
                        ? categoryDisplay(
                              categories.find((c) => c.id === item.categoryId)
                                  ?.name || word("Kategori yok", "No category"),
                              language,
                          )
                        : item.kind === "activity"
                          ? word("Aktivite", "Activity")
                          : item.kind === "note"
                            ? word("Not", "Note")
                            : task?.priority === "high"
                              ? word("Yüksek öncelik", "High priority")
                              : word("Görev", "Task")}
                    {task?.completed
                        ? ` · ${word("Tamamlandı", "Completed")}`
                        : ""}
                </small>
            </button>
            <strong
                className={
                    item.kind === "income"
                        ? "income-text"
                        : item.kind === "expense"
                          ? "expense-text"
                          : ""
                }
            >
                {isTx
                    ? `${item.kind === "expense" ? "−" : "+"}${money(item.amountMinor)}`
                    : ""}
            </strong>
            {isTask && (
                <button
                    className="row-edit"
                    aria-label={`${word("Görevi düzenle", "Edit task")}: ${(item as Task).title}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                    }}
                >
                    <Edit2 size={15} />
                </button>
            )}
            <button
                className="row-delete"
                aria-label={word("Kaydı sil", "Delete entry")}
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
            >
                <Trash2 size={15} />
            </button>
        </div>
    );
}

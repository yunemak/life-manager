import type { FormEvent } from "react";
import { Check, Trash2, X } from "lucide-react";
import {
    localDateTime,
    type Category,
    type Entry,
    type RecordKind,
} from "../../domain";
import { categoryDisplay } from "../entries/entryUtils";
import type { Language } from "../../i18n";

type Translate = (value: string) => string;

export interface EntryDialogProps {
    open: boolean;
    editing: Entry | null;
    kind: RecordKind;
    availableKinds: RecordKind[];
    categories: Category[];
    language: Language;
    today: string;
    text: Translate;
    onClose: () => void;
    onKindChange: (kind: RecordKind) => void;
    onSave: (event: FormEvent<HTMLFormElement>) => void;
    onRemove: (entry: Entry) => void;
}

export default function EntryDialog({
    open,
    editing,
    kind,
    availableKinds,
    categories,
    language,
    today,
    text,
    onClose,
    onKindChange,
    onSave,
    onRemove,
}: EntryDialogProps) {
    return (
        <>
            {open && (
                <div
                    className="modal-backdrop"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) onClose();
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
                                onClick={() => onClose()}
                                aria-label={text("Kapat")}
                            >
                                <X />
                            </button>
                        </div>
                        <div className="type-tabs">
                            {(editing ? [editing.kind] : availableKinds).map(
                                (k) => (
                                    <button
                                        className={kind === k ? "active" : ""}
                                        onClick={() => onKindChange(k)}
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
                                ),
                            )}
                        </div>
                        <form onSubmit={onSave}>
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
                                        onClick={() => onRemove(editing)}
                                    >
                                        <Trash2 size={17} /> Sil
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="secondary"
                                    onClick={() => onClose()}
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
        </>
    );
}

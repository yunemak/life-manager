import { X } from "lucide-react";
import type { FormEvent } from "react";
import { CategoryColorPicker } from "./SettingsPage";

export interface CategoryDialogProps {
    open: boolean;
    name: string;
    color: string;
    text: (value: string) => string;
    onNameChange: (name: string) => void;
    onColorChange: (color: string) => void;
    onClose: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export default function CategoryDialog({
    open,
    name,
    color,
    text,
    onNameChange,
    onColorChange,
    onClose,
    onSubmit,
}: CategoryDialogProps) {
    if (!open) return null;

    return (
        <div
            className="modal-backdrop"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
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
                        onClick={onClose}
                        aria-label={text("Kapat")}
                    >
                        <X />
                    </button>
                </div>
                <form onSubmit={onSubmit}>
                    <label>
                        {text("Kategori adı?")}
                        <input
                            autoFocus
                            value={name}
                            onChange={(event) =>
                                onNameChange(event.target.value)
                            }
                            required
                        />
                    </label>
                    <div className="category-color-field">
                        <span>{text("Kategori rengi")}</span>
                        <CategoryColorPicker
                            value={color}
                            label={text("Kategori rengi")}
                            onChange={onColorChange}
                        />
                    </div>
                    <div className="category-dialog-actions">
                        <button
                            type="button"
                            className="secondary"
                            onClick={onClose}
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
    );
}

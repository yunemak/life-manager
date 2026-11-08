import { Trash2 } from "lucide-react";

export interface DeleteEntryDialogProps {
    open: boolean;
    text: (value: string) => string;
    onCancel: () => void;
    onConfirm: () => void;
}

export default function DeleteEntryDialog({
    open,
    text,
    onCancel,
    onConfirm,
}: DeleteEntryDialogProps) {
    if (!open) return null;

    return (
        <div
            className="modal-backdrop confirm-backdrop"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onCancel();
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
                    <button className="secondary" onClick={onCancel}>
                        {text("Vazgeç")}
                    </button>
                    <button
                        className="danger-button"
                        autoFocus
                        onClick={onConfirm}
                    >
                        <Trash2 size={16} />
                        {text("Sil")}
                    </button>
                </div>
            </section>
        </div>
    );
}

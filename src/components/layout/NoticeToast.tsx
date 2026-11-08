import { Check, X } from "lucide-react";

export default function NoticeToast({
    message,
    onClose,
}: {
    message: string;
    onClose: () => void;
}) {
    if (!message) return null;

    return (
        <div className="toast" role="status">
            <Check size={17} />
            {message}
            <button onClick={onClose}>
                <X size={15} />
            </button>
        </div>
    );
}

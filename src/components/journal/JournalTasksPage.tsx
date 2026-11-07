import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { t, type Language } from "../../i18n";
import styles from "./JournalTasksPage.module.css";

interface JournalTasksPageProps {
    isTasks: boolean;
    language: Language;
    title: string;
    onAdd: () => void;
    children: ReactNode;
}

export default function JournalTasksPage({
    isTasks,
    language,
    title,
    onAdd,
    children,
}: JournalTasksPageProps) {
    const text = (value: string) => t(value, language);

    return (
        <div className={styles.root}>
            <div className="page-heading">
                <div>
                    <div className="eyebrow">
                        {text(
                            isTasks ? "AKLINDAKİLERİ PLANLA" : "GÜNLÜK YAŞAMIN",
                        )}
                    </div>
                    <h1>{title}</h1>
                    <p>
                        {text(
                            isTasks
                                ? "Görevlerini tek yerde takip et."
                                : "Anılarını, notlarını ve yaptıklarını sakla.",
                        )}
                    </p>
                </div>
                <button className="primary" onClick={onAdd}>
                    <Plus size={18} /> {text("Ekle")}
                </button>
            </div>
            <section className={`panel ${isTasks ? "tasks-panel" : ""}`}>
                {children}
            </section>
        </div>
    );
}

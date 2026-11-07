import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import styles from "./TodayEntriesPage.module.css";

interface TodayEntriesPageProps {
    backLabel: string;
    dateLabel: string;
    title: string;
    countLabel: string;
    onBack: () => void;
    children: ReactNode;
}

export default function TodayEntriesPage({
    backLabel,
    dateLabel,
    title,
    countLabel,
    onBack,
    children,
}: TodayEntriesPageProps) {
    return (
        <>
            <header className={styles.header}>
                <button className="secondary" onClick={onBack}>
                    <ChevronLeft size={16} />
                    {backLabel}
                </button>
                <div className={styles.heading}>
                    <div className={styles.date}>{dateLabel}</div>
                    <h1>{title}</h1>
                    <p>{countLabel}</p>
                </div>
            </header>
            <section className={`panel ${styles.recordsPanel}`}>
                {children}
            </section>
        </>
    );
}

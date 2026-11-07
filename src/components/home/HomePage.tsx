import type { ReactNode } from "react";
import {
    ArrowDownLeft,
    ArrowUpRight,
    BarChart3,
    ChevronRight,
    Plus,
    Wallet,
} from "lucide-react";
import { money } from "../../domain";
import { t, type Language } from "../../i18n";
import styles from "./HomePage.module.css";

interface HomePageProps {
    language: Language;
    dateLabel: string;
    monthLabel: string;
    todaySpent: number;
    todayIncome: number;
    monthSpent: number;
    pendingTaskCount: number;
    recentEntries: ReactNode;
    pendingTasks: ReactNode;
    onQuickAdd: () => void;
    onViewAll: () => void;
    onAddTask: () => void;
    onOpenFinance: () => void;
}

export default function HomePage({
    language,
    dateLabel,
    monthLabel,
    todaySpent,
    todayIncome,
    monthSpent,
    pendingTaskCount,
    recentEntries,
    pendingTasks,
    onQuickAdd,
    onViewAll,
    onAddTask,
    onOpenFinance,
}: HomePageProps) {
    const text = (value: string) => t(value, language);

    return (
        <div className={styles.root}>
            <div className="welcome">
                <div>
                    <div className="eyebrow">{dateLabel}</div>
                    <h1>{language === "en" ? "Hello 👋" : "Merhaba 👋"}</h1>
                    <p>
                        {language === "en"
                            ? "What have you done for yourself today?"
                            : "Bugün kendin için neler yaptın?"}
                    </p>
                </div>
                <button className="primary desktop-add" onClick={onQuickAdd}>
                    <Plus size={18} /> {text("Hızlı ekle")}
                </button>
            </div>
            <div className="summary-grid">
                <div className="summary-card">
                    <div className="summary-icon green-icon">
                        <ArrowDownLeft size={19} />
                    </div>
                    <span>{text("Bugünkü gider")}</span>
                    <strong>{money(todaySpent)}</strong>
                    <small>{text("Bugün kaydedilen harcamalar")}</small>
                </div>
                <div className="summary-card">
                    <div className="summary-icon blue-icon">
                        <ArrowUpRight size={19} />
                    </div>
                    <span>{text("Bugünkü gelir")}</span>
                    <strong>{money(todayIncome)}</strong>
                    <small>{text("Bugün kaydedilen gelirler")}</small>
                </div>
                <div className="summary-card">
                    <div className="summary-icon purple-icon">
                        <Wallet size={19} />
                    </div>
                    <span>{text("Bu ay harcanan")}</span>
                    <strong>{money(monthSpent)}</strong>
                    <small>{monthLabel}</small>
                </div>
            </div>
            <div className="dashboard-grid">
                <section className="panel recent-entries-panel">
                    <div className="panel-heading">
                        <div>
                            <h2>{text("Son kayıtlar")}</h2>
                            <p>{text("Günlük hayatından notlar")}</p>
                        </div>
                        <button className="text-button" onClick={onViewAll}>
                            {text("Tümünü gör")} <ChevronRight size={16} />
                        </button>
                    </div>
                    {recentEntries}
                </section>
                <section className="panel">
                    <div className="panel-heading">
                        <div>
                            <h2>{text("Yapılacaklar")}</h2>
                            <p>{pendingTaskCount} tamamlanmamış görev</p>
                        </div>
                        <button className="round-mini" onClick={onAddTask}>
                            <Plus size={17} />
                        </button>
                    </div>
                    {pendingTasks}
                    <div className="month-callout">
                        <div className="callout-icon">
                            <BarChart3 size={18} />
                        </div>
                        <div>
                            <small>{text("Aylık harcama")}</small>
                            <b>{money(monthSpent)}</b>
                        </div>
                        <button
                            onClick={onOpenFinance}
                            aria-label="Finansa git"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}

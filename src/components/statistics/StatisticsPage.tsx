import type { ReactNode } from "react";
import { t, type Language } from "../../i18n";
import styles from "./StatisticsPage.module.css";

interface CategoryTotal {
    id: string;
    name: string;
    color: string;
    amount: string;
    total: number;
}

interface StatisticsPageProps {
    language: Language;
    title: string;
    income: string;
    expenses: string;
    balance: string;
    incomeCategories: CategoryTotal[];
    expenseCategories: CategoryTotal[];
    monthEntries: number;
    habitCompletion: string;
    habitCountLabel: string;
    monthActivities: number;
    emptyIncome: ReactNode;
    emptyExpenses: ReactNode;
}

function CategoryTotals({ items }: { items: CategoryTotal[] }) {
    return items.map((item) => (
        <div className="category-line" key={item.id}>
            <i style={{ background: item.color }} />
            <span>{item.name}</span>
            <b>{item.amount}</b>
        </div>
    ));
}

export default function StatisticsPage({
    language,
    title,
    income,
    expenses,
    balance,
    incomeCategories,
    expenseCategories,
    monthEntries,
    habitCompletion,
    habitCountLabel,
    monthActivities,
    emptyIncome,
    emptyExpenses,
}: StatisticsPageProps) {
    const text = (value: string) => t(value, language);

    return (
        <div>
            <div className="page-heading">
                <div>
                    <div className="eyebrow">{text("KENDİNİ KEŞFET")}</div>
                    <h1>{title}</h1>
                    <p>
                        {text(
                            "Gelirini, giderini ve alışkanlıklarını birlikte gör.",
                        )}
                    </p>
                </div>
            </div>
            <div className="summary-grid">
                <div className="summary-card">
                    <span>{text("Bu ay gelir")}</span>
                    <strong>{income}</strong>
                </div>
                <div className="summary-card">
                    <span>{text("Bu ay gider")}</span>
                    <strong>{expenses}</strong>
                </div>
                <div className="summary-card">
                    <span>{text("Net bakiye")}</span>
                    <strong>{balance}</strong>
                    <small>{text("Gelir eksi gider")}</small>
                </div>
            </div>
            <div className="dashboard-grid">
                <section className="panel">
                    <div className="panel-heading">
                        <div>
                            <h2>{text("Gelir kategorileri")}</h2>
                            <p>{language === "en" ? "This month" : "Bu ay"}</p>
                        </div>
                    </div>
                    <CategoryTotals items={incomeCategories} />
                    {emptyIncome}
                </section>
                <section className="panel">
                    <div className="panel-heading">
                        <div>
                            <h2>{text("Gider kategorileri")}</h2>
                            <p>{language === "en" ? "This month" : "Bu ay"}</p>
                        </div>
                    </div>
                    <CategoryTotals items={expenseCategories} />
                    {emptyExpenses}
                </section>
            </div>
            <div className={`summary-grid ${styles.statsSecondary}`}>
                <div className={`summary-card ${styles.summaryCard}`}>
                    <span>{text("Bu ay kayıt")}</span>
                    <strong>{monthEntries}</strong>
                    <small>{text("Günlük kayıtların toplamı")}</small>
                </div>
                <div className={`summary-card ${styles.summaryCard}`}>
                    <span>{text("Bugün alışkanlıklar")}</span>
                    <strong>{habitCompletion}</strong>
                    <small>{habitCountLabel}</small>
                </div>
                <div className={`summary-card ${styles.summaryCard}`}>
                    <span>{text("Bu ay aktiviteler")}</span>
                    <strong>{monthActivities}</strong>
                    <small>{text("Günlük aktivitelerin")}</small>
                </div>
            </div>
        </div>
    );
}

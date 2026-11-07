import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Download, Plus } from "lucide-react";
import { addMonths, format, getDaysInMonth, subMonths } from "date-fns";
import { tr } from "date-fns/locale";
import { money, type Category, type Transaction } from "../../domain";
import { t, type Language } from "../../i18n";
import styles from "./FinancePage.module.css";

interface FinancePageProps {
    categories: Category[];
    language: Language;
    month: Date;
    monthSpent: number;
    monthTransactions: Transaction[];
    onMonthChange: (month: Date) => void;
    onAddExpense: () => void;
    onExportCsv: () => void;
    expenseEmptyState: ReactNode;
    transactionList: ReactNode;
}

export default function FinancePage({
    categories,
    language,
    month,
    monthSpent,
    monthTransactions,
    onMonthChange,
    onAddExpense,
    onExportCsv,
    expenseEmptyState,
    transactionList,
}: FinancePageProps) {
    const text = (value: string) => t(value, language);
    const monthIncome = monthTransactions
        .filter((item) => item.kind === "income")
        .reduce((sum, item) => sum + item.amountMinor, 0);
    const chartMax = Math.max(
        1,
        ...monthTransactions
            .filter((item) => item.kind === "expense")
            .map((item) => item.amountMinor),
    );
    const monthLabel = format(month, "MMMM yyyy", {
        locale: language === "en" ? undefined : tr,
    });

    return (
        <>
            <div className="page-heading">
                <div>
                    <div className="eyebrow">
                        {text("PARANIN KONTROLÜ SENDE")}
                    </div>
                    <h1>{text("Finans")}</h1>
                    <p>{text("Gelir ve giderlerini kolayca takip et.")}</p>
                </div>
                <button className="primary" onClick={onAddExpense}>
                    <Plus size={18} />
                    {text("İşlem ekle")}
                </button>
            </div>

            <div className={`summary-grid ${styles.compact}`}>
                <div className="summary-card">
                    <span>{text("Bu ay gider")}</span>
                    <strong>{money(monthSpent)}</strong>
                </div>
                <div className="summary-card">
                    <span>{text("Bu ay gelir")}</span>
                    <strong>{money(monthIncome)}</strong>
                </div>
                <div className="summary-card">
                    <span>{text("Net durum")}</span>
                    <strong>{money(monthIncome - monthSpent)}</strong>
                </div>
            </div>

            <div className={`dashboard-grid ${styles.financeCharts}`}>
                <section className="panel">
                    <div className="panel-heading">
                        <div>
                            <h2>{text("Günlük harcamalar")}</h2>
                            <p>{monthLabel}</p>
                        </div>
                        <div className="month-nav">
                            <button
                                aria-label={text("Önceki ay")}
                                onClick={() =>
                                    onMonthChange(subMonths(month, 1))
                                }
                            >
                                <ChevronLeft />
                            </button>
                            <button
                                aria-label={text("Sonraki ay")}
                                onClick={() =>
                                    onMonthChange(addMonths(month, 1))
                                }
                            >
                                <ChevronRight />
                            </button>
                        </div>
                    </div>
                    <div className={styles.bars}>
                        {Array.from(
                            { length: getDaysInMonth(month) },
                            (_, index) => {
                                const date = `${format(month, "yyyy-MM")}-${String(index + 1).padStart(2, "0")}`;
                                const value = monthTransactions
                                    .filter(
                                        (item) =>
                                            item.kind === "expense" &&
                                            item.localDate === date,
                                    )
                                    .reduce(
                                        (sum, item) => sum + item.amountMinor,
                                        0,
                                    );

                                return (
                                    <div
                                        className={styles.barWrap}
                                        title={`${index + 1}: ${money(value)}`}
                                        key={date}
                                    >
                                        <div
                                            className={styles.bar}
                                            style={{
                                                height: `${Math.max(value ? 4 : 1, (value / chartMax) * 100)}%`,
                                            }}
                                        />
                                        <small>
                                            {(index + 1) % 5 === 1 ||
                                            index === 0
                                                ? index + 1
                                                : ""}
                                        </small>
                                    </div>
                                );
                            },
                        )}
                    </div>
                </section>

                <section className="panel">
                    <div className="panel-heading">
                        <div>
                            <h2>{text("Kategori dağılımı")}</h2>
                            <p>{text("Bu ayki harcamalar")}</p>
                        </div>
                    </div>
                    {categories.map((category) => {
                        const value = monthTransactions
                            .filter(
                                (item) =>
                                    item.kind === "expense" &&
                                    item.categoryId === category.id,
                            )
                            .reduce((sum, item) => sum + item.amountMinor, 0);
                        if (!value) return null;

                        return (
                            <div className="category-line" key={category.id}>
                                <i style={{ background: category.color }} />
                                <span>{text(category.name)}</span>
                                <b>{money(value)}</b>
                            </div>
                        );
                    })}
                    {monthSpent === 0 && expenseEmptyState}
                </section>
            </div>

            <section className="panel">
                <div className="panel-heading">
                    <div>
                        <h2>{text("İşlem geçmişi")}</h2>
                        <p>{text("Gelir ve gider kayıtların")}</p>
                    </div>
                    <button className="secondary" onClick={onExportCsv}>
                        <Download size={16} /> CSV indir
                    </button>
                </div>
                {transactionList}
            </section>
        </>
    );
}

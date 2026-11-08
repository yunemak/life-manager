import { format } from "date-fns";
import { money, type Category, type Entry, type Transaction } from "../domain";
import {
    categoryDisplay,
    entryTimestamp,
} from "../components/entries/entryUtils";
import type { Page } from "./types";
import type { Language } from "../i18n";

export function selectTodayEntries(
    items: Entry[],
    today: string,
    query: string,
) {
    return items
        .filter((item) => item.localDate === today)
        .filter(
            (item) =>
                !query ||
                JSON.stringify(item)
                    .toLocaleLowerCase("tr")
                    .includes(query.toLocaleLowerCase("tr")),
        )
        .sort(
            (a, b) =>
                new Date(entryTimestamp(b)).getTime() -
                new Date(entryTimestamp(a)).getTime(),
        );
}

export function selectPageEntries(items: Entry[], page: Page, query: string) {
    return items
        .filter((item) => {
            if (page === "finance")
                return item.kind === "expense" || item.kind === "income";
            if (page === "journal")
                return item.kind === "activity" || item.kind === "note";
            if (page === "tasks") return item.kind === "task";
            return true;
        })
        .filter(
            (item) =>
                !query ||
                JSON.stringify(item)
                    .toLocaleLowerCase("tr")
                    .includes(query.toLocaleLowerCase("tr")),
        );
}

export function selectTransactionTotals(
    transactions: Transaction[],
    today: string,
    monthPrefix: string,
) {
    return transactions.reduce(
        (totals, transaction) => {
            if (transaction.localDate === today) {
                if (transaction.kind === "expense")
                    totals.todaySpent += transaction.amountMinor;
                else totals.todayIncome += transaction.amountMinor;
            }
            if (transaction.localDate.startsWith(monthPrefix)) {
                if (transaction.kind === "expense")
                    totals.monthSpent += transaction.amountMinor;
                else totals.monthIncome += transaction.amountMinor;
            }
            return totals;
        },
        { todaySpent: 0, todayIncome: 0, monthSpent: 0, monthIncome: 0 },
    );
}

export function selectMonthTransactions(
    transactions: Transaction[],
    month: Date,
) {
    const prefix = format(month, "yyyy-MM");
    return transactions.filter((item) => item.localDate.startsWith(prefix));
}

export function selectCategoryTotals(
    categories: Category[],
    transactions: Transaction[],
    kind: Transaction["kind"],
    language: Language,
) {
    return categories
        .filter((category) => category.kind === kind)
        .map((category) => {
            const total = transactions
                .filter(
                    (transaction) =>
                        transaction.kind === kind &&
                        transaction.categoryId === category.id,
                )
                .reduce((sum, transaction) => sum + transaction.amountMinor, 0);
            return {
                id: category.id,
                name: categoryDisplay(category.name, language),
                color: category.color,
                amount: money(total),
                total,
            };
        })
        .filter((category) => category.total > 0);
}

export function selectMonthEntryCount(items: Entry[], monthPrefix: string) {
    return items.filter((item) => item.localDate.startsWith(monthPrefix))
        .length;
}

export function selectMonthActivityCount(items: Entry[], monthPrefix: string) {
    return items.filter(
        (item) =>
            item.kind === "activity" && item.localDate.startsWith(monthPrefix),
    ).length;
}

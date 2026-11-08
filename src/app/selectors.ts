import { format } from "date-fns";
import { money, type Category, type Entry, type Transaction } from "../domain";
import {
    categoryDisplay,
    entryTimestamp,
} from "../components/entries/entryUtils";
import type { Page } from "./types";
import type { Language } from "../i18n";

function matchesQuery(item: Entry, normalizedQuery: string) {
    return (
        !normalizedQuery ||
        JSON.stringify(item).toLocaleLowerCase("tr").includes(normalizedQuery)
    );
}

export function selectTodayEntries(
    items: Entry[],
    today: string,
    query: string,
) {
    const normalizedQuery = query.toLocaleLowerCase("tr");
    return items
        .filter((item) => item.localDate === today)
        .filter((item) => matchesQuery(item, normalizedQuery))
        .sort(
            (a, b) =>
                new Date(entryTimestamp(b)).getTime() -
                new Date(entryTimestamp(a)).getTime(),
        );
}

export function selectPageEntries(items: Entry[], page: Page, query: string) {
    const normalizedQuery = query.toLocaleLowerCase("tr");
    return items
        .filter((item) => {
            if (page === "finance")
                return item.kind === "expense" || item.kind === "income";
            if (page === "journal")
                return item.kind === "activity" || item.kind === "note";
            if (page === "tasks") return item.kind === "task";
            return true;
        })
        .filter((item) => matchesQuery(item, normalizedQuery));
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
    const totalsByCategory = new Map<string, number>();
    for (const transaction of transactions) {
        if (transaction.kind === kind) {
            totalsByCategory.set(
                transaction.categoryId,
                (totalsByCategory.get(transaction.categoryId) ?? 0) +
                    transaction.amountMinor,
            );
        }
    }

    return categories
        .filter((category) => category.kind === kind)
        .map((category) => {
            const total = totalsByCategory.get(category.id) ?? 0;
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

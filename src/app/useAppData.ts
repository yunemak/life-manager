import { useCallback, useEffect, useState } from "react";
import { db, records } from "../db";
import {
    localDate,
    uid,
    type Category,
    type Entry,
    type Habit,
} from "../domain";

const defaultExpenseCategories = [
    { name: "Yemek", color: "#ec9a55" },
    { name: "Ulaşım", color: "#6091d5" },
    { name: "Ev", color: "#a080d0" },
    { name: "Alışveriş", color: "#dc7180" },
    { name: "Sağlık", color: "#51a989" },
    { name: "Diğer", color: "#8c99a8" },
];

async function ensureDefaultCategories() {
    if (await db.categories.count()) return;

    const now = new Date().toISOString();
    const category = (name: string, color: string, kind: Category["kind"]) => ({
        id: uid(),
        name,
        kind,
        color,
        localDate: localDate(),
        createdAt: now,
        updatedAt: now,
    });
    await db.categories.bulkAdd([
        ...defaultExpenseCategories.map(({ name, color }) =>
            category(name, color, "expense"),
        ),
        category("Maaş", "#51a989", "income"),
        category("Diğer gelir", "#51a989", "income"),
    ]);
}

export default function useAppData(onLoadError?: (error: unknown) => void) {
    const [items, setItems] = useState<Entry[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [habits, setHabits] = useState<Habit[]>([]);
    const [completions, setCompletions] = useState<string[]>([]);

    const refresh = useCallback(async () => {
        await ensureDefaultCategories();
        const [all, cats, allHabits, done] = await Promise.all([
            records.all(),
            db.categories.toArray(),
            db.habits.toArray(),
            db.completions.where("localDate").equals(localDate()).toArray(),
        ]);
        setItems(all.sort((a, b) => b.localDate.localeCompare(a.localDate)));
        setCategories(cats);
        setHabits(allHabits.filter((habit) => !habit.archived));
        setCompletions(
            done
                .filter((completion) => completion.status !== "skipped")
                .map((completion) => completion.habitId),
        );
    }, []);

    useEffect(() => {
        void refresh().catch((error: unknown) => onLoadError?.(error));
    }, [refresh, onLoadError]);

    return { items, categories, habits, completions, refresh };
}

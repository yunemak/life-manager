import { db } from "../db";
import { localDate, uid } from "../domain";

export async function addExpenseCategory(
    name: string,
    color: string,
    date = localDate(),
) {
    const now = new Date().toISOString();
    await db.categories.add({
        id: uid(),
        name,
        kind: "expense",
        color,
        localDate: date,
        createdAt: now,
        updatedAt: now,
    });
}

export async function updateCategoryColor(id: string, color: string) {
    await db.categories.update(id, {
        color,
        updatedAt: new Date().toISOString(),
    });
}

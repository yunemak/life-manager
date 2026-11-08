import { db } from "../db";

export async function getCompletedHabitIds(date: string) {
    const completions = await db.completions
        .where("localDate")
        .equals(date)
        .toArray();
    return completions
        .filter((completion) => completion.status !== "skipped")
        .map((completion) => completion.habitId);
}

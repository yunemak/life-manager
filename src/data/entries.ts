import { db, records } from "../db";
import {
    localDateTime,
    uid,
    type Entry,
    type JournalEntry,
    type RecordKind,
    type Task,
    type Transaction,
} from "../domain";

export async function saveEntry(
    form: FormData,
    editing: Entry | null,
    kind: RecordKind,
    today: string,
) {
    const now = new Date().toISOString();
    const common = {
        id: editing?.id || uid(),
        localDate: String(form.get("date") || today),
        createdAt: editing?.createdAt || now,
        updatedAt: now,
    };

    if (kind === "expense" || kind === "income") {
        const amount = Number(String(form.get("amount")).replace(",", "."));
        if (!Number.isFinite(amount) || amount <= 0)
            throw new Error("Geçerli bir tutar girin.");
        const occurredAt = String(form.get("dateTime") || localDateTime());
        const transaction: Transaction = {
            ...common,
            localDate: occurredAt.slice(0, 10),
            kind,
            amountMinor: Math.round(amount * 100),
            categoryId: String(form.get("category") || ""),
            description: String(form.get("description") || ""),
            occurredAt,
        };
        await db.transactions.put(transaction);
        return;
    }

    if (kind === "activity" || kind === "note") {
        const title = String(form.get("title") || "").trim();
        if (!title) throw new Error("Başlık gerekli.");
        const occurredAt = String(form.get("dateTime") || localDateTime());
        const entry: JournalEntry = {
            ...common,
            localDate: occurredAt.slice(0, 10),
            kind,
            title,
            body: String(form.get("body") || ""),
            category: String(form.get("category") || ""),
            occurredAt,
            ...(form.get("duration")
                ? { durationMinutes: Number(form.get("duration")) }
                : {}),
        };
        await db.journal.put(entry);
        return;
    }

    const title = String(form.get("title") || "").trim();
    if (!title) throw new Error("Görev başlığı gerekli.");
    const task: Task = {
        ...common,
        kind: "task",
        title,
        dueDate: String(form.get("dueDate") || ""),
        priority: String(form.get("priority") || "medium") as Task["priority"],
        completed: editing?.kind === "task" ? editing.completed : false,
    };
    await db.tasks.put(task);
}

export async function deleteEntry(entry: Entry) {
    await records.remove(entry.id, entry.kind);
}

export async function toggleTask(task: Task) {
    await db.tasks.put({
        ...task,
        completed: !task.completed,
        updatedAt: new Date().toISOString(),
    });
}

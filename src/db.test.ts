import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import Dexie from "dexie";
import { db, LifeDatabase, records } from "./db";
import type { Transaction } from "./domain";

afterEach(async () => {
    await db.delete();
    await db.open();
});

describe("IndexedDB records", () => {
    it("persists a transaction and retrieves it after reopening", async () => {
        const record: Transaction = {
            id: "persist-test",
            kind: "expense",
            amountMinor: 2299,
            categoryId: "food",
            description: "Lunch",
            occurredAt: "2025-01-02T12:00",
            localDate: "2025-01-02",
            createdAt: "2025-01-02T12:00:00.000Z",
            updatedAt: "2025-01-02T12:00:00.000Z",
        };
        await records.save(record);
        db.close();
        await db.open();
        expect(await db.transactions.get(record.id)).toEqual(record);
    });

    it("migrates legacy habits and completion records without losing history", async () => {
        const name = `habit-migration-${crypto.randomUUID()}`;
        const legacy = new Dexie(name);
        legacy.version(2).stores({
            transactions: "id, kind, localDate, occurredAt, categoryId",
            journal: "id, kind, localDate, occurredAt, category",
            tasks: "id, kind, localDate, dueDate, completed, priority",
            habits: "id, title, archived",
            completions: "id, habitId, localDate, [habitId+localDate]",
            categories: "id, kind, name",
        });
        await legacy.open();
        await legacy.table("habits").put({
            id: "legacy-habit",
            kind: "habit",
            title: "Eski alışkanlık",
            schedule: [1, 2, 3, 4, 5],
            archived: false,
            localDate: "2024-04-01",
            createdAt: "2024-04-01T10:00:00.000Z",
            updatedAt: "2024-04-01T10:00:00.000Z",
        });
        await legacy.table("completions").put({
            id: "legacy-check",
            habitId: "legacy-habit",
            localDate: "2024-04-02",
            createdAt: "2024-04-02T10:00:00.000Z",
            updatedAt: "2024-04-02T10:00:00.000Z",
        });
        legacy.close();

        const migrated = new LifeDatabase(name);
        await migrated.open();
        expect(await migrated.habits.get("legacy-habit")).toMatchObject({
            title: "Eski alışkanlık",
            frequency: {
                period: "daily",
                target: 1,
                weekdays: [1, 2, 3, 4, 5],
            },
            color: "#438a67",
        });
        expect(await migrated.completions.get("legacy-check")).toMatchObject({
            habitId: "legacy-habit",
            status: "completed",
        });
        migrated.close();
        await migrated.delete();
    });
});

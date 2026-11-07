import Dexie, { type EntityTable } from "dexie";
import type {
    AssetHolding,
    AssetType,
    Category,
    Habit,
    HabitCompletion,
    JournalEntry,
    Task,
    Transaction,
} from "./domain";

export class LifeDatabase extends Dexie {
    transactions!: EntityTable<Transaction, "id">;
    journal!: EntityTable<JournalEntry, "id">;
    tasks!: EntityTable<Task, "id">;
    habits!: EntityTable<Habit, "id">;
    completions!: EntityTable<HabitCompletion, "id">;
    categories!: EntityTable<Category, "id">;
    assetHoldings!: EntityTable<AssetHolding, "id">;
    assetTypes!: EntityTable<AssetType, "id">;
    constructor(name = "life-manager") {
        super(name);
        this.version(1).stores({
            transactions: "id, kind, localDate, occurredAt, categoryId",
            journal: "id, kind, localDate, occurredAt, category",
            tasks: "id, kind, localDate, dueDate, completed, priority",
            habits: "id, title, archived",
            completions: "id, habitId, localDate, [habitId+localDate]",
            categories: "id, kind, name",
        });
        this.version(2)
            .stores({
                transactions: "id, kind, localDate, occurredAt, categoryId",
                journal: "id, kind, localDate, occurredAt, category",
                tasks: "id, kind, localDate, dueDate, completed, priority",
                habits: "id, title, archived",
                completions: "id, habitId, localDate, [habitId+localDate]",
                categories: "id, kind, name",
            })
            .upgrade(async (tx) => {
                await tx
                    .table("transactions")
                    .toCollection()
                    .modify((r: Transaction) => {
                        r.localDate ||= r.occurredAt.slice(0, 10);
                    });
                await tx
                    .table("journal")
                    .toCollection()
                    .modify((r: JournalEntry) => {
                        r.localDate ||= r.occurredAt.slice(0, 10);
                    });
            });
        this.version(3)
            .stores({
                transactions: "id, kind, localDate, occurredAt, categoryId",
                journal: "id, kind, localDate, occurredAt, category",
                tasks: "id, kind, localDate, dueDate, completed, priority",
                habits: "id, title, archived",
                completions: "id, habitId, localDate, [habitId+localDate]",
                categories: "id, kind, name",
            })
            .upgrade(async (tx) => {
                await tx
                    .table("habits")
                    .toCollection()
                    .modify((habit: Habit) => {
                        habit.description ??= "";
                        habit.color ||= "#438a67";
                        habit.frequency ||= {
                            period: "daily",
                            target: 1,
                            weekdays: habit.schedule?.length
                                ? habit.schedule
                                : [0, 1, 2, 3, 4, 5, 6],
                        };
                    });
                await tx
                    .table("completions")
                    .toCollection()
                    .modify((completion: HabitCompletion) => {
                        completion.status ||= "completed";
                    });
            });
        this.version(4).stores({
            transactions: "id, kind, localDate, occurredAt, categoryId",
            journal: "id, kind, localDate, occurredAt, category",
            tasks: "id, kind, localDate, dueDate, completed, priority",
            habits: "id, title, archived",
            completions: "id, habitId, localDate, [habitId+localDate]",
            categories: "id, kind, name",
            assetHoldings: "id, assetType, unit, priceCurrency",
        });
        this.version(5).stores({
            transactions: "id, kind, localDate, occurredAt, categoryId",
            journal: "id, kind, localDate, occurredAt, category",
            tasks: "id, kind, localDate, dueDate, completed, priority",
            habits: "id, title, archived",
            completions: "id, habitId, localDate, [habitId+localDate]",
            categories: "id, kind, name",
            assetHoldings: "id, assetType, unit, priceCurrency",
            assetTypes: "id, name, isDefault",
        });
    }
}
export const db = new LifeDatabase();
export const records = {
    async all() {
        const [transactions, journal, tasks] = await Promise.all([
            db.transactions.toArray(),
            db.journal.toArray(),
            db.tasks.toArray(),
        ]);
        return [...transactions, ...journal, ...tasks];
    },
    async save(record: Transaction | JournalEntry | Task) {
        const table =
            record.kind === "expense" || record.kind === "income"
                ? db.transactions
                : record.kind === "activity" || record.kind === "note"
                  ? db.journal
                  : db.tasks;
        await table.put(record as never);
    },
    async remove(id: string, kind: string) {
        if (kind === "expense" || kind === "income")
            return db.transactions.delete(id);
        if (kind === "activity" || kind === "note")
            return db.journal.delete(id);
        return db.tasks.delete(id);
    },
};

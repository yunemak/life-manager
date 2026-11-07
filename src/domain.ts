export type RecordKind =
    "expense" | "income" | "activity" | "note" | "task" | "habit";
export interface BaseRecord {
    id: string;
    createdAt: string;
    updatedAt: string;
    localDate: string;
}
export interface Transaction extends BaseRecord {
    kind: "expense" | "income";
    amountMinor: number;
    categoryId: string;
    description: string;
    occurredAt: string;
}
export interface JournalEntry extends BaseRecord {
    kind: "activity" | "note";
    title: string;
    body: string;
    durationMinutes?: number;
    occurredAt: string;
    category: string;
}
export interface Task extends BaseRecord {
    kind: "task";
    title: string;
    dueDate: string;
    priority: "low" | "medium" | "high";
    completed: boolean;
}
export type HabitPeriod = "daily" | "weekly" | "monthly";
export interface HabitFrequency {
    period: HabitPeriod;
    target: number;
    weekdays?: number[];
}
export interface Habit extends BaseRecord {
    kind: "habit";
    title: string;
    schedule: number[];
    archived: boolean;
    description?: string;
    color?: string;
    frequency?: HabitFrequency;
}
export interface HabitCompletion extends BaseRecord {
    habitId: string;
    status?: "completed" | "skipped";
}
export interface Category extends BaseRecord {
    name: string;
    kind: "expense" | "income";
    color: string;
}
export interface AssetHolding extends BaseRecord {
    assetType: string;
    quantity: number;
    unit: string;
    location: string;
    description: string;
    unitPriceMinor?: number;
    priceCurrency?: string;
}
export interface AssetType {
    id: string;
    name: string;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}
export type Entry = Transaction | JournalEntry | Task;
export const uid = () => crypto.randomUUID();
export const localDate = (date = new Date()) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export const localDateTime = (date = new Date()) =>
    `${localDate(date)}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
export const money = (minor: number) =>
    new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        maximumFractionDigits: 2,
    }).format(minor / 100);

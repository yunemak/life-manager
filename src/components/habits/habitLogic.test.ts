import { describe, expect, it } from "vitest";
import type { Habit, HabitCompletion } from "../../domain";
import {
    dayState,
    habitStats,
    isScheduled,
    localDay,
    periodStart,
    shiftDay,
} from "./habitLogic";

const daily: Habit = {
    id: "daily",
    kind: "habit",
    title: "Read",
    schedule: [1, 2, 3, 4, 5],
    frequency: { period: "daily", target: 1, weekdays: [1, 2, 3, 4, 5] },
    archived: false,
    localDate: "2025-01-06",
    createdAt: "2025-01-06T12:00:00.000Z",
    updatedAt: "2025-01-06T12:00:00.000Z",
};
const completion = (
    habitId: string,
    date: string,
    status: "completed" | "skipped" = "completed",
): HabitCompletion => ({
    id: `${habitId}-${date}`,
    habitId,
    localDate: date,
    status,
    createdAt: `${date}T12:00:00.000Z`,
    updatedAt: `${date}T12:00:00.000Z`,
});

describe("habit date handling and schedule", () => {
    it("parses and shifts local calendar dates without UTC conversion", () => {
        expect(localDay("2025-01-01").getDate()).toBe(1);
        expect(shiftDay("2025-01-01", -1)).toBe("2024-12-31");
        expect(periodStart("2025-01-05", "weekly")).toBe("2024-12-30");
    });
    it("marks weekday schedules and future dates distinctly", () => {
        expect(isScheduled(daily, "2025-01-06")).toBe(true);
        expect(isScheduled(daily, "2025-01-05")).toBe(false);
        expect(dayState(daily, "2025-01-05", [], "2025-01-08")).toBe(
            "unscheduled",
        );
        expect(dayState(daily, "2025-01-07", [], "2025-01-08")).toBe("missed");
        expect(dayState(daily, "2025-01-09", [], "2025-01-08")).toBe("future");
        expect(
            dayState(
                daily,
                "2025-01-08",
                [completion("daily", "2025-01-08", "skipped")],
                "2025-01-08",
            ),
        ).toBe("skipped");
    });
});

describe("frequency-aware habit statistics", () => {
    it("calculates daily streaks and weekday-based completion rates", () => {
        const habit = { ...daily, localDate: "2025-01-10" };
        const done = [
            "2025-01-10",
            "2025-01-13",
            "2025-01-14",
            "2025-01-15",
        ].map((d) => completion("daily", d));
        const result = habitStats(habit, done, "2025-01-15");
        expect(result.currentStreak).toBe(4);
        expect(result.longestStreak).toBe(4);
        expect(result.completionRate).toBe(100);
        expect(dayState(habit, "2025-01-09", done, "2025-01-15")).toBe(
            "unscheduled",
        );
    });
    it("measures weekly goals by successful weeks rather than daily streaks", () => {
        const habit: Habit = {
            ...daily,
            id: "weekly",
            schedule: [],
            frequency: { period: "weekly", target: 3 },
            localDate: "2024-12-01",
        };
        const done = ["2025-01-13", "2025-01-14", "2025-01-15"].map((d) =>
            completion("weekly", d),
        );
        expect(habitStats(habit, done, "2025-01-15").currentStreak).toBe(1);
        expect(dayState(habit, "2025-01-15", done, "2025-01-15")).toBe(
            "completed",
        );
    });
    it("supports monthly targets and returns empty stats for a new habit", () => {
        const habit: Habit = {
            ...daily,
            id: "monthly",
            frequency: { period: "monthly", target: 5 },
            localDate: "2025-01-01",
        };
        const done = [
            "2025-01-02",
            "2025-01-04",
            "2025-01-08",
            "2025-01-10",
            "2025-01-13",
        ].map((d) => completion("monthly", d));
        expect(habitStats(habit, done, "2025-01-15").currentStreak).toBe(1);
        const fresh = { ...habit, id: "fresh", localDate: "2025-01-15" };
        expect(habitStats(fresh, [], "2025-01-15").completionRate).toBe(0);
    });
});

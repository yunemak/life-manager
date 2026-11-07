import { describe, expect, it } from "vitest";
import { localDate, money } from "./domain";

describe("local date and currency helpers", () => {
    it("formats dates using local calendar fields, not UTC", () => {
        expect(localDate(new Date(2025, 0, 2, 23, 50))).toBe("2025-01-02");
    });

    it("formats TRY from integer minor units", () => {
        expect(money(12345)).toContain("123,45");
        expect(money(-100)).toContain("1,00");
    });
});

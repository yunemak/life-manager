import type { Entry } from "../../domain";
import { t, type Language } from "../../i18n";

export const categoryDisplay = (name: string, language: Language) =>
    t(name, language);

export const entryTimestamp = (item: Entry) =>
    item.kind === "expense" ||
    item.kind === "income" ||
    item.kind === "activity" ||
    item.kind === "note"
        ? item.occurredAt
        : item.createdAt;

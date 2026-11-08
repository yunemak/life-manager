import { useState } from "react";
import type { FormEvent } from "react";
import type { Entry, RecordKind, Task } from "../domain";
import type { Page } from "./types";
import { deleteEntry, saveEntry, toggleTask } from "../data/entries";

function entryKindsForPage(page: Page): RecordKind[] {
    if (page === "finance") return ["expense", "income"];
    if (page === "journal") return ["activity", "note"];
    if (page === "tasks") return ["task"];
    return ["expense", "income", "activity", "note", "task"];
}

export default function useEntryWorkflow(
    page: Page,
    today: string,
    refresh: () => Promise<void>,
    notify: (message: string) => void,
    text: (value: string) => string,
) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Entry | null>(null);
    const [kind, setKind] = useState<RecordKind>("expense");
    const [deleteCandidate, setDeleteCandidate] = useState<Entry | null>(null);

    const openEntry = (
        nextKind: RecordKind = "expense",
        entry: Entry | null = null,
    ) => {
        setKind(nextKind);
        setEditing(entry);
        setOpen(true);
    };

    const save = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            await saveEntry(
                new FormData(event.currentTarget),
                editing,
                kind,
                today,
            );
            setOpen(false);
            setEditing(null);
            await refresh();
            notify(text("Kaydedildi"));
        } catch (error) {
            notify(
                error instanceof Error
                    ? text(error.message)
                    : text("Kayıt sırasında hata oluştu"),
            );
        }
    };

    const requestDelete = (entry: Entry) => setDeleteCandidate(entry);

    const confirmDelete = async () => {
        if (!deleteCandidate) return;
        const entry = deleteCandidate;
        setDeleteCandidate(null);
        setOpen(false);
        setEditing(null);
        try {
            await deleteEntry(entry);
            await refresh();
            notify(text("Kayıt silindi"));
        } catch (error) {
            notify(
                error instanceof Error
                    ? text(error.message)
                    : text("Kayıt silinemedi"),
            );
        }
    };

    const toggleTaskCompletion = async (task: Task) => {
        try {
            await toggleTask(task);
            await refresh();
        } catch (error) {
            notify(
                error instanceof Error
                    ? text(error.message)
                    : text("Görev güncellenemedi"),
            );
        }
    };

    return {
        open,
        editing,
        kind,
        deleteCandidate,
        availableKinds: entryKindsForPage(page),
        openEntry,
        close: () => setOpen(false),
        changeKind: (nextKind: RecordKind) => {
            setKind(nextKind);
            if (editing) setEditing(null);
        },
        save,
        requestDelete,
        cancelDelete: () => setDeleteCandidate(null),
        confirmDelete,
        toggleTaskCompletion,
    };
}

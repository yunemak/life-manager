import { useState } from "react";
import type { FormEvent } from "react";
import { addExpenseCategory, updateCategoryColor } from "../data/categories";

export default function useCategoryActions(
    today: string,
    refresh: () => Promise<void>,
    notify: (message: string) => void,
    text: (value: string) => string,
) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [color, setColor] = useState("#65a784");

    const openDialog = () => {
        setName("");
        setColor("#65a784");
        setOpen(true);
    };

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) return;

        try {
            await addExpenseCategory(trimmedName, color, today);
            setOpen(false);
            setName("");
            await refresh();
        } catch (error) {
            notify(
                error instanceof Error
                    ? text(error.message)
                    : text("Kategori eklenemedi"),
            );
        }
    };

    const changeColor = async (categoryId: string, nextColor: string) => {
        try {
            await updateCategoryColor(categoryId, nextColor);
            await refresh();
        } catch (error) {
            notify(
                error instanceof Error
                    ? text(error.message)
                    : text("Kategori rengi güncellenemedi"),
            );
        }
    };

    return {
        open,
        name,
        color,
        setName,
        setColor,
        openDialog,
        close: () => setOpen(false),
        submit,
        changeColor,
    };
}

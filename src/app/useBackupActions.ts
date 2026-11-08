import type { Category, Transaction } from "../domain";
import {
    exportCsv as exportTransactionsCsv,
    exportJson as exportBackupJson,
    importJson as importBackupJson,
} from "../data/backup";

export default function useBackupActions(
    today: string,
    transactions: Transaction[],
    categories: Category[],
    refresh: () => Promise<void>,
    notify: (message: string) => void,
    text: (value: string) => string,
) {
    const exportJson = async () => {
        try {
            await exportBackupJson(today);
        } catch (error) {
            notify(
                error instanceof Error
                    ? text(error.message)
                    : text("Yedek dışa aktarılamadı"),
            );
        }
    };

    const importJson = async (file: File) => {
        try {
            await importBackupJson(file);
            await refresh();
            notify(text("Yedek başarıyla içe aktarıldı"));
        } catch (error) {
            notify(
                error instanceof Error
                    ? text(error.message)
                    : text("Yedek içe aktarılamadı"),
            );
        }
    };

    const exportCsv = async () => {
        try {
            await exportTransactionsCsv(transactions, categories, today);
        } catch (error) {
            notify(
                error instanceof Error
                    ? text(error.message)
                    : text("CSV dışa aktarılamadı"),
            );
        }
    };

    return { exportJson, importJson, exportCsv };
}

import { db } from "../db";
import type { Category, Transaction } from "../domain";

function download(name: string, text: string, type: string) {
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(new Blob([text], { type }));
    anchor.download = name;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
}

export async function exportJson(today: string) {
    const [
        transactions,
        journal,
        tasks,
        habits,
        completions,
        categories,
        assetHoldings,
        assetTypes,
    ] = await Promise.all([
        db.transactions.toArray(),
        db.journal.toArray(),
        db.tasks.toArray(),
        db.habits.toArray(),
        db.completions.toArray(),
        db.categories.toArray(),
        db.assetHoldings.toArray(),
        db.assetTypes.toArray(),
    ]);

    download(
        `life-manager-${today}.json`,
        JSON.stringify(
            {
                format: "life-manager-backup",
                version: 1,
                exportedAt: new Date().toISOString(),
                data: {
                    transactions,
                    journal,
                    tasks,
                    habits,
                    completions,
                    categories,
                    assetHoldings,
                    assetTypes,
                },
            },
            null,
            2,
        ),
        "application/json",
    );
}

export async function importJson(file: File) {
    const backup = JSON.parse(await file.text());
    if (
        backup.format !== "life-manager-backup" ||
        backup.version !== 1 ||
        !backup.data
    ) {
        throw Error("Yedek biçimi tanınmıyor.");
    }

    const data = backup.data;
    for (const key of [
        "transactions",
        "journal",
        "tasks",
        "habits",
        "completions",
        "categories",
    ] as const) {
        if (!Array.isArray(data[key]))
            throw Error(`Yedek verisi eksik: ${key}`);
        for (const row of data[key])
            if (!row.id || !row.localDate)
                throw Error(`Geçersiz kayıt: ${key}`);
    }
    if (data.assetHoldings !== undefined && !Array.isArray(data.assetHoldings))
        throw Error("Invalid asset holdings in backup.");
    const assetHoldings = Array.isArray(data.assetHoldings)
        ? data.assetHoldings
        : [];
    for (const holding of assetHoldings) {
        if (
            !holding.id ||
            !holding.localDate ||
            !holding.assetType ||
            !holding.unit ||
            !Number.isFinite(holding.quantity) ||
            holding.quantity <= 0
        ) {
            throw Error("Invalid asset holding in backup.");
        }
    }
    if (data.assetTypes !== undefined && !Array.isArray(data.assetTypes))
        throw Error("Invalid asset types in backup.");
    const assetTypes = Array.isArray(data.assetTypes) ? data.assetTypes : [];
    for (const type of assetTypes)
        if (!type.id || !type.name)
            throw Error("Invalid asset type in backup.");

    const merge = confirm(
        "Tamam ile birleştir, İptal ile mevcut veriyi silip yedeği yükle?",
    );
    const tables = [
        db.transactions,
        db.journal,
        db.tasks,
        db.habits,
        db.completions,
        db.categories,
        db.assetHoldings,
        db.assetTypes,
    ];
    await db.transaction("rw", tables, async () => {
        if (!merge) await Promise.all(tables.map((table) => table.clear()));
        await db.transactions.bulkPut(data.transactions);
        await db.journal.bulkPut(data.journal);
        await db.tasks.bulkPut(data.tasks);
        await db.habits.bulkPut(data.habits);
        await db.completions.bulkPut(data.completions);
        await db.categories.bulkPut(data.categories);
        await db.assetHoldings.bulkPut(assetHoldings);
        await db.assetTypes.bulkPut(assetTypes);
    });
}

export function exportCsv(
    transactions: Transaction[],
    categories: Category[],
    today: string,
) {
    const rows = [
        ["Tarih", "Tür", "Tutar (kuruş)", "Kategori", "Açıklama"],
        ...transactions.map((transaction) => [
            transaction.localDate,
            transaction.kind,
            String(transaction.amountMinor),
            categories.find(
                (category) => category.id === transaction.categoryId,
            )?.name || "",
            transaction.description,
        ]),
    ];

    download(
        `finans-${today}.csv`,
        "\uFEFF" +
            rows
                .map((row) =>
                    row
                        .map(
                            (value) =>
                                `"${String(value).replaceAll('"', '""')}"`,
                        )
                        .join(";"),
                )
                .join("\n"),
        "text/csv;charset=utf-8",
    );
}

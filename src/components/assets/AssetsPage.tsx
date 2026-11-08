import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type FormEvent,
} from "react";
import {
    ArrowLeft,
    Coins,
    Edit2,
    Plus,
    Settings2,
    Trash2,
    X,
} from "lucide-react";
import { db } from "../../db";
import {
    localDate,
    uid,
    type AssetHolding,
    type AssetType,
} from "../../domain";
import { t, type Language } from "../../i18n";
import styles from "./AssetsPage.module.css";

interface Props {
    language: Language;
    onNotice: (message: string) => void;
}
interface AssetGroup {
    key: string;
    name: string;
    unit: string;
    currency: string | null;
    holdings: AssetHolding[];
    quantity: number;
    valueMinor: number | null;
}
const currencyCodes = new Set([
    "TRY",
    "USD",
    "EUR",
    "GBP",
    "JPY",
    "CHF",
    "CAD",
    "AUD",
]);
const defaultAssetTypes = [
    "TRY",
    "Hisse senedi",
    "Altın",
    "USD",
    "EUR",
    "Diğer",
];
const isGoldType = (name: string) =>
    ["altın", "gold"].includes(name.trim().toLocaleLowerCase());
const currencyAssetUnit = (name: string) =>
    ["TRY", "EUR", "USD"].includes(name.trim().toUpperCase())
        ? name.trim().toUpperCase()
        : null;
const turkishText: Record<string, string> = {
    Assets: "Varlıklar",
    "TRACK YOUR ASSETS": "VARLIKLARINI TAKİP ET",
    "View your current assets grouped by type.":
        "Mevcut varlıklarını türlerine göre görüntüle.",
    "Add holding": "Varlık ekle",
    "Back to assets": "Varlıklara dön",
    "ASSET DETAILS": "VARLIK DETAYI",
    Total: "Toplam",
    "Individual holdings": "Bireysel varlık kayıtları",
    "Locations and notes for each holding.": "Her kaydın konumu ve notları.",
    "Unit price": "Birim fiyat",
    holding: "kayıt",
    holdings: "kayıt",
    "No assets yet": "Henüz varlık yok",
    "Add your first holding to start tracking your assets.":
        "Varlıklarını takip etmeye başlamak için ilk kaydını ekle.",
    ASSETS: "VARLIKLAR",
    "Edit holding": "Kaydı düzenle",
    "Asset type": "Varlık türü",
    "Select an asset type": "Varlık türü seç",
    "Add asset type": "Varlık türü ekle",
    "New asset type": "Yeni varlık türü",
    "Create type": "Tür oluştur",
    "Type name is required.": "Varlık türü adı gerekli.",
    "Manage my assets": "Varlık türlerini yönet",
    "Manage asset types": "Varlık türlerini yönet",
    "Current asset types": "Mevcut varlık türleri",
    Default: "Varsayılan",
    Custom: "Özel",
    "Edit asset type": "Varlık türünü düzenle",
    "Asset type updated.": "Varlık türü güncellendi.",
    "Asset type already exists.": "Bu varlık türü zaten mevcut.",
    "Delete asset type?": "Varlık türü silinsin mi?",
    "Are you sure you want to delete this asset type?":
        "Bu varlık türünü silmek istediğine emin misin?",
    "Asset type deleted.": "Varlık türü silindi.",
    "This type is used by holdings and cannot be deleted. Rename it or remove its holdings first.":
        "Bu tür varlık kayıtlarında kullanılıyor ve silinemez. Önce adını değiştir veya ilgili kayıtları kaldır.",
    "No custom asset types yet.": "Henüz özel varlık türü yok.",
    Date: "Tarih",
    "e.g. Gold, Cash, Stocks, USD": "Örn. Altın, Nakit, Hisse, USD",
    Quantity: "Miktar",
    Unit: "Birim",
    "e.g. gram, share, TRY": "Örn. gram, adet, TRY",
    Location: "Konum",
    "e.g. Desk drawer, bank safe": "Örn. Masa çekmecesi, banka kasası",
    "Description / notes": "Açıklama / notlar",
    "Unit price (optional)": "Birim fiyat (isteğe bağlı)",
    "Price currency": "Fiyat para birimi",
    "Enter a valid asset type, quantity, and unit.":
        "Geçerli bir varlık türü, miktar ve birim gir.",
    "Enter a valid unit price.": "Geçerli bir birim fiyat gir.",
    "Enter a valid price currency.": "Geçerli bir fiyat para birimi gir.",
    "Holding updated.": "Varlık kaydı güncellendi.",
    "Holding added.": "Varlık kaydı eklendi.",
    "Holding deleted.": "Varlık kaydı silindi.",
    "Delete holding?": "Varlık kaydı silinsin mi?",
    "Are you sure you want to delete this holding?":
        "Bu varlık kaydını silmek istediğine emin misin?",
    Edit: "Düzenle",
    Delete: "Sil",
    Close: "Kapat",
    Cancel: "Vazgeç",
    "Save changes": "Değişiklikleri kaydet",
};
const assetText = (value: string, language: Language) =>
    language === "en" ? t(value, language) : (turkishText[value] ?? value);

export default function AssetsPage({ language, onNotice }: Props) {
    const text = (value: string) => assetText(value, language);
    const reportError = useCallback(
        (error: unknown) =>
            onNotice(
                assetText(
                    error instanceof Error
                        ? error.message
                        : "An unexpected database error occurred.",
                    language,
                ),
            ),
        [language, onNotice],
    );
    const [holdings, setHoldings] = useState<AssetHolding[]>([]);
    const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [editing, setEditing] = useState<AssetHolding | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<AssetHolding | null>(null);
    const [managing, setManaging] = useState(false);
    const [editingType, setEditingType] = useState<AssetType | null>(null);
    const [deleteTypeTarget, setDeleteTypeTarget] = useState<AssetType | null>(
        null,
    );
    const load = async () => {
        const [all, types] = await db.transaction(
            "rw",
            db.assetHoldings,
            db.assetTypes,
            async () => {
                const all = await db.assetHoldings.toArray(),
                    existing = await db.assetTypes.toArray(),
                    now = new Date().toISOString();
                const legacyCash = existing.find(
                    (type) =>
                        type.isDefault &&
                        type.name.trim().toLocaleLowerCase() === "nakit",
                );
                const tryType = existing.find(
                    (type) => type.name.trim().toLocaleLowerCase() === "try",
                );
                if (legacyCash) {
                    const legacyName = legacyCash.name;
                    if (tryType) {
                        await db.assetHoldings
                            .where("assetType")
                            .equals(legacyName)
                            .modify({
                                assetType: tryType.name,
                                updatedAt: now,
                            });
                        await db.assetTypes.delete(legacyCash.id);
                        existing.splice(existing.indexOf(legacyCash), 1);
                    } else {
                        await db.assetTypes.update(legacyCash.id, {
                            name: "TRY",
                            updatedAt: now,
                        });
                        await db.assetHoldings
                            .where("assetType")
                            .equals(legacyName)
                            .modify({ assetType: "TRY", updatedAt: now });
                        legacyCash.name = "TRY";
                        legacyCash.updatedAt = now;
                        for (const holding of all)
                            if (holding.assetType === legacyName)
                                holding.assetType = "TRY";
                    }
                }
                for (const holding of all) {
                    const unit = currencyAssetUnit(holding.assetType);
                    if (unit && holding.unit !== unit) {
                        await db.assetHoldings.update(holding.id, {
                            unit,
                            updatedAt: now,
                        });
                        holding.unit = unit;
                    }
                }
                const known = new Set<string>(),
                    unique: AssetType[] = [],
                    duplicates: string[] = [];
                for (const type of existing) {
                    const key = type.name.trim().toLocaleLowerCase();
                    if (known.has(key)) duplicates.push(type.id);
                    else {
                        known.add(key);
                        unique.push(type);
                    }
                }
                const additions: AssetType[] = [];
                if (!existing.length)
                    for (const name of defaultAssetTypes)
                        if (!known.has(name.toLocaleLowerCase())) {
                            additions.push({
                                id: uid(),
                                name,
                                isDefault: true,
                                createdAt: now,
                                updatedAt: now,
                            });
                            known.add(name.toLocaleLowerCase());
                        }
                for (const holding of all) {
                    const name = holding.assetType.trim(),
                        key = name.toLocaleLowerCase();
                    if (name && !known.has(key)) {
                        additions.push({
                            id: uid(),
                            name,
                            isDefault: false,
                            createdAt: now,
                            updatedAt: now,
                        });
                        known.add(key);
                    }
                }
                if (additions.length) await db.assetTypes.bulkAdd(additions);
                if (duplicates.length)
                    await db.assetTypes.bulkDelete(duplicates);
                return [all, [...unique, ...additions]] as const;
            },
        );
        setAssetTypes(
            [...types].sort(
                (a, b) =>
                    Number(b.isDefault) - Number(a.isDefault) ||
                    a.name.localeCompare(b.name),
            ),
        );
        setHoldings(
            all.sort(
                (a, b) =>
                    a.assetType.localeCompare(b.assetType) ||
                    a.createdAt.localeCompare(b.createdAt),
            ),
        );
    };
    useEffect(() => {
        void load().catch(reportError);
    }, [reportError]);
    const groups = useMemo(() => {
        const map = new Map<string, AssetGroup>();
        for (const holding of holdings) {
            const unit = holding.unit.trim(),
                nativeCurrency = currencyCodes.has(unit.toUpperCase())
                    ? unit.toUpperCase()
                    : null;
            const currency = isGoldType(holding.assetType)
                ? null
                : (nativeCurrency ??
                  holding.priceCurrency?.toUpperCase() ??
                  null);
            const key = [
                holding.assetType.trim().toLocaleLowerCase(),
                unit.toLocaleLowerCase(),
            ].join("|");
            let group = map.get(key);
            if (!group) {
                group = {
                    key,
                    name: holding.assetType,
                    unit,
                    currency,
                    holdings: [],
                    quantity: 0,
                    valueMinor: 0,
                };
                map.set(key, group);
            } else if (
                group.holdings.length > 0 &&
                currency &&
                group.currency &&
                currency !== group.currency
            ) {
                group.currency = null;
                group.valueMinor = null;
            }
            group.holdings.push(holding);
            group.quantity += holding.quantity;
            const value = isGoldType(holding.assetType)
                ? null
                : nativeCurrency
                  ? Math.round(holding.quantity * 100)
                  : holding.unitPriceMinor === undefined
                    ? null
                    : Math.round(holding.quantity * holding.unitPriceMinor);
            if (value === null) group.valueMinor = null;
            else if (group.valueMinor !== null) group.valueMinor += value;
        }
        return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
    }, [holdings]);
    const selected = groups.find((group) => group.key === selectedKey) ?? null;
    const createType = async (name: string) => {
        const clean = name.trim();
        if (!clean) return null;
        const existing = assetTypes.find(
            (type) =>
                type.name.trim().toLocaleLowerCase() ===
                clean.toLocaleLowerCase(),
        );
        if (existing) return existing.name;
        const now = new Date().toISOString(),
            type: AssetType = {
                id: uid(),
                name: clean,
                isDefault: false,
                createdAt: now,
                updatedAt: now,
            };
        await db.assetTypes.add(type);
        setAssetTypes((current) =>
            [...current, type].sort(
                (a, b) =>
                    Number(b.isDefault) - Number(a.isDefault) ||
                    a.name.localeCompare(b.name),
            ),
        );
        return clean;
    };
    const typeLabel = (name: string) =>
        language === "en"
            ? ((
                  {
                      "Hisse senedi": "Stocks",
                      Altın: "Gold",
                      Diğer: "Other",
                  } as Record<string, string>
              )[name] ?? name)
            : name;
    const saveType = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!editingType) return;
        const name = String(
            new FormData(event.currentTarget).get("name") ?? "",
        ).trim();
        if (!name) {
            onNotice(text("Type name is required."));
            return;
        }
        if (
            assetTypes.some(
                (type) =>
                    type.id !== editingType.id &&
                    type.name.trim().toLocaleLowerCase() ===
                        name.toLocaleLowerCase(),
            )
        ) {
            onNotice(text("Asset type already exists."));
            return;
        }
        await db.transaction(
            "rw",
            db.assetTypes,
            db.assetHoldings,
            async () => {
                await db.assetTypes.update(editingType.id, {
                    name,
                    updatedAt: new Date().toISOString(),
                });
                await db.assetHoldings
                    .where("assetType")
                    .equals(editingType.name)
                    .modify({
                        assetType: name,
                        updatedAt: new Date().toISOString(),
                    });
            },
        );
        setEditingType(null);
        await load();
        onNotice(text("Asset type updated."));
    };
    const removeType = async () => {
        if (!deleteTypeTarget) return;
        const used = holdings.some(
            (holding) => holding.assetType === deleteTypeTarget.name,
        );
        if (used) {
            onNotice(
                text(
                    "This type is used by holdings and cannot be deleted. Rename it or remove its holdings first.",
                ),
            );
            setDeleteTypeTarget(null);
            return;
        }
        await db.assetTypes.delete(deleteTypeTarget.id);
        setDeleteTypeTarget(null);
        await load();
        onNotice(text("Asset type deleted."));
    };

    if (managing)
        return (
            <section className={styles.page}>
                <button
                    className={styles.back}
                    onClick={() => setManaging(false)}
                >
                    <ArrowLeft size={16} />
                    {text("Back to assets")}
                </button>
                <div className="page-heading">
                    <div>
                        <div className="eyebrow">{text("ASSETS")}</div>
                        <h1>{text("Manage asset types")}</h1>
                        <p>{text("Current asset types")}</p>
                    </div>
                </div>
                <section className="panel">
                    <div className={styles.typeList}>
                        {assetTypes.map((type) => {
                            const used = holdings.filter(
                                (holding) => holding.assetType === type.name,
                            ).length;
                            return (
                                <article
                                    className={styles.typeRow}
                                    key={type.id}
                                >
                                    <div className={styles.typeInfo}>
                                        <b>{typeLabel(type.name)}</b>
                                        <span>
                                            {type.isDefault
                                                ? text("Default")
                                                : text("Custom")}{" "}
                                            · {used}{" "}
                                            {text(
                                                used === 1
                                                    ? "holding"
                                                    : "holdings",
                                            )}
                                        </span>
                                    </div>
                                    {!type.isDefault && (
                                        <div className={styles.holdingActions}>
                                            <button
                                                aria-label={`${text("Edit")} ${typeLabel(type.name)}`}
                                                onClick={() =>
                                                    setEditingType(type)
                                                }
                                            >
                                                <Edit2 size={15} />
                                            </button>
                                            <button
                                                aria-label={`${text("Delete")} ${typeLabel(type.name)}`}
                                                onClick={() =>
                                                    setDeleteTypeTarget(type)
                                                }
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                        {!assetTypes.some((type) => !type.isDefault) && (
                            <p className={styles.noCustom}>
                                {text("No custom asset types yet.")}
                            </p>
                        )}
                    </div>
                </section>
                {editingType && (
                    <div
                        className="modal-backdrop"
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget)
                                setEditingType(null);
                        }}
                    >
                        <form
                            className={styles.form}
                            onSubmit={(event) => {
                                void saveType(event).catch(reportError);
                            }}
                        >
                            <header>
                                <div>
                                    <div className="eyebrow">
                                        {text("ASSETS")}
                                    </div>
                                    <h2>{text("Edit asset type")}</h2>
                                </div>
                                <button
                                    type="button"
                                    className="icon-button"
                                    onClick={() => setEditingType(null)}
                                    aria-label={text("Close")}
                                >
                                    <X size={18} />
                                </button>
                            </header>
                            <label>
                                {text("Asset type")}
                                <input
                                    name="name"
                                    required
                                    maxLength={70}
                                    autoFocus
                                    defaultValue={editingType.name}
                                />
                            </label>
                            <div className={styles.formActions}>
                                <button
                                    type="button"
                                    className="secondary"
                                    onClick={() => setEditingType(null)}
                                >
                                    {text("Cancel")}
                                </button>
                                <button type="submit" className="primary">
                                    {text("Save changes")}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
                {deleteTypeTarget && (
                    <div className="modal-backdrop confirm-backdrop">
                        <section
                            className="confirm-sheet"
                            role="alertdialog"
                            aria-modal="true"
                            aria-label={text("Delete asset type?")}
                        >
                            <h2>{text("Delete asset type?")}</h2>
                            <p>
                                {holdings.some(
                                    (holding) =>
                                        holding.assetType ===
                                        deleteTypeTarget.name,
                                )
                                    ? text(
                                          "This type is used by holdings and cannot be deleted. Rename it or remove its holdings first.",
                                      )
                                    : text(
                                          "Are you sure you want to delete this asset type?",
                                      )}
                            </p>
                            <div className="confirm-actions">
                                <button
                                    className="secondary"
                                    onClick={() => setDeleteTypeTarget(null)}
                                >
                                    {text("Cancel")}
                                </button>
                                {!holdings.some(
                                    (holding) =>
                                        holding.assetType ===
                                        deleteTypeTarget.name,
                                ) && (
                                    <button
                                        className="danger-button"
                                        onClick={() =>
                                            void removeType().catch(reportError)
                                        }
                                    >
                                        <Trash2 size={15} />
                                        {text("Delete")}
                                    </button>
                                )}
                            </div>
                        </section>
                    </div>
                )}
            </section>
        );
    const openForm = (holding: AssetHolding | null = null) => {
        setEditing(holding);
        setFormOpen(true);
    };
    const save = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget),
            assetType = String(data.get("assetType") ?? "").trim(),
            quantity = Number(
                String(data.get("quantity") ?? "").replace(",", "."),
            ),
            unit =
                currencyAssetUnit(assetType) ??
                String(data.get("unit") ?? "").trim(),
            unitPrice = String(data.get("unitPrice") ?? "").trim(),
            priceCurrency = String(data.get("priceCurrency") ?? "TRY")
                .trim()
                .toUpperCase();
        if (
            !assetType ||
            !unit ||
            !Number.isFinite(quantity) ||
            quantity <= 0
        ) {
            onNotice(text("Enter a valid asset type, quantity, and unit."));
            return;
        }
        if (
            unitPrice &&
            (!Number.isFinite(Number(unitPrice.replace(",", "."))) ||
                Number(unitPrice.replace(",", ".")) < 0)
        ) {
            onNotice(text("Enter a valid unit price."));
            return;
        }
        if (unitPrice) {
            try {
                new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: priceCurrency,
                }).format(0);
            } catch {
                onNotice(text("Enter a valid price currency."));
                return;
            }
        }
        const entryDate = String(data.get("localDate") ?? "").trim();
        if (
            !/^\d{4}-\d{2}-\d{2}$/.test(entryDate) ||
            Number.isNaN(new Date(`${entryDate}T12:00:00`).getTime())
        ) {
            onNotice(text("Enter a valid date."));
            return;
        }
        const now = new Date().toISOString(),
            holding: AssetHolding = {
                id: editing?.id ?? uid(),
                assetType,
                quantity,
                unit,
                location: String(data.get("location") ?? "").trim(),
                description: String(data.get("description") ?? "").trim(),
                ...(unitPrice
                    ? {
                          unitPriceMinor: Math.round(
                              Number(unitPrice.replace(",", ".")) * 100,
                          ),
                          priceCurrency,
                      }
                    : {}),
                localDate: entryDate,
                createdAt: editing?.createdAt ?? now,
                updatedAt: now,
            };
        await db.assetHoldings.put(holding);
        setFormOpen(false);
        setEditing(null);
        await load();
        onNotice(text(editing ? "Holding updated." : "Holding added."));
        if (selectedKey) {
            const key = [
                holding.assetType.trim().toLocaleLowerCase(),
                holding.unit.trim().toLocaleLowerCase(),
            ].join("|");
            if (key !== selectedKey) setSelectedKey(null);
        }
    };
    const remove = async () => {
        if (!deleteTarget) return;
        await db.assetHoldings.delete(deleteTarget.id);
        setDeleteTarget(null);
        await load();
        onNotice(text("Holding deleted."));
    };
    const valueText = (minor: number | null, currency: string | null) =>
        minor === null || !currency
            ? null
            : new Intl.NumberFormat(language === "en" ? "en-US" : "tr-TR", {
                  style: "currency",
                  currency,
                  maximumFractionDigits: 2,
              }).format(minor / 100);
    const quantityText = (quantity: number) =>
        new Intl.NumberFormat(language === "en" ? "en-US" : "tr-TR", {
            maximumFractionDigits: 4,
        }).format(quantity);

    if (selected)
        return (
            <section className={styles.page}>
                <button
                    className={styles.back}
                    onClick={() => setSelectedKey(null)}
                >
                    <ArrowLeft size={16} />
                    {text("Back to assets")}
                </button>
                <div className="page-heading">
                    <div>
                        <div className="eyebrow">{text("ASSET DETAILS")}</div>
                        <h1>{typeLabel(selected.name)}</h1>
                    </div>
                    <button className="primary" onClick={() => openForm()}>
                        <Plus size={17} />
                        {text("Add holding")}
                    </button>
                </div>
                <section className="panel">
                    <div className={styles.totalSummary}>
                        <span>{text("Total")}</span>
                        <strong>
                            {quantityText(selected.quantity)} {selected.unit}
                        </strong>
                        {valueText(selected.valueMinor, selected.currency) && (
                            <b>
                                {valueText(
                                    selected.valueMinor,
                                    selected.currency,
                                )}
                            </b>
                        )}
                    </div>
                    <div className={styles.holdingList}>
                        {selected.holdings.map((holding) => (
                            <article
                                className={styles.holding}
                                key={holding.id}
                            >
                                <div className={styles.holdingMain}>
                                    <b>
                                        {quantityText(holding.quantity)}{" "}
                                        {holding.unit}
                                    </b>
                                    <small>
                                        {text("Date")}:{" "}
                                        {new Intl.DateTimeFormat(
                                            language === "en"
                                                ? "en-US"
                                                : "tr-TR",
                                        ).format(
                                            new Date(
                                                `${holding.localDate}T12:00:00`,
                                            ),
                                        )}
                                    </small>
                                    {holding.location && (
                                        <span>{holding.location}</span>
                                    )}
                                    {holding.description && (
                                        <small>{holding.description}</small>
                                    )}
                                    {!isGoldType(holding.assetType) &&
                                        holding.unitPriceMinor !==
                                            undefined && (
                                            <small>
                                                {text("Unit price")}:{" "}
                                                {valueText(
                                                    holding.unitPriceMinor,
                                                    holding.priceCurrency ??
                                                        "TRY",
                                                )}
                                            </small>
                                        )}
                                </div>
                                <div className={styles.holdingActions}>
                                    <button
                                        aria-label={`${text("Edit")} ${holding.assetType}`}
                                        onClick={() => openForm(holding)}
                                    >
                                        <Edit2 size={15} />
                                    </button>
                                    <button
                                        aria-label={`${text("Delete")} ${holding.assetType}`}
                                        onClick={() => setDeleteTarget(holding)}
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
                {formOpen && (
                    <AssetForm
                        language={language}
                        holding={editing}
                        assetTypes={assetTypes}
                        typeLabel={typeLabel}
                        onCreateType={createType}
                        onError={reportError}
                        initialType={selected.name}
                        onClose={() => {
                            setFormOpen(false);
                            setEditing(null);
                        }}
                        onSubmit={(event) => {
                            void save(event).catch(reportError);
                        }}
                    />
                )}
                {deleteTarget && (
                    <DeleteDialog
                        language={language}
                        onCancel={() => setDeleteTarget(null)}
                        onConfirm={() => void remove().catch(reportError)}
                    />
                )}
            </section>
        );

    return (
        <section className={styles.page}>
            <div className="page-heading">
                <div>
                    <div className="eyebrow">{text("TRACK YOUR ASSETS")}</div>
                    <h1>{text("Assets")}</h1>
                    <p>{text("View your current assets grouped by type.")}</p>
                </div>
                <div className={styles.headingActions}>
                    <button
                        className="secondary"
                        onClick={() => setManaging(true)}
                    >
                        <Settings2 size={16} />
                        {text("Manage my assets")}
                    </button>
                    <button className="primary" onClick={() => openForm()}>
                        <Plus size={17} />
                        {text("Add holding")}
                    </button>
                </div>
            </div>
            {groups.length ? (
                <div className={styles.assetGrid}>
                    {groups.map((group) => (
                        <button
                            className={styles.assetCard}
                            key={group.key}
                            onClick={() => setSelectedKey(group.key)}
                        >
                            <span className={styles.assetIcon}>
                                <Coins size={19} />
                            </span>
                            <span className={styles.assetName}>
                                {typeLabel(group.name)}
                            </span>
                            <b className={styles.quantity}>
                                {quantityText(group.quantity)}{" "}
                                <small>{group.unit}</small>
                            </b>
                            <span className={styles.assetMeta}>
                                {group.holdings.length}{" "}
                                {text(
                                    group.holdings.length === 1
                                        ? "holding"
                                        : "holdings",
                                )}
                            </span>
                            {valueText(group.valueMinor, group.currency) && (
                                <strong className={styles.assetValue}>
                                    {valueText(
                                        group.valueMinor,
                                        group.currency,
                                    )}
                                </strong>
                            )}
                        </button>
                    ))}
                </div>
            ) : (
                <section className={`panel ${styles.empty}`}>
                    <div className={styles.assetIcon}>
                        <Coins size={20} />
                    </div>
                    <h2>{text("No assets yet")}</h2>
                    <p>
                        {text(
                            "Add your first holding to start tracking your assets.",
                        )}
                    </p>
                    <button className="secondary" onClick={() => openForm()}>
                        <Plus size={16} />
                        {text("Add holding")}
                    </button>
                </section>
            )}
            {formOpen && (
                <AssetForm
                    language={language}
                    holding={editing}
                    assetTypes={assetTypes}
                    typeLabel={typeLabel}
                    onCreateType={createType}
                    onError={reportError}
                    onClose={() => {
                        setFormOpen(false);
                        setEditing(null);
                    }}
                    onSubmit={(event) => {
                        void save(event).catch(reportError);
                    }}
                />
            )}
            {deleteTarget && (
                <DeleteDialog
                    language={language}
                    onCancel={() => setDeleteTarget(null)}
                    onConfirm={() => void remove().catch(reportError)}
                />
            )}
        </section>
    );
}

function AssetForm({
    language,
    holding,
    assetTypes,
    typeLabel,
    onCreateType,
    onError,
    initialType = "",
    onClose,
    onSubmit,
}: {
    language: Language;
    holding: AssetHolding | null;
    assetTypes: AssetType[];
    typeLabel: (name: string) => string;
    onCreateType: (name: string) => Promise<string | null>;
    onError: (error: unknown) => void;
    initialType?: string;
    onClose: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
    const text = (value: string) =>
        language === "en" ? t(value, language) : (turkishText[value] ?? value);
    const [selectedType, setSelectedType] = useState(
            holding?.assetType ?? initialType,
        ),
        [typeCreatorOpen, setTypeCreatorOpen] = useState(false),
        [newTypeName, setNewTypeName] = useState("");
    const addType = async () => {
        const name = await onCreateType(newTypeName);
        if (name) {
            setSelectedType(name);
            setNewTypeName("");
            setTypeCreatorOpen(false);
        }
    };
    return (
        <div
            className="modal-backdrop"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <form className={styles.form} onSubmit={onSubmit}>
                <header>
                    <div>
                        <div className="eyebrow">{text("ASSETS")}</div>
                        <h2>
                            {text(holding ? "Edit holding" : "Add holding")}
                        </h2>
                    </div>
                    <button
                        type="button"
                        className="icon-button"
                        onClick={onClose}
                        aria-label={text("Close")}
                    >
                        <X size={18} />
                    </button>
                </header>
                <div className={styles.typeField}>
                    <label htmlFor="asset-type-select">
                        {text("Asset type")}
                    </label>
                    <div className={styles.typeSelect}>
                        <select
                            id="asset-type-select"
                            name="assetType"
                            required
                            autoFocus
                            value={selectedType}
                            onChange={(event) =>
                                setSelectedType(event.target.value)
                            }
                        >
                            <option value="">
                                {text("Select an asset type")}
                            </option>
                            {assetTypes.map((type) => (
                                <option key={type.id} value={type.name}>
                                    {typeLabel(type.name)}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            className="secondary"
                            onClick={() => setTypeCreatorOpen((open) => !open)}
                        >
                            <Plus size={15} />
                            {text("Add asset type")}
                        </button>
                    </div>
                </div>
                {typeCreatorOpen && (
                    <div className={styles.typeCreator}>
                        <label>
                            {text("New asset type")}
                            <input
                                value={newTypeName}
                                autoFocus
                                maxLength={70}
                                onChange={(event) =>
                                    setNewTypeName(event.target.value)
                                }
                            />
                        </label>
                        <button
                            type="button"
                            className="secondary"
                            onClick={() => void addType().catch(onError)}
                        >
                            {text("Create type")}
                        </button>
                    </div>
                )}
                <div className={styles.twoFields}>
                    <label>
                        {text("Quantity")}
                        <input
                            name="quantity"
                            type="number"
                            min="0.0001"
                            step="any"
                            required
                            defaultValue={holding?.quantity ?? ""}
                        />
                    </label>
                    <label>
                        {text("Unit")}
                        {currencyAssetUnit(selectedType) ? (
                            <input
                                name="unit"
                                value={currencyAssetUnit(selectedType) ?? ""}
                                readOnly
                                aria-readonly="true"
                            />
                        ) : (
                            <input
                                name="unit"
                                required
                                maxLength={20}
                                defaultValue={holding?.unit ?? ""}
                                placeholder={text("e.g. gram, share, TRY")}
                            />
                        )}
                    </label>
                </div>
                <label>
                    {text("Date")}
                    <input
                        name="localDate"
                        type="date"
                        required
                        defaultValue={holding?.localDate ?? localDate()}
                    />
                </label>
                <label>
                    {text("Location")}
                    <input
                        name="location"
                        maxLength={120}
                        defaultValue={holding?.location ?? ""}
                        placeholder={text("e.g. Desk drawer, bank safe")}
                    />
                </label>
                <label>
                    {text("Description / notes")}
                    <textarea
                        name="description"
                        rows={2}
                        maxLength={300}
                        defaultValue={holding?.description ?? ""}
                    />
                </label>
                {!isGoldType(selectedType) && (
                    <div className={styles.twoFields}>
                        <label>
                            {text("Unit price (optional)")}
                            <input
                                name="unitPrice"
                                type="number"
                                min="0"
                                step="0.01"
                                defaultValue={
                                    holding?.unitPriceMinor === undefined
                                        ? ""
                                        : holding.unitPriceMinor / 100
                                }
                            />
                        </label>
                        <label>
                            {text("Price currency")}
                            <input
                                name="priceCurrency"
                                maxLength={3}
                                defaultValue={holding?.priceCurrency ?? "TRY"}
                                placeholder="TRY"
                            />
                        </label>
                    </div>
                )}
                <div className={styles.formActions}>
                    <button
                        type="button"
                        className="secondary"
                        onClick={onClose}
                    >
                        {text("Cancel")}
                    </button>
                    <button type="submit" className="primary">
                        {text(holding ? "Save changes" : "Add holding")}
                    </button>
                </div>
            </form>
        </div>
    );
}

function DeleteDialog({
    language,
    onCancel,
    onConfirm,
}: {
    language: Language;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    const text = (value: string) =>
        language === "en" ? t(value, language) : (turkishText[value] ?? value);
    return (
        <div
            className="modal-backdrop confirm-backdrop"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onCancel();
            }}
        >
            <section
                className="confirm-sheet"
                role="alertdialog"
                aria-modal="true"
                aria-label={text("Delete holding?")}
            >
                <h2>{text("Delete holding?")}</h2>
                <p>{text("Are you sure you want to delete this holding?")}</p>
                <div className="confirm-actions">
                    <button className="secondary" onClick={onCancel}>
                        {text("Cancel")}
                    </button>
                    <button className="danger-button" onClick={onConfirm}>
                        <Trash2 size={15} />
                        {text("Delete")}
                    </button>
                </div>
            </section>
        </div>
    );
}

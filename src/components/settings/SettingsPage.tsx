import { useState } from "react";
import { Cloud, Download, FileText, Moon, Plus, Sun } from "lucide-react";
import type { Category } from "../../domain";
import { t, type Language } from "../../i18n";
import styles from "./SettingsPage.module.css";

const categoryColors = [
    "#d96767",
    "#ec9a55",
    "#d6b449",
    "#65a784",
    "#438a67",
    "#399c9a",
    "#6091d5",
    "#467caf",
    "#a080d0",
    "#dc7180",
    "#8c99a8",
    "#795548",
];

interface SettingsPageProps {
    language: Language;
    theme: string;
    accent: "green" | "blue";
    title: string;
    categories: Category[];
    onLanguageChange: (language: Language) => void;
    onThemeChange: (theme: string) => void;
    onAccentChange: (accent: "green" | "blue") => void;
    onExportJson: () => void;
    onImportFile: (file: File) => void;
    onExportCsv: () => void;
    onCategoryColorChange: (categoryId: string, color: string) => void;
    onAddCategory: () => void;
}

export function CategoryColorPicker({
    value,
    label,
    onChange,
}: {
    value: string;
    label: string;
    onChange: (color: string) => void;
}) {
    const [open, setOpen] = useState(false);

    return (
        <div className={styles.colorPicker}>
            <button
                type="button"
                className={styles.colorTrigger}
                aria-label={label}
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen(!open)}
            >
                <i style={{ background: value }} />
                <span>{value.toUpperCase()}</span>
            </button>
            {open && (
                <div
                    className={styles.colorMenu}
                    role="menu"
                    aria-label={label}
                >
                    {categoryColors.map((color) => (
                        <button
                            type="button"
                            role="menuitemradio"
                            aria-label={color}
                            aria-checked={value.toLowerCase() === color}
                            className={
                                value.toLowerCase() === color
                                    ? styles.selectedColor
                                    : ""
                            }
                            key={color}
                            onClick={() => {
                                onChange(color);
                                setOpen(false);
                            }}
                        >
                            <i style={{ background: color }} />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function SettingsPage({
    language,
    theme,
    accent,
    title,
    categories,
    onLanguageChange,
    onThemeChange,
    onAccentChange,
    onExportJson,
    onImportFile,
    onExportCsv,
    onCategoryColorChange,
    onAddCategory,
}: SettingsPageProps) {
    const text = (value: string) => t(value, language);

    return (
        <>
            <div className="page-heading">
                <div>
                    <div className="eyebrow">{text("SENİN UYGULAMAN")}</div>
                    <h1>{title}</h1>
                    <p>{text("Görünümünü düzenle, verilerini koru.")}</p>
                </div>
            </div>
            <section className="panel setting-panel">
                <h2>{text("Görünüm")}</h2>
                <div className="setting-row">
                    <div>
                        <b>{language === "en" ? "Language" : "Dil"}</b>
                        <small>
                            {language === "en"
                                ? "Choose the interface language."
                                : "Arayüz dilini seç."}
                        </small>
                    </div>
                    <div className="choice-group">
                        <button
                            className={language === "en" ? "chosen" : ""}
                            onClick={() => onLanguageChange("en")}
                        >
                            English
                        </button>
                        <button
                            className={language === "tr" ? "chosen" : ""}
                            onClick={() => onLanguageChange("tr")}
                        >
                            {text("Türkçe")}
                        </button>
                    </div>
                </div>
                <div className="setting-row">
                    <div>
                        <b>{text("Renk teması")}</b>
                        <small>{text("Uygulamanın vurgu rengini seç.")}</small>
                    </div>
                    <div className="choice-group">
                        <button
                            className={accent === "green" ? "chosen" : ""}
                            onClick={() => onAccentChange("green")}
                        >
                            <i className="dot green-dot" />
                            {text("Yeşil")}
                        </button>
                        <button
                            className={accent === "blue" ? "chosen" : ""}
                            onClick={() => onAccentChange("blue")}
                        >
                            <i className="dot blue-dot" />
                            {language === "en" ? "Blue" : "Mavi"}
                        </button>
                    </div>
                </div>
                <div className="setting-row">
                    <div>
                        <b>{text("Görünüm modu")}</b>
                        <small>{text("Açık veya koyu tema.")}</small>
                    </div>
                    <div className="choice-group">
                        <button
                            className={theme === "light" ? "chosen" : ""}
                            onClick={() => onThemeChange("light")}
                        >
                            <Sun size={15} /> {text("Açık")}
                        </button>
                        <button
                            className={theme === "dark" ? "chosen" : ""}
                            onClick={() => onThemeChange("dark")}
                        >
                            <Moon size={15} />
                            {language === "en" ? "Dark" : "Koyu"}
                        </button>
                    </div>
                </div>
            </section>
            <section className="panel setting-panel">
                <h2>{language === "en" ? "Privacy" : "Gizlilik"}</h2>
                <p className="subtle">
                    {text(
                        "Verilerin bu cihazda saklanır. Hesap gerekmez; dışarı aktararak yedekleyebilirsin.",
                    )}
                </p>
                <div className="backup-actions">
                    <button className="secondary" onClick={onExportJson}>
                        <Download size={17} /> {text("JSON yedeği indir")}
                    </button>
                    <button
                        className="secondary"
                        onClick={() =>
                            document.getElementById("backup-file")?.click()
                        }
                    >
                        <FileText size={17} /> {text("Yedeği içe aktar")}
                    </button>
                    <input
                        id="backup-file"
                        type="file"
                        accept="application/json,.json"
                        hidden
                        onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) onImportFile(file);
                            event.currentTarget.value = "";
                        }}
                    />
                    <button className="secondary" onClick={onExportCsv}>
                        <Download size={17} /> {text("Finans CSV indir")}
                    </button>
                </div>
                <div className="drive-note">
                    <Cloud size={18} />
                    <span>
                        <b>{text("Google Drive yedekleme")}</b>
                        <small>
                            {text(
                                "Bu sürümde Drive bağlantısı yapılandırılmadı. Manuel yedekler cihazında çalışır; OAuth ayarı olmadan bağlantı sunulmaz.",
                            )}
                        </small>
                    </span>
                </div>
            </section>
            <section className="panel setting-panel">
                <h2>{text("Özel kategoriler")}</h2>
                {categories.map((category) => (
                    <div
                        className={`category-line custom-category-line ${styles.categoryLine}`}
                        key={category.id}
                    >
                        <i style={{ background: category.color }} />
                        <span>{text(category.name)}</span>
                        <small>
                            {text(
                                category.kind === "expense" ? "Gider" : "Gelir",
                            )}
                        </small>
                        <CategoryColorPicker
                            value={category.color}
                            label={`${text("Kategori rengi")}: ${text(category.name)}`}
                            onChange={(color) =>
                                onCategoryColorChange(category.id, color)
                            }
                        />
                    </div>
                ))}
                <button
                    className="secondary category-add-button"
                    onClick={onAddCategory}
                >
                    <Plus size={16} /> {text("Gider kategorisi ekle")}
                </button>
            </section>
            <section className="panel setting-panel">
                <h2>{text("Gizlilik")}</h2>
                <p className="subtle">
                    {text(
                        "Kişisel kayıtların tarayıcının yerel veritabanında saklanır. Tarayıcı verilerini temizlemek kayıtlarını silebilir. Düzenli yedek almanı öneririz. İnternet bağlantısı olmadan kayıtlarına erişebilirsin.",
                    )}
                </p>
            </section>
        </>
    );
}

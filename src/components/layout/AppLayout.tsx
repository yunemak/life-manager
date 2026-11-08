import type { ReactNode } from "react";
import {
    Activity,
    BarChart3,
    CalendarDays,
    FileText,
    Gem,
    Home,
    Languages,
    ListTodo,
    Moon,
    MoreHorizontal,
    Plus,
    Settings,
    Sun,
    Wallet,
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { Language } from "../../i18n";
import type { Page } from "../../app/types";

interface AppLayoutProps {
    page: Page;
    language: Language;
    theme: string;
    today: string;
    moreOpen: boolean;
    contentClassName?: string;
    pageLabel: (page: Page) => string;
    onNavigate: (page: Page) => void;
    onLanguageToggle: () => void;
    onThemeToggle: () => void;
    onMoreToggle: () => void;
    onQuickAdd: () => void;
    children: ReactNode;
}

const primaryPages: Array<{ page: Page; icon: typeof Home }> = [
    { page: "home", icon: Home },
    { page: "finance", icon: Wallet },
    { page: "calendar", icon: CalendarDays },
    { page: "journal", icon: FileText },
    { page: "tasks", icon: ListTodo },
    { page: "habits", icon: Activity },
    { page: "assets", icon: Gem },
    { page: "stats", icon: BarChart3 },
];

const morePages: Array<{ page: Page; icon: typeof Settings }> = [
    { page: "tasks", icon: ListTodo },
    { page: "habits", icon: Activity },
    { page: "assets", icon: Gem },
    { page: "stats", icon: BarChart3 },
    { page: "settings", icon: Settings },
];

const bottomPages = primaryPages.slice(0, 4);

export default function AppLayout({
    page,
    language,
    theme,
    today,
    moreOpen,
    contentClassName = "",
    pageLabel,
    onNavigate,
    onLanguageToggle,
    onThemeToggle,
    onMoreToggle,
    onQuickAdd,
    children,
}: AppLayoutProps) {
    const text = (turkish: string, english: string) =>
        language === "en" ? english : turkish;

    return (
        <div className="app-shell">
            <aside className="sidebar">
                <div className="brand">
                    <div className="brand-mark">L</div>
                    <span>lifemanager</span>
                </div>
                <div className="side-label">{text("MENÜ", "MENU")}</div>
                {primaryPages.map(({ page: target, icon: Icon }) => (
                    <button
                        key={target}
                        className={`nav-item ${page === target ? "active" : ""}`}
                        onClick={() => onNavigate(target)}
                    >
                        <Icon size={19} />
                        {pageLabel(target)}
                    </button>
                ))}
                <div className="side-bottom">
                    <button
                        className={`nav-item ${page === "settings" ? "active" : ""}`}
                        onClick={() => onNavigate("settings")}
                    >
                        <Settings size={19} />
                        {pageLabel("settings")}
                    </button>
                    <div className="privacy-note">
                        {text(
                            "◈ Verileriniz bu cihazda güvende.",
                            "◈ Your data is safe on this device.",
                        )}
                    </div>
                </div>
            </aside>
            <main className="main">
                <header className="topbar">
                    <div className="mobile-brand">
                        <div className="brand-mark">L</div>
                        <b>{pageLabel(page)}</b>
                    </div>
                    <div className="top-date">
                        {format(new Date(`${today}T12:00:00`), "EEEE, d MMMM", {
                            locale: language === "en" ? undefined : tr,
                        })}
                    </div>
                    <div className="top-actions">
                        <button
                            className="icon-button language-button"
                            aria-label={text(
                                "Switch language to English",
                                "Switch language to Turkish",
                            )}
                            title={text("Türkçe", "English")}
                            onClick={onLanguageToggle}
                        >
                            <Languages size={18} />
                            <span>{language.toUpperCase()}</span>
                        </button>
                        <button
                            className="icon-button"
                            aria-label={text(
                                "Görünümü değiştir",
                                "Toggle appearance",
                            )}
                            onClick={onThemeToggle}
                        >
                            {theme === "light" ? (
                                <Moon size={18} />
                            ) : (
                                <Sun size={18} />
                            )}
                        </button>
                        <button
                            className="avatar"
                            onClick={() => onNavigate("settings")}
                        >
                            Y
                        </button>
                    </div>
                </header>
                <div className={`content ${contentClassName}`}>{children}</div>
                <nav className="bottom-nav">
                    {bottomPages.map(({ page: target, icon: Icon }) => (
                        <button
                            key={target}
                            className={page === target ? "selected" : ""}
                            onClick={() => onNavigate(target)}
                        >
                            <Icon size={20} />
                            <span>{pageLabel(target)}</span>
                        </button>
                    ))}
                    <button
                        className={
                            morePages.some(
                                ({ page: target }) => target === page,
                            )
                                ? "selected"
                                : ""
                        }
                        onClick={onMoreToggle}
                    >
                        <MoreHorizontal size={20} />
                        <span>{text("Daha", "More")}</span>
                    </button>
                </nav>
                {moreOpen && (
                    <div className="more-menu">
                        {morePages.map(({ page: target, icon: Icon }) => (
                            <button
                                key={target}
                                onClick={() => onNavigate(target)}
                            >
                                <Icon size={17} />
                                {pageLabel(target)}
                            </button>
                        ))}
                    </div>
                )}
                {!(["habits", "assets", "settings"] as Page[]).includes(
                    page,
                ) && (
                    <button
                        className="fab"
                        aria-label={text("Hızlı kayıt ekle", "Add quick entry")}
                        onClick={onQuickAdd}
                    >
                        <Plus size={26} />
                    </button>
                )}
            </main>
        </div>
    );
}

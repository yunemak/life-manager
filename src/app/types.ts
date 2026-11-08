export type Page =
    | "home"
    | "finance"
    | "calendar"
    | "journal"
    | "tasks"
    | "habits"
    | "assets"
    | "stats"
    | "settings"
    | "dayEntries";

export const pageLabels: Record<Page, string> = {
    home: "Genel Bakış",
    finance: "Finans",
    calendar: "Takvim",
    journal: "Günlük",
    tasks: "Görevler",
    habits: "Alışkanlıklar",
    assets: "Varlıklar",
    stats: "İstatistikler",
    settings: "Ayarlar",
    dayEntries: "Günün kayıtları",
};

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import type { Language } from "../../i18n";

interface CalendarPageProps {
    language: Language;
    title: string;
    eyebrow: string;
    monthLabel: string;
    month: Date;
    daysInMonth: number;
    offset: number;
    today: string;
    selectedDate: string;
    datesWithEntries: string[];
    onPreviousMonth: () => void;
    onNextMonth: () => void;
    onSelectDate: (date: string) => void;
    children: ReactNode;
}

export default function CalendarPage({
    language,
    title,
    eyebrow,
    monthLabel,
    month,
    daysInMonth,
    offset,
    today,
    selectedDate,
    datesWithEntries,
    onPreviousMonth,
    onNextMonth,
    onSelectDate,
    children,
}: CalendarPageProps) {
    const weekdays =
        language === "en"
            ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
            : ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

    return (
        <>
            <section className="panel calendar-panel">
                <div className="panel-heading">
                    <div>
                        <div className="eyebrow">{eyebrow}</div>
                        <h2 className="calendar-title">{title}</h2>
                    </div>
                    <div className="month-nav">
                        <button
                            aria-label={
                                language === "en"
                                    ? "Previous month"
                                    : "Önceki ay"
                            }
                            onClick={onPreviousMonth}
                        >
                            <ChevronLeft />
                        </button>
                        <b>{monthLabel}</b>
                        <button
                            aria-label={
                                language === "en" ? "Next month" : "Sonraki ay"
                            }
                            onClick={onNextMonth}
                        >
                            <ChevronRight />
                        </button>
                    </div>
                </div>
                <div className="calendar-grid">
                    {weekdays.map((weekday) => (
                        <span className="weekday" key={weekday}>
                            {weekday}
                        </span>
                    ))}
                    {Array.from({ length: offset }, (_, index) => (
                        <span key={`blank${index}`} />
                    ))}
                    {Array.from({ length: daysInMonth }, (_, index) => {
                        const day = String(index + 1).padStart(2, "0");
                        const date = `${format(month, "yyyy-MM")}-${day}`;
                        const selected = selectedDate === date;
                        const hasEntries = datesWithEntries.includes(date);

                        return (
                            <button
                                onClick={() => onSelectDate(date)}
                                className={`calendar-day ${date === today ? "today" : ""} ${selected ? "selected" : ""}`}
                                key={date}
                            >
                                {index + 1}
                                {hasEntries && <i />}
                            </button>
                        );
                    })}
                </div>
            </section>
            {children}
        </>
    );
}

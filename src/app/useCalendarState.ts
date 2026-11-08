import { useEffect, useState } from "react";
import { localDate } from "../domain";
import { getCompletedHabitIds } from "../data/habits";

export default function useCalendarState() {
    const [month, setMonth] = useState(() => new Date());
    const [selectedDate, setSelectedDate] = useState(localDate);
    const [completedHabitIds, setCompletedHabitIds] = useState<string[]>([]);

    useEffect(() => {
        let active = true;
        void getCompletedHabitIds(selectedDate)
            .then((habitIds) => {
                if (active) setCompletedHabitIds(habitIds);
            })
            .catch(() => {
                if (active) setCompletedHabitIds([]);
            });

        return () => {
            active = false;
        };
    }, [selectedDate]);

    return {
        month,
        setMonth,
        selectedDate,
        setSelectedDate,
        completedHabitIds,
    };
}

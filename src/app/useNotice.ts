import { useEffect, useState } from "react";

export default function useNotice() {
    const [notice, setNotice] = useState("");

    useEffect(() => {
        if (!notice) return;
        const timer = setTimeout(() => setNotice(""), 2800);
        return () => clearTimeout(timer);
    }, [notice]);

    return { notice, notify: setNotice, clearNotice: () => setNotice("") };
}

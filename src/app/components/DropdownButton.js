import { useEffect, useRef, useState } from "react";
import "./DropdownButton.css";

export default function DropdownButton({ value, setValue, options, styleOverride={} }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);


    return <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
        <button onClick={() => setOpen(o => !o)}>
            {value in options ? options[value] : Object.values(options)[0]}
        </button>

        {open && (
            <div className="dark-scrollable"
                style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    background: "#1a1a1a",
                    border: "1px solid #777",
                    borderRadius: "4px",
                    zIndex: 10,
                    maxHeight: "240px",
                    overflowY: "auto",
                    overflowX: "hidden",
                    ...styleOverride
                }}
            >
                {Object.entries(options).map(([k, v]) => (
                    <div key={k} className="dropdown-button-option" onClick={() => { setValue(k); setOpen(false); }} >
                        {v}
                    </div>
                ))}
            </div>
        )}
    </div>;
}
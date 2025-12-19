import { useEffect, useRef, useState } from "react";
import "./DisplayTypeButton.css";

const options = {
    "names": "Icons with Names",
    "icons": "Icons Only",
    "stats": "Stats",
    "types": "Skill Types",
    "s1": "Skill 1",
    "s2": "Skill 2",
    "s3": "Skill 3",
    "def": "Defense",
    "skills": "All Skills",
    "passives1": "Combat Passives",
    "passives2": "Support Passives",
    "ego1": "Zayin Details",
    "ego2": "Teth Details",
    "ego3": "He Details",
    "ego4": "Waw Details",
    "ego5": "Aleph Details",
    "egoa": "E.G.O Awakenings",
    "egob": "E.G.O Corrosions",
    "egopassives": "E.G.O Passives",
    "egocosts": "E.G.O Costs",
    "egoresists": "E.G.O Resists"
};

const optionsWithEdit = {
    "edit": "Editing",
    ...options
}

export default function DisplayTypeButton({ value, setValue, includeEdit = false }) {
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
            {value in optionsWithEdit ? optionsWithEdit[value] : options["names"]}
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
                    overflowX: "hidden"
                }}
            >
                {Object.entries((includeEdit ? optionsWithEdit : options)).map(([k, v]) => (
                    <div key={k} className="display-type-option" onClick={() => { setValue(k); setOpen(false); }} >
                        {v}
                    </div>
                ))}
            </div>
        )}
    </div>;
}
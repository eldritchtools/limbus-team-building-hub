"use client";

import * as Select from "@radix-ui/react-select";
import { useRef, useState } from "react";
import "./uptieSelector.css";

function TierComponent({ tier }) {
    let str = "";
    switch (tier) {
        case 1: str = "I"; break;
        case 2: str = "II"; break;
        case 3: str = "III"; break;
        case 4: str = "IV"; break;
        default: str = ""; break;
    }
    return <span style={{ fontFamily: "'Archivo Narrow', sans-serif", fontWeight: "bold", fontSize: "1.5rem", color: "#ffd84d", transform: "scaleY(1.2)" }}>{str}</span>
}

function UptieSelector({ value, setValue, allowEmpty = false, emptyIcon = null, scale = null, bottomOption = null }) {
    const [isOpen, setIsOpen] = useState(false);

    const triggerRef = useRef(null);

    const handleUpdateValue = (updatedValue) => {
        if (!updatedValue) setValue("");
        else setValue(updatedValue);
    }

    return <Select.Root value={value} onValueChange={handleUpdateValue} open={isOpen} onOpenChange={setIsOpen}>
        <Select.Trigger className="uptie-select-trigger" ref={triggerRef}>
            {value || !emptyIcon ?
                <TierComponent tier={value} /> :
                emptyIcon
            }
        </Select.Trigger>

        <Select.Portal>
            <Select.Content className="uptie-select-content" style={{ width: allowEmpty ? "12.5rem" : "10rem" }} position="popper">
                <Select.Viewport>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <div className="uptie-select-grid" style={{ gridTemplateColumns: `repeat(${allowEmpty ? 5 : 4}, 1fr)` }}>
                            {[1, 2, 3, 4].map((option) =>
                                <Select.Item key={option} value={option} className="uptie-select-item">
                                    <div className="uptie-item-inner">
                                        <TierComponent tier={option} />
                                    </div>
                                </Select.Item>
                            )}
                            {allowEmpty ? <Select.Item key={"cancel"} value={null} className="uptie-select-item">
                                <div className="uptie-item-inner" style={{ height: "1.5rem", justifyContent: "center", color: "#ff4848", fontSize: "1rem", fontWeight: "bold" }}>
                                    ✕
                                </div>
                            </Select.Item> : null}
                        </div>
                        {
                            bottomOption ? <Select.Item key={bottomOption} value={bottomOption} className="uptie-select-item">
                                {bottomOption}
                            </Select.Item> : null
                        }
                    </div>
                </Select.Viewport>
            </Select.Content>
        </Select.Portal>
    </Select.Root>
}

export default UptieSelector;
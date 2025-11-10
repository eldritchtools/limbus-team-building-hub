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
    return <span style={{ fontFamily: "'Archivo Narrow', sans-serif", fontWeight: "bold", fontSize: "24px", color: "#ffd84d", transform: "scaleY(1.2)" }}>{str}</span>
}

function UptieSelector({ value, setValue }) {
    const [isOpen, setIsOpen] = useState(false);

    const triggerRef = useRef(null);

    const handleUpdateValue = (updatedValue) => {
        setValue(updatedValue);
    }

    return <Select.Root value={value} onValueChange={handleUpdateValue} open={isOpen} onOpenChange={setIsOpen}>
        <Select.Trigger className="uptie-select-trigger" ref={triggerRef}>
            <TierComponent tier={value} />
        </Select.Trigger>

        <Select.Content className="uptie-select-content" position="popper">
            <Select.Viewport>
                <div className="uptie-select-grid">
                    {[1, 2, 3, 4].map((option) =>
                        <Select.Item key={option} value={option} className="uptie-select-item">
                            <div className="uptie-item-inner">
                                <TierComponent tier={option} />
                            </div>
                        </Select.Item>
                    )}
                </div>
            </Select.Viewport>
        </Select.Content>
    </Select.Root>
}

export default UptieSelector;
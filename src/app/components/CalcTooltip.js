"use client";

import { Tooltip } from "react-tooltip";
import { tooltipStyle } from "../styles";
import { isTouchDevice } from "@eldritchtools/shared-components";

function CalcTooltipContent({ content }) {
    return <div style={{...tooltipStyle, padding: "0.5rem", margin: "0.5rem", whiteSpace: "pre-wrap"}}>
        {content}
    </div>
}

function CalcTooltip() {
    return <Tooltip
        id="calc-tooltip"
        render={({ content }) => <CalcTooltipContent content={content} />}
        getTooltipContainer={() => document.body}
        style={{ backgroundColor: "transparent", zIndex: "9999" }}
        clickable={isTouchDevice()}
    />
}

export { CalcTooltip };
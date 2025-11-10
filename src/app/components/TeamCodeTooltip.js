import { Tooltip } from "react-tooltip";
import { tooltipStyle } from "../styles";

export function TeamCodeTooltip() {
    return <Tooltip
        id="team-code-tooltip"
        getTooltipContainer={() => document.body}
        style={{ backgroundColor: "transparent", zIndex: "9999" }}
    >
        <div style={{...tooltipStyle, padding: "0.5rem"}}>
            Limbus Company allows quickly copying teams using team codes. This feature can be found beside the team name in the sinner selection menu.
        </div>
    </Tooltip>
}
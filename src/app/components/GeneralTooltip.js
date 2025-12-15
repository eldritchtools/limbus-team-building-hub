import { Tooltip } from "react-tooltip";
import { tooltipStyle } from "../styles";

const tooltipContent = {
    "teamcode": "Limbus Company allows quickly copying teams using team codes. This feature can be found beside the team name in the sinner selection menu.",
    "optionaluptieorlevel": "Only use this if it's important to indicate the levels and only on the values that need it. (Not recommended for max level or uptie)"
}

function generalTooltipProps(typeOrString) {
    return {
        "data-tooltip-id": "general-tooltip",
        "data-tooltip-content": typeOrString in tooltipContent ? tooltipContent[typeOrString] : typeOrString
    }
}

function GeneralTooltip() {
    return <Tooltip
        id="general-tooltip"
        getTooltipContainer={() => document.body}
        render={({ content }) => <div style={{ ...tooltipStyle, padding: "0.5rem", width: "60ch" }}>
            {content}
        </div>}
        style={{ backgroundColor: "transparent", zIndex: "9999" }}
    >
    </Tooltip>
}

export { GeneralTooltip, generalTooltipProps };
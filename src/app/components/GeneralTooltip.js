import { Tooltip } from "react-tooltip";
import { tooltipStyle } from "../styles";

const tooltipContent = {
    "teamcode": "Limbus Company allows quickly copying teams using team codes. This feature can be found beside the team name in the sinner selection menu.",
    "optionaluptieorlevel": "Only use this if it's important to indicate the levels and only on the values that need it. (Not recommended for max level or uptie)",
    "descSearch": "Only matches exact words within the description (excludes status descriptions). Filters out descriptions with no words matching any search words. Use \"search match score\" sorting to sort results based on relevancy (descending is most relevant first).",
    "groupedComp": "Combines all relevant skills/passives. Filters will pass if at least one skill/passive meets all of them. Sorting is based on the sum of the value across all skills/passives. When disabled, skills/passives are filtered and sorted independently from each other."
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
        render={({ content }) => <div style={{ ...tooltipStyle, padding: "0.5rem", maxWidth: "60ch" }}>
            {content}
        </div>}
        style={{ backgroundColor: "transparent", zIndex: "9999" }}
    >
    </Tooltip>
}

export { GeneralTooltip, generalTooltipProps };
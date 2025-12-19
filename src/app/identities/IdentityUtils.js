function constructHp(data, level) {
    const hp = Math.floor(data.hp.base + level * data.hp.level);
    const thresholds = data.breakSection.toReversed().map(x => Math.floor(hp * x / 100)).join(",");

    return `${hp} (${thresholds})`;
}

function constructPassive(passiveId, passiveData) {
    const passive = passiveData[passiveId];
    if ("condition" in passive) return passive;
    Object.entries(passiveData).forEach(([_, p]) => {
        if ("condition" in p && p.name === passive.name)
            passive["condition"] = p.condition;
    })

    return passive;
}

export { constructHp, constructPassive };
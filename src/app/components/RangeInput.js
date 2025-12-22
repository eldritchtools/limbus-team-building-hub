export default function RangeInput({ min = 1, max = 9, value, onChange }) {
    const [localMin, localMax] = value;

    const update = (newMin, newMax) => {
        if (newMin > newMax) return;
        onChange([newMin, newMax]);
    };

    return <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <input
            type="number"
            min={min}
            max={max}
            value={localMin}
            onChange={e => update(Math.max(min, Number(e.target.value)), localMax)}
            style={{ width: "3ch", textAlign: "center" }}
        />
        <span> - </span>
        <input
            type="number"
            min={min}
            max={max}
            value={localMax}
            onChange={e => update(localMin, Math.min(max, Number(e.target.value)))}
            style={{ width: "3ch", textAlign: "center" }}
        />
    </div>;
}

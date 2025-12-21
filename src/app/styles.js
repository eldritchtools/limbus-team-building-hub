const selectStyle = {
    control: (provided, state) => ({
        ...provided,
        backgroundColor: "#2a2a2a",
        color: "#ddd",
        borderColor: state.isFocused ? "#888" : "#555",
        boxShadow: "none",
        "&:hover": { borderColor: "#888" },
        minHeight: "32px",
        minWidth: "15rem",
        maxWidth: "40rem"
    }),
    menu: (provided) => ({
        ...provided,
        backgroundColor: "#2a2a2a",
        border: "1px solid #555",
        maxWidth: "40rem"
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isFocused
            ? "#444"
            : state.isSelected
                ? "#555"
                : "transparent",
        color: "#ddd",
        cursor: "pointer",
    }),
    singleValue: (provided) => ({
        ...provided,
        color: "#ddd",
    }),
    input: (provided) => ({
        ...provided,
        color: "#ddd",
    }),
    valueContainer: (provided) => ({
        ...provided,
        paddingRight: 0,
        minWidth: 1,
        flex: 1
    }),
    multiValue: (provided) => ({
        ...provided,
        backgroundColor: "#555",
        borderRadius: "8px",
        padding: "2px 4px",
    }),
    multiValueLabel: (provided) => ({
        ...provided,
        color: "#ddd",
        fontSize: "0.9em",
    }),
};

const selectStyleWide = {
    ...selectStyle,
    control: (provided, state) => ({
        ...provided,
        backgroundColor: "#2a2a2a",
        color: "#ddd",
        borderColor: state.isFocused ? "#888" : "#555",
        boxShadow: "none",
        "&:hover": { borderColor: "#888" },
        minHeight: "32px",
        width: "55rem"
    }),
    menu: (provided) => ({
        ...provided,
        backgroundColor: "#2a2a2a",
        border: "1px solid #555",
        minHeight: "32px",
        width: "55rem"
    }),
};

const selectStyleVariable = {
    ...selectStyle,
    control: (provided, state) => ({
        ...provided,
        backgroundColor: "#2a2a2a",
        color: "#ddd",
        borderColor: state.isFocused ? "#888" : "#555",
        boxShadow: "none",
        "&:hover": { borderColor: "#888" },
        minHeight: "32px",
        width: "100%"
    }),
    menu: (provided) => ({
        ...provided,
        backgroundColor: "#2a2a2a",
        border: "1px solid #555",
        minHeight: "32px",
        width: "100%"
    }),
};

const tooltipStyle = { outlineStyle: "solid", outlineColor: "#ddd", outlineWidth: "1px", backgroundColor: "#000000", borderRadius: "1rem", zIndex: "9999", maxWidth: "90%" };

const tabStyle = { fontSize: "1.2rem", fontWeight: "bold", cursor: "pointer", transition: "all 0.2s" };

export { tooltipStyle, selectStyle, selectStyleWide, selectStyleVariable, tabStyle };
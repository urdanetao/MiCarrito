

const CoreGroup = ({ label, children, style }) => {
    const fieldsetStyles = {
        background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
        border: "1px solid #d7e2f2",
        borderRadius: "12px",
        padding: "10px 18px 18px 18px",
        margin: "0",
        minWidth: "0",
        width: "auto",
        boxSizing: "border-box",
        boxShadow: "0 4px 14px rgba(18, 56, 93, 0.08)",
    }

    const legendStyles = {
        fontSize: "11px",
        fontWeight: "700",
        color: "#1e4f88",
        letterSpacing: "0.03em",
        textTransform: "uppercase",
        padding: "0 8px",
        background: "linear-gradient(180deg, #ffffff 0%, #eef5ff 100%)",
        border: "1px solid #cfe0f7",
        borderRadius: "999px",
        userSelect: 'none',
    }

    const contentStyles = {
        backgroundColor: "#fff",
    }

    return (
        <fieldset className="coregroup" style={{ ...fieldsetStyles, ...style }}>
            {label && <legend className="coregroup-legend" style={legendStyles}>{label}</legend>}
            <div className="coregroup-content" style={contentStyles}>
                {children}
            </div>
        </fieldset>
    );
};

export default CoreGroup;

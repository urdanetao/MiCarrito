
const CoreLabel = ({ text, color, backColor, size, onClick }) => {
    const defaultText = "Etiqueta";
    const defaultColor = "#666";
    const defaultBackColor = "transparent";
    const defaultSize = "15px";

    if (typeof text !== "string") {
        text = defaultText;
    }

    if (typeof color !== "string") {
        color = defaultColor;
    }

    if (typeof backColor !== "string") {
        backColor = defaultBackColor;
    }

    if (typeof size === "number") {
        size = `${size}px`;
    }

    if (typeof size !== "string") {
        size = defaultSize;
    }

    const spanStyles = {
        fontSize: size,
        color: color,
        backgroundColor: backColor,
        cursor: typeof onClick === "function" ? "pointer" : undefined,
        userSelect: 'none',
    };

    return (
        <div>
            <span style={spanStyles} onClick={onClick}>
                {text}
            </span>
        </div>
    );
};

export default CoreLabel;

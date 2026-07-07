
import { BsWindow } from "react-icons/bs";
import { COLOR_MAP } from "../../util/constants";

const CoreWindow = ({ icon, title, color, width, children }) => {
    const defaultTitle = "Nueva Ventana";

    if (icon === undefined || icon === null) {
        icon = <BsWindow size={20} color="#fff" />;
    }

    if (typeof title !== "string" || title.trim() === "") {
        title = defaultTitle;
    }

    const mainWindowStyles = {
        border: `1px solid ${color || COLOR_MAP.info}`,
        borderRadius: "10px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
        backgroundColor: "#fefefe",
    };

    const headerStyles = {
        backgroundColor: color || COLOR_MAP.info,
        color: "#fff",
        fontSize: "16px",
        padding: "10px 15px",
        borderTopLeftRadius: "8px",
        borderTopRightRadius: "8px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        userSelect: 'none',
    };

    const bodyStyles = {
        padding: "20px",
    };

    return (
        <>
            <div style={{ ...mainWindowStyles, width: width || "auto" }}>
                <div style={headerStyles}>
                    {icon && <span>{icon}</span>}
                    <span style={{ color: "#fff" }}>{title}</span>
                </div>

                <div style={bodyStyles}>
                    {children}
                </div>
            </div>
        </>
    );
};

export default CoreWindow;

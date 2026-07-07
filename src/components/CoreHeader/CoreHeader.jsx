
import { CiUser } from "react-icons/ci";
import micarritoLogo from "../../assets/micarrito_logo.png";
import { COLOR_MAP } from "../../util/constants";

const CoreHeader = ({ sessionData, moduleName, backColor }) => {
    const defaultModuleName = "";
    const defaultUserName = "";
    const defaultBackColor = COLOR_MAP.info;

    let logued = false,
        userName = defaultUserName;

    if (typeof sessionData === "object" && sessionData !== null) {
        logued =
            sessionData.hasOwnProperty("sessionId") &&
                typeof sessionData.sessionId === "string" &&
                sessionData.sessionId.trim() !== "" ? true : false;

        if (typeof moduleName !== "string" || moduleName.trim() === "") {
            moduleName = defaultModuleName;
        }

        if (logued && sessionData.hasOwnProperty("user") && typeof sessionData.user === "object" && sessionData.user !== null) {
            if (sessionData.user.hasOwnProperty("nombre") && typeof sessionData.user.nombre === "string" && sessionData.user.nombre.trim() !== "") {
                userName = sessionData.user.nombre;
            } else if (sessionData.user.hasOwnProperty("nickname") && typeof sessionData.user.nickname === "string" && sessionData.user.nickname.trim() !== "") {
                userName = sessionData.user.nickname;
            }
        }
    }

    if (typeof backColor !== "string" || backColor.trim() === "") {
        backColor = defaultBackColor;
    }

    const textColor = "#fff";

    const headerContainerStyles = {
        width: "100%",
        height: "50px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 15px",
        userSelect: 'none',
    };

    const leftSideContainer = {
        display: "flex",
        alignItems: "center",
        gap: "10px",
    };

    const logoStyles = {
        height: "35px",
        borderRadius: "5px",
    }

    const rightSideContainer = {
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: "10px",
    };

    const moduleUserInfoStyles = {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        fontSize: "13px",
    };

    const userInitialsStyles = {
        width: "35px",
        height: "35px",
        borderRadius: "50%",
        backgroundColor: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#000",
    };

    const iniciales = userName
        .trim()
        .split(" ")
        .filter(Boolean)
        .map(palabra => palabra[0])
        .join("")
        .toUpperCase();

    return (
        <div style={{ backgroundColor: backColor, ...headerContainerStyles }}>
            <div style={leftSideContainer}>
                <img src={micarritoLogo} alt="" style={logoStyles} />
            </div>

            <div style={rightSideContainer}>
                <div style={moduleUserInfoStyles}>
                    <div>
                        <span style={{ color: textColor, textTransform: 'uppercase' }}>{moduleName}</span>
                    </div>
                    {logued && (
                        <div>
                            <span style={{ color: textColor, textTransform: 'uppercase' }}>{userName}</span>
                        </div>
                    )}
                </div>

                {logued && (
                    <div style={userInitialsStyles}>
                        {userName.length > 0 ? (
                            <span style={{ ...userInitialsStyles, color: "#777", fontSize: "14px" }}>{iniciales}</span>
                        ) : (
                            <CiUser style={{ fontSize: "20px", fontWeight: "bold" }} />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CoreHeader;

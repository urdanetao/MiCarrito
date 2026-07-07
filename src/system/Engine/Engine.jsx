
import { FaSignOutAlt } from 'react-icons/fa';
import { CoreButton } from "../../components";
import { getSessionData, setSessionData } from "../../util/util";
import useLazyFetch from "../../hooks/useLazyFetch/useLazyFetch";

const Engine = ({ setSession }) => {
    const { fetchData, BackdropLoader, ErrorModal } = useLazyFetch();

    const handleLogout = async () => {
        try {
            await fetchData("logout", {});
        } catch {
        }

        const emptySession = getSessionData(true);
        setSessionData(emptySession);
        if (typeof setSession === 'function') {
            setSession(emptySession);
        }
    };

    const containerStyles = {
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    };

    return (
        <div style={containerStyles}>
            <CoreButton
                label="Cerrar Sesión"
                icon={<FaSignOutAlt />}
                color="#d32f2f"
                onClick={handleLogout}
                ignoreFormState={true}
            />
            <BackdropLoader />
            <ErrorModal />
        </div>
    );
}

export default Engine;

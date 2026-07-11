
import { useState } from 'react';
import { getSessionData, setSessionData } from "../../util/util";
import useLazyFetch from "../../hooks/useLazyFetch/useLazyFetch";
import { MenuPrincipal, CoreConfirm } from "../../components";
import Categorias from "../Categorias/Categorias";

const Engine = ({ setSession }) => {
    const { fetchData, BackdropLoader, ErrorModal } = useLazyFetch();
    const [selectedSection, setSelectedSection] = useState(null);

    const handleLogout = async () => {
        try {
            await fetchData("logout", {});
        } catch {
            // intentionally empty
        }

        const emptySession = getSessionData(true);
        setSessionData(emptySession);
        if (typeof setSession === 'function') {
            setSession(emptySession);
        }
    };

    const handleBack = () => {
        setSelectedSection(null);
    };

    return (
        <>
            {selectedSection === null && (
                <MenuPrincipal onLogout={handleLogout} onSelect={setSelectedSection} />
            )}
            {selectedSection === 'categorias' && (
                <Categorias onBack={handleBack} />
            )}
            <BackdropLoader />
            <ErrorModal />
            <CoreConfirm />
        </>
    );
}

export default Engine;

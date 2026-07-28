
import { useState, useEffect, useCallback, useRef } from 'react';
import { getSessionData, setSessionData, setBackHandler, isRunningInWebView } from "../../util/util";
import useLazyFetch from "../../hooks/useLazyFetch/useLazyFetch";
import { MenuPrincipal, CoreConfirm, CoreButtonSquare } from "../../components";
import { showConfirm } from "../../components/CoreConfirm/CoreConfirm";
import { IoArrowBack } from 'react-icons/io5';
import Categorias from "../Categorias/Categorias";
import Compras from "../Compras/Compras";
import Monedas from "../Monedas/Monedas";
import Configuracion from "../Configuracion/Configuracion";
import Favoritos from "../Favoritos/Favoritos";

const Engine = ({ setSession }) => {
    const { fetchData, BackdropLoader, ErrorModal } = useLazyFetch();
    const [selectedSection, setSelectedSection] = useState(null);
    const navigationStackRef = useRef([]);

    const handleLogout = useCallback(async () => {
        const emptySession = getSessionData(true);
        setSessionData(emptySession);
        if (typeof setSession === 'function') {
            setSession(emptySession);
        }
        try {
            await fetchData("logout", {});
        } catch {
            // intentionally empty
        }
    }, [fetchData, setSession]);

    const handleLogoutConfirm = useCallback(() => {
        showConfirm({
            text: '¿Está seguro que desea cerrar sesión?',
            okLabel: 'Aceptar',
            cancelLabel: 'Cancelar',
            color: '#d32f2f',
            okAction: () => {
                handleLogout();
            },
        });
    }, [handleLogout]);

    const goBack = useCallback(() => {
        if (navigationStackRef.current.length > 0) {
            const prev = navigationStackRef.current.pop();
            setSelectedSection(prev);
        } else {
            handleLogoutConfirm();
        }
    }, [handleLogoutConfirm]);

    const handleBack = useCallback(() => {
        goBack();
    }, [goBack]);

    const handleSelectSection = useCallback((section) => {
        navigationStackRef.current.push(selectedSection);
        setSelectedSection(section);
    }, [selectedSection]);

    useEffect(() => {
        if (selectedSection === null) {
            navigationStackRef.current = [];
            setBackHandler(() => {
                handleLogoutConfirm();
            });
        }
    }, [selectedSection, handleLogoutConfirm]);

    const showBackButton = !isRunningInWebView() && selectedSection !== null;

    return (
        <>
            {selectedSection === null && (
                <MenuPrincipal onLogoutConfirm={handleLogoutConfirm} onSelect={handleSelectSection} />
            )}
            {selectedSection === 'categorias' && (
                <Categorias goBack={goBack} />
            )}
            {selectedSection === 'compras' && (
                <Compras goBack={goBack} />
            )}
            {selectedSection === 'monedas' && (
                <Monedas goBack={goBack} />
            )}
            {selectedSection === 'config' && (
                <Configuracion goBack={goBack} />
            )}
            {selectedSection === 'favoritos' && (
                <Favoritos goBack={goBack} />
            )}
            {showBackButton && (
                <div style={{ position: 'fixed', bottom: '16px', left: '16px', zIndex: 100 }}>
                    <CoreButtonSquare
                        icon={<IoArrowBack size={18} />}
                        color="#6b7280"
                        onClick={handleBack}
                        ignoreFormState={true}
                    />
                </div>
            )}
            <BackdropLoader />
            <ErrorModal />
            <CoreConfirm />
        </>
    );
}

export default Engine;

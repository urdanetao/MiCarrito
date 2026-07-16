
import { useState, useEffect, useCallback } from 'react';
import { getSessionData, setSessionData, setBackHandler, setRestoreHandler, clearBackHandler, isRunningInWebView } from "../../util/util";
import useLazyFetch from "../../hooks/useLazyFetch/useLazyFetch";
import { MenuPrincipal, CoreConfirm, CoreButtonSquare } from "../../components";
import { showConfirm } from "../../components/CoreConfirm/CoreConfirm";
import { IoArrowBack } from 'react-icons/io5';
import Categorias from "../Categorias/Categorias";
import Compras from "../Compras/Compras";
import Monedas from "../Monedas/Monedas";
import Configuracion from "../Configuracion/Configuracion";

const Engine = ({ setSession }) => {
    const { fetchData, BackdropLoader, ErrorModal } = useLazyFetch();
    const [selectedSection, setSelectedSection] = useState(null);

    const handleLogout = useCallback(async () => {
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
    }, [fetchData, setSession]);

    const handleBack = useCallback(() => {
        window.history.back();
    }, []);

    const goToMenu = useCallback(() => {
        setSelectedSection(null);
    }, []);

    const handleSelectSection = useCallback((section) => {
        setSelectedSection(section);
        window.history.pushState({ section }, '', '');
    }, []);

    useEffect(() => {
        if (selectedSection === null) {
            setBackHandler(() => {
                showConfirm({
                    text: 'Desea cerrar sesion?',
                    okLabel: 'Salir',
                    cancelLabel: 'Cancelar',
                    color: '#d32f2f',
                    okAction: () => {
                        handleLogout();
                    },
                });
            });
        }
    }, [selectedSection, handleLogout]);

    useEffect(() => {
        setRestoreHandler(() => {
            const st = window.history.state;
            setSelectedSection(st && st.section ? st.section : null);
        });
        return () => clearBackHandler();
    }, []);

    const showBackButton = !isRunningInWebView() && selectedSection !== null;

    return (
        <>
            {selectedSection === null && (
                <MenuPrincipal onLogout={handleLogout} onSelect={handleSelectSection} />
            )}
            {selectedSection === 'categorias' && (
                <Categorias onBack={goToMenu} />
            )}
            {selectedSection === 'compras' && (
                <Compras onBack={goToMenu} />
            )}
            {selectedSection === 'monedas' && (
                <Monedas onBack={goToMenu} />
            )}
            {selectedSection === 'config' && (
                <Configuracion onBack={goToMenu} />
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

import { useState, useEffect, useRef } from 'react';
import { IoSettingsOutline } from 'react-icons/io5';
import useLazyFetch from '../../hooks/useLazyFetch/useLazyFetch';
import { CoreWindow, CoreGroup, CoreVSep, CoreToggle } from '../../components';
import { setBackHandler, clearBackHandler, normalizeBool } from '../../util/util';

const CONFIG_COLOR = '#1976d2';

const Configuracion = ({ onBack }) => {
    const { fetchData, BackdropLoader, ErrorModal } = useLazyFetch();

    const [contraerCategorias, setContraerCategorias] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const contraerRef = useRef(false);
    const savingRef = useRef(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const response = await fetchData('getConfig', {});
                if (!cancelled && response?.status) {
                    setContraerCategorias(normalizeBool(response.data?.contraercategorias));
                    contraerRef.current = normalizeBool(response.data?.contraercategorias);
                }
            } catch {
                // intentionally empty
            } finally {
                if (!cancelled) setLoaded(true);
            }
        })();
        return () => { cancelled = true; };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        contraerRef.current = contraerCategorias;
        if (!loaded || savingRef.current) {
            savingRef.current = false;
            return;
        }
        (async () => {
            try {
                await fetchData('saveConfig', {
                    contraercategorias: contraerCategorias ? 1 : 0,
                });
            } catch {
                // intentionally empty
            }
        })();
    }, [contraerCategorias, loaded]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        setBackHandler(() => {
            if (typeof onBack === 'function') {
                onBack();
            }
        });
        return () => clearBackHandler();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const containerStyles = {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#f8fafc',
    };

    const headerStyles = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        backgroundColor: '#fff',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        flexShrink: 0,
    };

    const titleStyles = {
        fontSize: '15px',
        fontWeight: '700',
        color: '#1e293b',
        margin: 0,
    };

    return (
        <>
            <div style={containerStyles}>
                <div style={headerStyles}>
                    <IoSettingsOutline size={22} color={CONFIG_COLOR} />
                    <h2 style={titleStyles}>Configuracion</h2>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                    <CoreWindow
                        icon={<IoSettingsOutline size={20} color="#fff" />}
                        title="Preferencias"
                        color={CONFIG_COLOR}
                    >
                        <CoreGroup label="Compras">
                            <CoreToggle
                                label="Contraer categorias"
                                value={contraerCategorias ? '1' : '0'}
                                onChange={(e) => {
                                    contraerRef.current = e.target.value === '1';
                                    setContraerCategorias(e.target.value === '1');
                                }}
                                ignoreFormState={true}
                            />
                            <CoreVSep size={8} />
                            <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>
                                {loaded ? (contraerCategorias ? 'Las categorias se muestran contraidas al abrir una compra.' : 'Las categorias se muestran desplegadas al abrir una compra.') : ''}
                            </div>
                        </CoreGroup>
                    </CoreWindow>
                </div>

                <BackdropLoader />
                <ErrorModal />
            </div>
        </>
    );
};

export default Configuracion;

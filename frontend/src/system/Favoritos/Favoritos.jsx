import { useState, useEffect, useRef, useCallback } from 'react';
import { IoArrowBack, IoStar, IoTrash, IoAdd, IoQrCode, IoCamera } from 'react-icons/io5';
import { ENTRY_MODE } from '../../util/constants';
import { CoreText, CoreButtonSquare, CoreButton, CoreConfirm } from '../../components';
import { showConfirm, isConfirmOpen, dismissConfirm } from '../../components/CoreConfirm/CoreConfirm';
import { setBackHandler, clearBackHandler, getSessionData, isRunningInWebView } from '../../util/util';
import useLazyFetch from '../../hooks/useLazyFetch/useLazyFetch';

const FAVORITOS_COLOR = '#f57c00';

const Favoritos = ({ goBack }) => {
    const { fetchData, BackdropLoader, ErrorModal } = useLazyFetch();

    const [favoritos, setFavoritos] = useState([]);
    const [nuevoFav, setNuevoFav] = useState('');
    const [showQrModal, setShowQrModal] = useState(false);

    const inputRef = useRef(null);
    const isEditingRef = useRef(false);
    const showQrModalRef = useRef(false);

    const nickname = getSessionData()?.user?.nickname || '';

    const loadFavoritos = useCallback(async () => {
        try {
            const response = await fetchData('getFavoritos', {});
            if (response?.status && Array.isArray(response.data)) {
                setFavoritos(response.data);
            }
        } catch {
            // intentionally empty
        }
    }, [fetchData]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!cancelled) {
                await loadFavoritos();
            }
        })();
        return () => { cancelled = true; };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        showQrModalRef.current = showQrModal;
    });

    useEffect(() => {
        setBackHandler(() => {
            if (isConfirmOpen()) {
                dismissConfirm();
                return;
            }
            if (showQrModalRef.current) {
                setShowQrModal(false);
                return;
            }
            if (isEditingRef.current) {
                if (inputRef.current) inputRef.current.blur();
                return;
            }
            goBack();
        });
        return () => clearBackHandler();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        isEditingRef.current = showQrModal;
    }, [showQrModal]);

    const handleAdd = async () => {
        const nick = nuevoFav.trim();
        if (nick === '') {
            return;
        }
        try {
            const response = await fetchData('saveFavorito', { nickname: nick });
            if (response?.status) {
                setNuevoFav('');
                await loadFavoritos();
            }
        } catch {
            // el error lo muestra useLazyFetch
        }
    };

    const handleDelete = (fav) => {
        showConfirm({
            text: `Desea eliminar el favorito "${fav.nickname}"?`,
            okLabel: 'Eliminar',
            cancelLabel: 'Cancelar',
            color: '#d32f2f',
            okAction: async () => {
                try {
                    const response = await fetchData('deleteFavorito', { id: fav.id });
                    if (response?.status) {
                        await loadFavoritos();
                    }
                } catch {
                    // intentionally empty
                }
            },
        });
    };

    const handleScanQR = () => {
        if (isRunningInWebView() && typeof Android !== 'undefined' && typeof Android.scanQR === 'function') {
            Android.scanQR();
        }
    };

    useEffect(() => {
        window.onQRScanned = (scannedNickname) => {
            if (scannedNickname && scannedNickname.trim() !== '') {
                setNuevoFav(scannedNickname.trim());
            }
        };
        return () => { delete window.onQRScanned; };
    }, []);

    const containerStyles = {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#f8fafc',
        paddingBottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
    };

    const headerStyles = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
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

    const listContainerStyles = {
        flex: 1,
        overflowY: 'auto',
        padding: '5px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    };

    const cardStyles = {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        boxSizing: 'border-box',
        padding: '12px 14px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        borderLeft: `4px solid ${FAVORITOS_COLOR}`,
        backgroundColor: '#fff',
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
    };

    const iconContainerStyles = {
        width: '34px',
        height: '34px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(245, 124, 0, 0.1)',
        color: FAVORITOS_COLOR,
        flexShrink: 0,
    };

    const emptyContainerStyles = {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        color: '#94a3b8',
        textAlign: 'center',
        gap: '8px',
    };

    const emptyTextStyles = {
        fontSize: '14px',
        fontWeight: '500',
        color: '#64748b',
    };

    const emptySubtextStyles = {
        fontSize: '12px',
        color: '#94a3b8',
    };

    const addRowStyles = {
        padding: '8px 16px',
        backgroundColor: '#fff',
        borderTop: '1px solid #e2e8f0',
        flexShrink: 0,
        display: 'flex',
        gap: '8px',
        alignItems: 'flex-end',
    };

    const bottomButtonsStyles = {
        display: 'flex',
        gap: '8px',
        padding: '8px 16px calc(16px + env(safe-area-inset-bottom, 0px))',
        backgroundColor: '#fff',
        borderTop: '1px solid #e2e8f0',
        flexShrink: 0,
    };

    const qrOverlayStyles = {
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1500,
    };

    const qrContainerStyles = {
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        maxWidth: '280px',
        width: '100%',
    };

    const qrTitleStyles = {
        fontSize: '14px',
        fontWeight: '700',
        color: '#1e293b',
        textAlign: 'center',
    };

    const qrImageStyles = {
        width: '200px',
        height: '200px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
    };

    const qrNicknameStyles = {
        fontSize: '12px',
        fontWeight: '600',
        color: FAVORITOS_COLOR,
        backgroundColor: `${FAVORITOS_COLOR}15`,
        padding: '4px 10px',
        borderRadius: '6px',
    };

    return (
        <>
            <div style={containerStyles}>
                <div style={headerStyles}>
                    <h2 style={titleStyles}>Mis Favoritos</h2>
                </div>

                <div style={addRowStyles}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <CoreText
                            ref={inputRef}
                            label="Agregar favorito"
                            value={nuevoFav}
                            onChange={(e) => { setNuevoFav(e.target.value); }}
                            width="100%"
                            maxLength={30}
                            entryMode={ENTRY_MODE.LOWER}
                            ignoreFormState={true}
                            onEnter={handleAdd}
                        />
                    </div>
                        <CoreButtonSquare
                            icon={<IoAdd size={18} />}
                            color={FAVORITOS_COLOR}
                            onClick={handleAdd}
                            ignoreFormState={true}
                            style={{ width: '36px', height: '36px', flexShrink: 0 }}
                        />
                </div>

                <div style={listContainerStyles}>
                    {favoritos.length === 0 ? (
                        <div style={emptyContainerStyles}>
                            <IoStar size={48} color="#cbd5e1" />
                            <div style={emptyTextStyles}>No hay favoritos registrados</div>
                            <div style={emptySubtextStyles}>Agrega usuarios con el formulario o escaneando un QR</div>
                        </div>
                    ) : (
                        favoritos.map((fav) => (
                            <div key={fav.id} style={cardStyles}>
                                <div style={iconContainerStyles}>
                                    <IoStar size={16} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {fav.nickname}
                                    </div>
                                    {fav.nombre_completo ? (
                                        <div style={{ fontSize: '11px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {fav.nombre_completo}
                                        </div>
                                    ) : null}
                                </div>
                                <div
                                    onClick={() => handleDelete(fav)}
                                    style={{ width: '34px', height: '34px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(244, 67, 54, 0.1)', color: '#d32f2f', flexShrink: 0, cursor: 'pointer' }}
                                >
                                    <IoTrash size={16} />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div style={bottomButtonsStyles}>
                    <CoreButton
                        label="Leer QR"
                        icon={<IoCamera size={16} />}
                        color="#1976d2"
                        onClick={handleScanQR}
                        ignoreFormState={true}
                        style={{ flex: 1 }}
                    />
                    <CoreButton
                        label="Mostrar QR"
                        icon={<IoQrCode size={16} />}
                        color={FAVORITOS_COLOR}
                        onClick={() => setShowQrModal(true)}
                        ignoreFormState={true}
                        style={{ flex: 1 }}
                    />
                </div>

                <BackdropLoader />
                <ErrorModal />
            </div>

            <CoreConfirm />

            {showQrModal && (
                <div style={qrOverlayStyles} onClick={() => setShowQrModal(false)}>
                    <div style={qrContainerStyles} onClick={(e) => e.stopPropagation()}>
                        <div style={qrTitleStyles}>Mi código QR</div>
                        {nickname ? (
                            <>
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(nickname)}&size=200x200`}
                                    alt="QR Code"
                                    style={qrImageStyles}
                                />
                                <div style={qrNicknameStyles}>{nickname}</div>
                            </>
                        ) : (
                            <div style={{ fontSize: '13px', color: '#64748b', textAlign: 'center' }}>
                                No se pudo obtener tu nickname
                            </div>
                        )}
                        <CoreButtonSquare
                            icon={<IoArrowBack size={18} />}
                            color="#6b7280"
                            onClick={() => setShowQrModal(false)}
                            ignoreFormState={true}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default Favoritos;

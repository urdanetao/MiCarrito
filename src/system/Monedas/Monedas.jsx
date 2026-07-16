import { useState, useEffect, useRef } from 'react';
import { IoArrowBack, IoPencil, IoTrash, IoCashOutline, IoAdd, IoCheckmark } from 'react-icons/io5';
import { COLOR_MAP, ENTRY_MODE } from '../../util/constants';
import useLazyFetch from '../../hooks/useLazyFetch/useLazyFetch';
import { CoreText, CoreButtonSquare, CoreModal, CoreVSep } from '../../components';
import { showConfirm, isConfirmOpen, dismissConfirm } from '../../components/CoreConfirm/CoreConfirm';
import { setBackHandler, clearBackHandler } from '../../util/util';

const MONEDA_COLOR = '#f57c00';

const Monedas = ({ onBack }) => {
    const { fetchData, BackdropLoader, ErrorModal } = useLazyFetch();

    const [monedas, setMonedas] = useState([]);
    const [siglas, setSiglas] = useState('');
    const [nombre, setNombre] = useState('');
    const [simbolo, setSimbolo] = useState('');
    const [editId, setEditId] = useState(0);
    const [showModal, setShowModal] = useState(false);

    const siglasRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const response = await fetchData('getMonedas', {});
                if (!cancelled && response?.status && Array.isArray(response.data)) {
                    setMonedas(response.data);
                }
            } catch {
                // intentionally empty
            }
        })();
        return () => { cancelled = true; };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const refreshMonedas = async () => {
        try {
            const response = await fetchData('getMonedas', {});
            if (response?.status && Array.isArray(response.data)) {
                setMonedas(response.data);
            }
        } catch {
            // intentionally empty
        }
    };

    const handleOpenAdd = () => {
        setSiglas('');
        setNombre('');
        setSimbolo('');
        setEditId(0);
        setShowModal(true);
    };

    const handleOpenEdit = (mon) => {
        setSiglas(mon.siglas || '');
        setNombre(mon.nombre || '');
        setSimbolo(mon.simbolo || '');
        setEditId(mon.id);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSiglas('');
        setNombre('');
        setSimbolo('');
        setEditId(0);
    };

    useEffect(() => {
        if (showModal && siglasRef.current) {
            const timer = setTimeout(() => {
                siglasRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [showModal]);

    const handleSave = async () => {
        const trimmedSiglas = siglas.trim();
        const trimmedNombre = nombre.trim();
        const trimmedSimbolo = simbolo.trim();
        if (trimmedSiglas === '' || trimmedNombre === '' || trimmedSimbolo === '') {
            return;
        }

        try {
            const response = await fetchData('saveMoneda', {
                id: editId,
                siglas: trimmedSiglas,
                nombre: trimmedNombre,
                simbolo: trimmedSimbolo,
            });

            if (response?.status) {
                setShowModal(false);
                setSiglas('');
                setNombre('');
                setSimbolo('');
                setEditId(0);
                await refreshMonedas();
            }
        } catch {
            // intentionally empty
        }
    };

    const handleDelete = (mon) => {
        showConfirm({
            text: `Desea eliminar la moneda "${mon.nombre}"?`,
            okLabel: 'Eliminar',
            cancelLabel: 'Cancelar',
            color: COLOR_MAP.error,
            okAction: async () => {
                try {
                    const response = await fetchData('deleteMoneda', { id: mon.id });
                    if (response?.status) {
                        await refreshMonedas();
                    }
                } catch {
                    // intentionally empty
                }
            },
        });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSave();
        }
    };

    const isEditingRef = useRef(false);
    const handleCloseModalRef = useRef(handleCloseModal);

    useEffect(() => {
        isEditingRef.current = showModal;
        handleCloseModalRef.current = handleCloseModal;
    });

    useEffect(() => {
        setBackHandler(() => {
            if (isConfirmOpen()) {
                dismissConfirm();
                return;
            }
            if (isEditingRef.current) {
                handleCloseModalRef.current();
                return;
            }
            window.history.back();
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
        borderLeft: `4px solid ${MONEDA_COLOR}`,
        backgroundColor: '#fff',
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
        transition: 'all 0.2s ease',
        cursor: 'default',
    };

    const iconContainerStyles = {
        width: '34px',
        height: '34px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(245, 124, 0, 0.1)',
        color: MONEDA_COLOR,
        flexShrink: 0,
        fontSize: '16px',
    };

    const descriptionStyles = {
        flex: 1,
        fontSize: '13px',
        fontWeight: '600',
        color: '#1e293b',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        minWidth: 0,
    };

    const siglasBadgeStyles = {
        fontSize: '11px',
        fontWeight: '700',
        color: MONEDA_COLOR,
        backgroundColor: `${MONEDA_COLOR}15`,
        padding: '2px 6px',
        borderRadius: '4px',
        flexShrink: 0,
    };

    const simboloStyles = {
        fontSize: '13px',
        fontWeight: '600',
        color: '#1e293b',
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

    const emptyIconStyles = {
        fontSize: '48px',
        color: '#cbd5e1',
        marginBottom: '4px',
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

    return (
        <>
            <div style={containerStyles}>
                <div style={headerStyles}>
                    <h2 style={titleStyles}>Monedas</h2>
                    <CoreButtonSquare
                        icon={<IoAdd size={18} />}
                        color={MONEDA_COLOR}
                        onClick={handleOpenAdd}
                        ignoreFormState={true}
                    />
                </div>

                <div style={listContainerStyles}>
                    {monedas.length === 0 ? (
                        <div style={emptyContainerStyles}>
                            <div style={emptyIconStyles}>
                                <IoCashOutline size={48} />
                            </div>
                            <div style={emptyTextStyles}>No hay monedas registradas</div>
                            <div style={emptySubtextStyles}>Presiona + para agregar la primera</div>
                        </div>
                    ) : (
                        monedas.map((mon) => (
                            <div
                                key={mon.id}
                                style={cardStyles}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.04)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <div style={iconContainerStyles}>
                                    <IoCashOutline size={16} />
                                </div>
                                <div style={siglasBadgeStyles}>{mon.siglas}</div>
                                <div style={descriptionStyles} title={mon.nombre}>
                                    {mon.nombre}
                                </div>
                                <div style={simboloStyles}>{mon.simbolo}</div>
                                <CoreButtonSquare
                                    icon={<IoPencil size={14} />}
                                    color={COLOR_MAP.info}
                                    onClick={() => handleOpenEdit(mon)}
                                    ignoreFormState={true}
                                    style={{ width: '30px', height: '30px', fontSize: '14px' }}
                                />
                                <CoreButtonSquare
                                    icon={<IoTrash size={14} />}
                                    color={COLOR_MAP.error}
                                    onClick={() => handleDelete(mon)}
                                    ignoreFormState={true}
                                    style={{ width: '30px', height: '30px', fontSize: '14px' }}
                                />
                            </div>
                        ))
                    )}
                </div>

                <BackdropLoader />
                <ErrorModal />
            </div>

            <CoreModal
                open={showModal}
                onClose={handleCloseModal}
                closeOnOverlayClick={false}
                contentStyle={{ maxWidth: '400px', width: '100%' }}
            >
                {({ closeModal }) => {
                    const modalHeaderStyles = {
                        backgroundColor: MONEDA_COLOR,
                        color: '#fff',
                        fontSize: '16px',
                        fontWeight: '600',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    };

                    const modalCloseBtnStyles = {
                        background: 'none',
                        border: 'none',
                        color: '#fff',
                        fontSize: '20px',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background-color 0.18s',
                        outline: 'none',
                    };

                    const modalBodyStyles = {
                        padding: '20px',
                    };

                    const modalFooterStyles = {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '5px',
                        padding: '0 20px 20px',
                    };

                    return (
                        <div style={{ borderRadius: '12px', border: `1px solid ${MONEDA_COLOR}40`, boxShadow: '0 18px 48px rgba(15, 23, 42, 0.24)', backgroundColor: '#fefefe', overflow: 'hidden' }}>
                            <div style={modalHeaderStyles}>
                                <span>{editId > 0 ? 'Editar Moneda' : 'Nueva Moneda'}</span>
                                <button
                                    type="button"
                                    style={modalCloseBtnStyles}
                                    onClick={() => closeModal()}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                >
                                    &#x2715;
                                </button>
                            </div>

                            <div style={modalBodyStyles}>
                                <CoreText
                                    ref={siglasRef}
                                    label="Siglas"
                                    value={siglas}
                                    onChange={(e) => setSiglas(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    entryMode={ENTRY_MODE.UPPER}
                                    maxLength={3}
                                    width="100%"
                                    ignoreFormState={true}
                                />
                                <CoreVSep />
                                <CoreText
                                    label="Nombre"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    entryMode={ENTRY_MODE.UPPER}
                                    maxLength={20}
                                    width="100%"
                                    ignoreFormState={true}
                                />
                                <CoreVSep />
                                <CoreText
                                    label="Simbolo"
                                    value={simbolo}
                                    onChange={(e) => setSimbolo(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    entryMode={ENTRY_MODE.NORMAL}
                                    maxLength={3}
                                    width="100%"
                                    ignoreFormState={true}
                                />
                            </div>

                            <div style={modalFooterStyles}>
                                <CoreButtonSquare
                                    icon={<IoArrowBack size={18} />}
                                    color="#6b7280"
                                    onClick={() => closeModal()}
                                    ignoreFormState={true}
                                />
                                <CoreButtonSquare
                                    icon={<IoCheckmark size={18} />}
                                    color={MONEDA_COLOR}
                                    onClick={handleSave}
                                    ignoreFormState={true}
                                />
                            </div>
                        </div>
                    );
                }}
            </CoreModal>
        </>
    );
};

export default Monedas;

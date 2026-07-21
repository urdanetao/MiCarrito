import { useState, useEffect, useRef } from 'react';
import { IoArrowBack, IoPencil, IoTrash, IoPricetagOutline, IoAdd, IoCheckmark } from 'react-icons/io5';
import { COLOR_MAP, ENTRY_MODE } from '../../util/constants';
import useLazyFetch from '../../hooks/useLazyFetch/useLazyFetch';
import { CoreText, CoreButtonSquare, CoreModal } from '../../components';
import { showConfirm, isConfirmOpen, dismissConfirm } from '../../components/CoreConfirm/CoreConfirm';
import { setBackHandler, clearBackHandler } from '../../util/util';

const CATEGORY_COLOR = '#388e3c';

const Categorias = () => {
    const { fetchData, BackdropLoader, ErrorModal } = useLazyFetch();

    const [categorias, setCategorias] = useState([]);
    const [descripcion, setDescripcion] = useState('');
    const [editId, setEditId] = useState(0);
    const [showModal, setShowModal] = useState(false);

    const descRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const response = await fetchData('getCategorias', {});
                if (!cancelled && response?.status && Array.isArray(response.data)) {
                    const sorted = [...response.data].sort((a, b) =>
                        (a.descrip || '').localeCompare(b.descrip || '', 'es', { sensitivity: 'base' })
                    );
                    setCategorias(sorted);
                }
            } catch {
                // intentionally empty
            }
        })();
        return () => { cancelled = true; };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const refreshCategorias = async () => {
        try {
            const response = await fetchData('getCategorias', {});
            if (response?.status && Array.isArray(response.data)) {
                const sorted = [...response.data].sort((a, b) =>
                    (a.descrip || '').localeCompare(b.descrip || '', 'es', { sensitivity: 'base' })
                );
                setCategorias(sorted);
            }
        } catch {
            // intentionally empty
        }
    };

    const handleOpenAdd = () => {
        setDescripcion('');
        setEditId(0);
        setShowModal(true);
    };

    const handleOpenEdit = (cat) => {
        setDescripcion(cat.descrip || '');
        setEditId(cat.id);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setDescripcion('');
        setEditId(0);
    };

    useEffect(() => {
        if (showModal && descRef.current) {
            const timer = setTimeout(() => {
                descRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [showModal]);

    const handleSave = async () => {
        const trimmed = descripcion.trim();
        if (trimmed === '') {
            return;
        }

        try {
            const response = await fetchData('saveCategoria', {
                id: editId,
                descrip: trimmed,
            });

            if (response?.status) {
                setShowModal(false);
                setDescripcion('');
                setEditId(0);
                await refreshCategorias();
            }
        } catch {
            // intentionally empty
        }
    };

    const handleDelete = (cat) => {
        showConfirm({
            text: `¿Está seguro que desea eliminar la categoría "${cat.descrip}"?`,
            okLabel: 'Eliminar',
            cancelLabel: 'Cancelar',
            color: COLOR_MAP.error,
            okAction: async () => {
                try {
                    const response = await fetchData('deleteCategoria', { id: cat.id });
                    if (response?.status) {
                        await refreshCategorias();
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
    }, []);

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
        borderLeft: `4px solid ${CATEGORY_COLOR}`,
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
        backgroundColor: 'rgba(56, 142, 60, 0.1)',
        color: CATEGORY_COLOR,
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
                    <h2 style={titleStyles}>Categorías</h2>
                    <CoreButtonSquare
                        icon={<IoAdd size={18} />}
                        color={CATEGORY_COLOR}
                        onClick={handleOpenAdd}
                        ignoreFormState={true}
                    />
                </div>

                <div style={listContainerStyles}>
                    {categorias.length === 0 ? (
                        <div style={emptyContainerStyles}>
                            <div style={emptyIconStyles}>
                                <IoPricetagOutline size={48} />
                            </div>
                            <div style={emptyTextStyles}>No hay categorías registradas</div>
                            <div style={emptySubtextStyles}>Presiona + para agregar la primera</div>
                        </div>
                    ) : (
                        categorias.map((cat) => (
                            <div
                                key={cat.id}
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
                                    <IoPricetagOutline size={16} />
                                </div>
                                <div style={descriptionStyles} title={cat.descrip}>
                                    {cat.descrip}
                                </div>
                                <div
                                    style={{ width: '34px', height: '34px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(25, 118, 210, 0.1)', color: COLOR_MAP.info, flexShrink: 0, fontSize: '16px', cursor: 'pointer' }}
                                    onClick={() => handleOpenEdit(cat)}
                                >
                                    <IoPencil size={16} />
                                </div>
                                <div
                                    style={{ width: '34px', height: '34px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(244, 67, 54, 0.1)', color: COLOR_MAP.error, flexShrink: 0, fontSize: '16px', cursor: 'pointer' }}
                                    onClick={() => handleDelete(cat)}
                                >
                                    <IoTrash size={16} />
                                </div>
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
                        backgroundColor: CATEGORY_COLOR,
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
                        <div style={{ borderRadius: '12px', border: `1px solid ${CATEGORY_COLOR}40`, boxShadow: '0 18px 48px rgba(15, 23, 42, 0.24)', backgroundColor: '#fefefe', overflow: 'hidden' }}>
                            <div style={modalHeaderStyles}>
                                <span>{editId > 0 ? 'Editar Categoría' : 'Nueva Categoría'}</span>
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
                                    ref={descRef}
                                    label="Descripción"
                                    value={descripcion}
                                    onChange={(e) => setDescripcion(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    entryMode={ENTRY_MODE.UPPER}
                                    maxLength={30}
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
                                    color={CATEGORY_COLOR}
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

export default Categorias;

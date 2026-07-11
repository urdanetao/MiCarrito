
import { useState, useEffect, useRef } from 'react';
import { IoGridOutline, IoArrowBack, IoPencil, IoTrash, IoPricetagOutline } from 'react-icons/io5';
import { COLOR_MAP, FORMSTATE, ENTRY_MODE } from '../../util/constants';
import useLazyFetch from '../../hooks/useLazyFetch/useLazyFetch';
import { CoreWindow, CoreGroup, CoreText, CoreVSep, CoreButton, CoreCard } from '../../components';
import { showConfirm, isConfirmOpen, dismissConfirm } from '../../components/CoreConfirm/CoreConfirm';

const CATEGORY_COLOR = '#388e3c';

const Categorias = ({ onBack }) => {
    const { fetchData, BackdropLoader, ErrorModal } = useLazyFetch();

    const [categorias, setCategorias] = useState([]);
    const [descripcion, setDescripcion] = useState('');
    const [editId, setEditId] = useState(0);
    const [isEditing, setIsEditing] = useState(false);

    const descRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const response = await fetchData('get_categorias', {});
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
            const response = await fetchData('get_categorias', {});
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

    useEffect(() => {
        if (isEditing) {
            descRef.current?.focus();
        }
    }, [isEditing]);

    const handleSave = async () => {
        const trimmed = descripcion.trim();
        if (trimmed === '') {
            return;
        }

        try {
            const response = await fetchData('save_categoria', {
                id: editId,
                descrip: trimmed,
            });

            if (response?.status) {
                setDescripcion('');
                setEditId(0);
                setIsEditing(false);
                await refreshCategorias();
            }
        } catch {
            // intentionally empty
        }
    };

    const handleEdit = (cat) => {
        setDescripcion(cat.descrip || '');
        setEditId(cat.id);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setDescripcion('');
        setEditId(0);
        setIsEditing(false);
        descRef.current?.focus();
    };

    const isEditingRef = useRef(isEditing);
    const handleCancelRef = useRef(handleCancel);

    useEffect(() => {
        isEditingRef.current = isEditing;
        handleCancelRef.current = handleCancel;
    });

    useEffect(() => {
        window.history.pushState({ screen: 'categorias' }, '');

        const handlePopState = () => {
            if (isConfirmOpen()) {
                dismissConfirm();
                return;
            }
            if (isEditingRef.current) {
                handleCancelRef.current();
                return;
            }
            if (typeof onBack === 'function') {
                onBack();
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleDelete = (cat) => {
        showConfirm({
            text: `¿Está seguro que desea eliminar la categoría "${cat.descrip}"?`,
            okLabel: 'Eliminar',
            cancelLabel: 'Cancelar',
            color: COLOR_MAP.error,
            okAction: async () => {
                try {
                    const response = await fetchData('delete_categoria', { id: cat.id });
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

    const formState = isEditing ? FORMSTATE.EDITING : FORMSTATE.NOSHOW;

    const gridStyles = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '16px',
        padding: '16px',
    };

    const emptyStyles = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        color: '#94a3b8',
        fontSize: '14px',
        textAlign: 'center',
        gap: '8px',
    };

    const emptyIconStyles = {
        fontSize: '40px',
        color: '#cbd5e1',
        marginBottom: '4px',
    };

    return (
        <>
            <CoreWindow
                icon={<IoGridOutline />}
                title="Categorías"
                color={CATEGORY_COLOR}
                width="100%"
            >
                <CoreGroup label={isEditing ? 'Editar Categoría' : 'Nueva Categoría'}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                        <CoreText
                            ref={descRef}
                            label="Descripción"
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            onKeyDown={handleKeyDown}
                            entryMode={ENTRY_MODE.UPPER}
                            maxLength={30}
                            width="300px"
                            formState={formState}
                            ignoreFormState={!isEditing}
                        />
                        <div style={{ display: 'flex', gap: '8px', paddingTop: '16px' }}>
                            {!isEditing ? (
                                <CoreButton
                                    label="Guardar"
                                    color={COLOR_MAP.success}
                                    onClick={handleSave}
                                    ignoreFormState={true}
                                />
                            ) : (
                                <>
                                    <CoreButton
                                        label="Modificar"
                                        color={COLOR_MAP.info}
                                        onClick={handleSave}
                                        ignoreFormState={true}
                                    />
                                    <CoreButton
                                        label="Cancelar"
                                        color="#6b7280"
                                        onClick={handleCancel}
                                        ignoreFormState={true}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </CoreGroup>

                <CoreVSep />

                <CoreGroup label="Categorías Registradas">
                    {categorias.length === 0 ? (
                        <div style={emptyStyles}>
                            <div style={emptyIconStyles}>📋</div>
                            <div>No hay categorías registradas</div>
                        </div>
                    ) : (
                        <div style={gridStyles}>
                            {categorias.map((cat) => (
                                <CoreCard
                                    key={cat.id}
                                    icon={<IoPricetagOutline />}
                                    title={cat.descrip}
                                    color={CATEGORY_COLOR}
                                    actions={[
                                        {
                                            icon: <IoPencil size={14} />,
                                            label: 'Editar',
                                            color: COLOR_MAP.info,
                                            onClick: () => handleEdit(cat),
                                        },
                                        {
                                            icon: <IoTrash size={14} />,
                                            label: 'Eliminar',
                                            color: COLOR_MAP.error,
                                            onClick: () => handleDelete(cat),
                                        },
                                    ]}
                                />
                            ))}
                        </div>
                    )}
                </CoreGroup>

                <CoreVSep size={16} />

                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <CoreButton
                        label="Volver"
                        icon={<IoArrowBack />}
                        color="#6b7280"
                        onClick={onBack}
                        ignoreFormState={true}
                    />
                </div>
            </CoreWindow>

            <BackdropLoader />
            <ErrorModal />
        </>
    );
};

export default Categorias;

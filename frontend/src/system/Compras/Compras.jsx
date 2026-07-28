import { useState, useEffect, useRef, useCallback } from 'react';
import {
    IoPencil, IoTrash, IoCartOutline, IoAdd,
    IoEllipsisVertical, IoCopy, IoChevronDown, IoChevronForward,
    IoCheckmarkCircle, IoTimeOutline, IoFilter, IoShareOutline,
    IoLockClosed,
} from 'react-icons/io5';
import { COLOR_MAP, ENTRY_MODE } from '../../util/constants';
import useLazyFetch from '../../hooks/useLazyFetch/useLazyFetch';
import { CoreButtonSquare, CoreMenuPopup, CoreText } from '../../components';
import { showConfirm, isConfirmOpen, dismissConfirm } from '../../components/CoreConfirm/CoreConfirm';
import { setBackHandler, clearBackHandler, normalizeBool } from '../../util/util';
import ModalCompra from './ModalCompra';
import ModalProducto from './ModalProducto';
import ModalDuplicar from './ModalDuplicar';
import ModalCopiar from './ModalCopiar';
import ModalCompartir from './ModalCompartir';
import ModalCompraRecibida from './ModalCompraRecibida';

const COMPRA_COLOR = '#7b1fa2';
const PRODUCTO_COLOR = '#1976d2';

const Compras = ({ goBack }) => {
    const { fetchData, BackdropLoader, ErrorModal } = useLazyFetch();

    const [compras, setCompras] = useState([]);
    const [filtro, setFiltro] = useState('todas');

    const [selectedCompra, setSelectedCompra] = useState(null);
    const [categoriasCompra, setCategoriasCompra] = useState([]);
    const [expandedCategorias, setExpandedCategorias] = useState(() => new Set());
    const [productosPorCategoria, setProductosPorCategoria] = useState({});

    const [showModalCompra, setShowModalCompra] = useState(false);
    const [compraEditId, setCompraEditId] = useState(0);
    const [compraDescripcion, setCompraDescripcion] = useState('');
    const [compraFecha, setCompraFecha] = useState('');
    const [compraMonedaId, setCompraMonedaId] = useState('');
    const [monedas, setMonedas] = useState([]);

    const [allCategorias, setAllCategorias] = useState([]);
    const [isAddingNew, setIsAddingNew] = useState(false);

    const [menuCompraId, setMenuCompraId] = useState(null);
    const [menuCategoriaData, setMenuCategoriaData] = useState(null);
    const [menuFiltroVisible, setMenuFiltroVisible] = useState(false);

    const [showModalProducto, setShowModalProducto] = useState(false);
    const [productoEditId, setProductoEditId] = useState(0);
    const [productoNombre, setProductoNombre] = useState('');
    const [productoCantidad, setProductoCantidad] = useState('');
    const [productoPrecio, setProductoPrecio] = useState('');
    const [productoCategoriaId, setProductoCategoriaId] = useState(0);
    const [productoComprado, setProductoComprado] = useState('0');
    const [productoPrioridad, setProductoPrioridad] = useState('0');

    const [showModalDuplicar, setShowModalDuplicar] = useState(false);
    const [duplicarFecha, setDuplicarFecha] = useState('');
    const [duplicarDescripcion, setDuplicarDescripcion] = useState('');
    const [compraOrigenDuplicar, setCompraOrigenDuplicar] = useState(0);

    const [showModalCopiar, setShowModalCopiar] = useState(false);
    const [comprasCopiar, setComprasCopiar] = useState([]);
    const [copiarData, setCopiarData] = useState(null);

    const [busqueda, setBusqueda] = useState('');
    const [filtroDetalle, setFiltroDetalle] = useState('pendientes');

    const [showModalCompartir, setShowModalCompartir] = useState(false);
    const [compraACompartir, setCompraACompartir] = useState(null);

    const [showModalCompraRecibida, setShowModalCompraRecibida] = useState(false);
    const [compraRecibida, setCompraRecibida] = useState(null);

    const refreshCompras = useCallback(async () => {
        try {
            const response = await fetchData('getCompras', { filtro });
            if (response?.status && Array.isArray(response.data)) {
                setCompras(response.data);
            }
        } catch {
            // intentionally empty
        }
    }, [filtro, fetchData]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [comprasResp, monedasResp] = await Promise.all([
                    fetchData('getCompras', { filtro }),
                    fetchData('getMonedas', {}),
                ]);
                if (!cancelled) {
                    if (comprasResp?.status && Array.isArray(comprasResp.data)) {
                        setCompras(comprasResp.data);
                    }
                    if (monedasResp?.status && Array.isArray(monedasResp.data)) {
                        setMonedas(monedasResp.data);
                    }
                }
            } catch {
                // intentionally empty
            }
        })();
        return () => { cancelled = true; };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        refreshCompras();
    }, [filtro, refreshCompras]);
    /* eslint-enable react-hooks/set-state-in-effect */

    useEffect(() => {
        if (selectedCompra) {
            const updated = compras.find((c) => c.id === selectedCompra.id);
            if (updated && (
                normalizeBool(updated.estado) !== normalizeBool(selectedCompra.estado) ||
                updated.total !== selectedCompra.total ||
                updated.simbolo !== selectedCompra.simbolo
            )) {
                setSelectedCompra((prev) => ({ ...prev, estado: updated.estado, total: updated.total, simbolo: updated.simbolo })); // eslint-disable-line react-hooks/set-state-in-effect
            }
        }
    }, [compras]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const handler = (e) => {
            if (e.detail?.type === 'compra_recibida' || e.detail?.type === 'comparticion_respondida') {
                refreshCompras();
            }
        };
        window.addEventListener('fcmdata', handler);
        return () => window.removeEventListener('fcmdata', handler);
    }, [refreshCompras]);

    const handleOpenCompartir = (compra) => {
        setCompraACompartir(compra);
        setMenuCompraId(null);
        setShowModalCompartir(true);
    };


    const getMonedaSimbolo = (idmon) => {
        if (!idmon) return '$';
        const mon = monedas.find((m) => m.id === Number(idmon));
        return mon ? mon.simbolo : '$';
    };

    const formatTotal = (total, simbolo) => {
        return `${simbolo}${parseFloat(total || 0).toFixed(2)}`;
    };

    const handleOpenAddCompra = () => {
        setCompraEditId(0);
        setCompraDescripcion('');
        setCompraFecha(new Date().toISOString().slice(0, 10));
        setCompraMonedaId('');
        setShowModalCompra(true);
    };

    const handleOpenEditCompra = (compra) => {
        setCompraEditId(compra.id);
        setCompraDescripcion(compra.descrip || '');
        setCompraFecha(compra.fecha || '');
        setCompraMonedaId(compra.idmon ? String(compra.idmon) : '');
        setMenuCompraId(null);
        setShowModalCompra(true);
    };

    const handleCloseModalCompra = () => {
        setShowModalCompra(false);
        setCompraEditId(0);
        setCompraDescripcion('');
        setCompraFecha('');
        setCompraMonedaId('');
    };

    const handleSaveCompra = async () => {
        const trimmed = compraDescripcion.trim();
        if (trimmed === '' || compraFecha === '' || !compraMonedaId) return;

        try {
            const response = await fetchData('saveCompra', {
                id: compraEditId,
                descrip: trimmed,
                fecha: compraFecha,
                idmon: compraMonedaId ? parseInt(compraMonedaId, 10) : 0,
            });
            if (response?.status) {
                setShowModalCompra(false);
                setCompraEditId(0);
                setCompraDescripcion('');
                setCompraFecha('');
                setCompraMonedaId('');
                await refreshCompras();
            }
        } catch {
            // intentionally empty
        }
    };

    const handleDeleteCompra = (compra) => {
        setMenuCompraId(null);
        showConfirm({
            text: `Desea eliminar la compra "${compra.descrip}"? Se eliminaran todos sus productos.`,
            okLabel: 'Eliminar',
            cancelLabel: 'Cancelar',
            color: COLOR_MAP.error,
            okAction: async () => {
                try {
                    const response = await fetchData('deleteCompra', { id: compra.id });
                    if (response?.status) {
                        if (selectedCompra?.id === compra.id) {
                            setSelectedCompra(null);
                            setCategoriasCompra([]);
                            setExpandedCategorias(new Set());
                            setProductosPorCategoria({});
                        }
                        await refreshCompras();
                    }
                } catch {
                    // intentionally empty
                }
            },
        });
    };

    const handleChangeEstadoCompra = async (compra) => {
        setMenuCompraId(null);
        try {
            const response = await fetchData('changeEstadoCompra', { id: compra.id });
            if (response?.status) {
                await refreshCompras();
            }
        } catch {
            // intentionally empty
        }
    };

    const handleOpenDuplicar = (compra) => {
        setMenuCompraId(null);
        setCompraOrigenDuplicar(compra.id);
        setDuplicarFecha(new Date().toISOString().slice(0, 10));
        setDuplicarDescripcion('');
        setShowModalDuplicar(true);
    };

    const handleDuplicar = async () => {
        if (duplicarFecha === '') return;
        try {
            const response = await fetchData('duplicateCompra', {
                origen_id: compraOrigenDuplicar,
                fecha: duplicarFecha,
                descrip: duplicarDescripcion.trim(),
            });
            if (response?.status) {
                setShowModalDuplicar(false);
                setCompraOrigenDuplicar(0);
                setDuplicarFecha('');
                setDuplicarDescripcion('');
                await refreshCompras();
            }
        } catch {
            // intentionally empty
        }
    };

    const handleOpenDetail = async (compra) => {
        setSelectedCompra(compra);
        setExpandedCategorias(new Set());
        setProductosPorCategoria({});
        try {
            const [catsResp, allCatsResp, configResp] = await Promise.all([
                fetchData('getCategoriasCompra', { idcom: compra.id }),
                fetchData('getCategorias', {}),
                fetchData('getConfig', {}),
            ]);
            if (catsResp?.status && Array.isArray(catsResp.data)) {
                setCategoriasCompra(catsResp.data);
            }
            if (allCatsResp?.status && Array.isArray(allCatsResp.data)) {
                setAllCategorias(allCatsResp.data);
            }
            const contraer = configResp?.status ? normalizeBool(configResp.data?.contraercategorias) : false;
            if (!contraer && catsResp?.status && Array.isArray(catsResp.data) && catsResp.data.length > 0) {
                const ids = catsResp.data.map((c) => Number(c.id));
                setExpandedCategorias(new Set(ids));
                await Promise.all(ids.map((id) => loadProductosCategoria(compra.id, id)));
            }
        } catch {
            // intentionally empty
        }
    };

    const handleBackFromDetail = () => {
        setSelectedCompra(null);
        setCategoriasCompra([]);
        setExpandedCategorias(new Set());
        setProductosPorCategoria({});
    };

    const loadProductosCategoria = async (compraId, catId) => {
        try {
            const response = await fetchData('getProductosCategoria', { idcom: compraId, idcat: catId });
            if (response?.status && Array.isArray(response.data)) {
                setProductosPorCategoria((prev) => ({ ...prev, [Number(catId)]: response.data }));
            }
        } catch {
            // intentionally empty
        }
    };

    useEffect(() => {
        const term = busqueda.trim();
        if (selectedCompra && term !== '' && categoriasCompra.length > 0) {
            categoriasCompra.forEach((cat) => {
                if (!productosPorCategoria[Number(cat.id)]) {
                    loadProductosCategoria(selectedCompra.id, Number(cat.id));
                }
            });
        }
    }, [busqueda, selectedCompra, categoriasCompra]); // eslint-disable-line react-hooks/exhaustive-deps

    const toggleExpandCategoria = async (compraId, categoriaId) => {
        const catIdNum = Number(categoriaId);
        const wasExpanded = expandedCategorias.has(catIdNum);
        setExpandedCategorias((prev) => {
            const next = new Set(prev);
            if (wasExpanded) {
                next.delete(catIdNum);
            } else {
                next.add(catIdNum);
            }
            return next;
        });
        if (!wasExpanded) {
            await loadProductosCategoria(compraId, catIdNum);
        }
    };

    const handleOpenAddProducto = (compraId, categoriaId) => {
        setProductoEditId(0);
        setProductoNombre('');
        setProductoCantidad('');
        setProductoPrecio('0.00');
        setProductoCategoriaId(categoriaId);
        setProductoComprado('0');
        setProductoPrioridad('0');
        setIsAddingNew(true);
        setShowModalProducto(true);
    };

    const handleOpenAddProductoFromFloating = () => {
        setProductoEditId(0);
        setProductoNombre('');
        setProductoCantidad('');
        setProductoPrecio('0.00');
        setProductoCategoriaId('');
        setProductoComprado('0');
        setProductoPrioridad('0');
        setIsAddingNew(true);
        setShowModalProducto(true);
    };

    const handleOpenEditProducto = (prod) => {
        setProductoEditId(prod.id);
        setProductoNombre(prod.nombre || '');
        setProductoCantidad(String(prod.cantidad ?? ''));
        setProductoPrecio(String(prod.precio ?? '0.00'));
        setProductoCategoriaId(prod.idcat);
        setProductoComprado(normalizeBool(prod.comprado) ? '1' : '0');
        setProductoPrioridad(normalizeBool(prod.prioridad) ? '1' : '0');
        setIsAddingNew(false);
        setShowModalProducto(true);
    };

    const handleCloseModalProducto = () => {
        setShowModalProducto(false);
        setIsAddingNew(false);
        setProductoEditId(0);
        setProductoNombre('');
        setProductoCantidad('');
        setProductoPrecio('0.00');
        setProductoCategoriaId(0);
        setProductoComprado('0');
        setProductoPrioridad('0');
    };

    const refreshAfterProductoSave = async (catId) => {
        const catIdNum = Number(catId);
        const compraActual = selectedCompraRef.current;
        if (!compraActual) return;

        setExpandedCategorias((prev) => {
            const next = new Set(prev);
            next.add(catIdNum);
            return next;
        });

        await loadProductosCategoria(compraActual.id, catIdNum);
        const catsResp = await fetchData('getCategoriasCompra', { idcom: compraActual.id });
        if (catsResp?.status && Array.isArray(catsResp.data)) {
            setCategoriasCompra(catsResp.data);
        }
        const comprasResp = await fetchData('getCompras', { filtro });
        if (comprasResp?.status && Array.isArray(comprasResp.data)) {
            const updated = comprasResp.data.find((c) => c.id === compraActual.id);
            if (updated) {
                setSelectedCompra((prev) => ({ ...prev, estado: updated.estado, total: updated.total, simbolo: updated.simbolo }));
            }
        }
    };

    const handleSaveProducto = async (closeModal) => {
        const trimmed = productoNombre.trim();
        if (trimmed === '' || !productoCategoriaId) return;

        try {
            const response = await fetchData('saveProducto', {
                id: productoEditId,
                idcom: selectedCompra.id,
                idcat: parseInt(productoCategoriaId, 10),
                nombre: trimmed,
                cantidad: parseInt(productoCantidad, 10) || 0,
                precio: parseFloat(productoPrecio) || 0,
                comprado: parseInt(productoComprado, 10) || 0,
                prioridad: parseInt(productoPrioridad, 10) || 0,
            });
            if (response?.status) {
                if (isAddingNew) {
                    const savedCatId = productoCategoriaId;
                    setProductoNombre('');
                    setProductoCantidad('');
                    setProductoPrecio('0.00');
                    setProductoComprado('0');
                    await refreshAfterProductoSave(savedCatId);
                } else {
                    setIsAddingNew(false);
                    setProductoEditId(0);
                    setProductoNombre('');
                    setProductoCantidad('');
                    setProductoPrecio('0.00');
                    setProductoCategoriaId(0);
                    setProductoComprado('0');
                    await refreshAfterProductoSave(productoCategoriaId);
                    if (typeof closeModal === 'function') {
                        closeModal();
                    }
                }
            }
        } catch {
            // intentionally empty
        }
    };

    const handleDeleteProducto = (prod) => {
        showConfirm({
            text: `Desea eliminar el producto "${prod.nombre}"?`,
            okLabel: 'Eliminar',
            cancelLabel: 'Cancelar',
            color: COLOR_MAP.error,
            okAction: async () => {
                try {
                    const response = await fetchData('deleteProducto', { id: prod.id });
                    if (response?.status) {
                        const resp = await fetchData('getProductosCategoria', { idcom: selectedCompra.id, idcat: prod.idcat });
                        if (resp?.status && Array.isArray(resp.data)) {
                            setProductosPorCategoria((prev) => ({ ...prev, [Number(prod.idcat)]: resp.data }));
                        }
                        await refreshCompras();
                    }
                } catch {
                    // intentionally empty
                }
            },
        });
    };

    const handleOpenCopiarCategoria = async (compraId, categoriaId) => {
        setMenuCategoriaData(null);
        setCopiarData({ compraOrigenId: compraId, categoriaId });
        try {
            const response = await fetchData('getCompras', { filtro: 'todas' });
            if (response?.status && Array.isArray(response.data)) {
                setComprasCopiar(response.data.filter((c) => c.id !== compraId));
                setShowModalCopiar(true);
            }
        } catch {
            // intentionally empty
        }
    };

    const handleCopiarCategoria = async (destinoId) => {
        if (!copiarData) return;
        try {
            const response = await fetchData('copiarCategoria', {
                compra_origen_id: copiarData.compraOrigenId,
                compra_destino_id: destinoId,
                idcat: copiarData.categoriaId,
            });
            if (response?.status) {
                setShowModalCopiar(false);
                setCopiarData(null);
            }
        } catch {
            // intentionally empty
        }
    };

    const handleDeleteCategoriaDeCompra = (compraId, cat) => {
        setMenuCategoriaData(null);
        showConfirm({
            text: `Desea eliminar la categoria "${cat.descrip}" y todos sus productos de esta compra? No se eliminara la categoria maestra.`,
            okLabel: 'Eliminar',
            cancelLabel: 'Cancelar',
            color: COLOR_MAP.error,
            okAction: async () => {
                try {
                    const prods = await fetchData('getProductosCategoria', { idcom: compraId, idcat: cat.id });
                    if (prods?.status && Array.isArray(prods.data)) {
                        for (const prod of prods.data) {
                            await fetchData('deleteProducto', { id: prod.id });
                        }
                    }
                    const resp = await fetchData('getCategoriasCompra', { idcom: compraId });
                    if (resp?.status && Array.isArray(resp.data)) {
                        setCategoriasCompra(resp.data);
                    }
                    if (expandedCategorias.has(Number(cat.id))) {
                        setExpandedCategorias((prev) => {
                            const next = new Set(prev);
                            next.delete(Number(cat.id));
                            return next;
                        });
                        setProductosPorCategoria((prev) => {
                            const next = { ...prev };
                            delete next[Number(cat.id)];
                            return next;
                        });
                    }
                    await refreshCompras();
                } catch {
                    // intentionally empty
                }
            },
        });
    };

    const handleKeyDownCompra = (e) => {
        if (e.key === 'Enter') handleSaveCompra();
    };

    const isEditingRef = useRef(false);
    const selectedCompraRef = useRef(null);
    const expandedCategoriasRef = useRef(expandedCategorias);
    const handleCloseModalCompraRef = useRef(handleCloseModalCompra);

    useEffect(() => {
        isEditingRef.current = showModalCompra || showModalProducto || showModalDuplicar || showModalCopiar;
        selectedCompraRef.current = selectedCompra;
        expandedCategoriasRef.current = expandedCategorias;
        handleCloseModalCompraRef.current = () => {
            if (showModalCompra) handleCloseModalCompra();
            else if (showModalProducto) handleCloseModalProducto();
            else if (showModalDuplicar) { setShowModalDuplicar(false); setCompraOrigenDuplicar(0); }
            else if (showModalCopiar) { setShowModalCopiar(false); setCopiarData(null); }
        };
    });

    useEffect(() => {
        setBackHandler(() => {
            if (isConfirmOpen()) {
                dismissConfirm();
                return;
            }
            if (isEditingRef.current) {
                handleCloseModalCompraRef.current();
                return;
            }
            if (expandedCategoriasRef.current && expandedCategoriasRef.current.size > 0) {
                setExpandedCategorias(new Set());
                setProductosPorCategoria({});
                return;
            }
            if (selectedCompraRef.current) {
                handleBackFromDetail();
                return;
            }
            goBack();
        });

        return () => {
            clearBackHandler();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const calcSubtotalCategoria = (catId) => {
        const prods = productosPorCategoria[Number(catId)] || [];
        return prods.reduce((sum, p) => normalizeBool(p.comprado) ? sum + (parseFloat(p.precio) || 0) * (parseInt(p.cantidad, 10) || 0) : sum, 0);
    };

    const filtroLabels = { todas: 'Todas', pendientes: 'Pendientes', completadas: 'Completadas' };
    const filtroKeys = ['todas', 'pendientes', 'completadas'];

    const containerStyles = {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#f8fafc',
        position: 'relative',
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
        gap: '8px',
    };

    const titleStyles = {
        fontSize: '15px',
        fontWeight: '700',
        color: '#1e293b',
        margin: 0,
    };

    const headerActionsStyles = {
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
    };

    const filtroBtnStyles = {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        borderRadius: '6px',
        border: '1px solid #e2e8f0',
        backgroundColor: '#fff',
        fontSize: '11px',
        fontWeight: '500',
        color: '#64748b',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        outline: 'none',
    };

    const listContainerStyles = {
        flex: 1,
        overflowY: 'auto',
        padding: '5px',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
    };

    const cardStyles = {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        boxSizing: 'border-box',
        padding: '12px 14px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        borderLeft: `4px solid ${COMPRA_COLOR}`,
        backgroundColor: '#fff',
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
    };

    const iconContainerStyles = {
        width: '34px',
        height: '34px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: `${COMPRA_COLOR}15`,
        color: COMPRA_COLOR,
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

    const dateStyles = {
        fontSize: '11px',
        color: '#94a3b8',
        flexShrink: 0,
    };

    const statusBadgeStyles = (estado) => {
        const completa = normalizeBool(estado);
        return {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: '600',
            color: completa ? '#16a34a' : '#f59e0b',
            backgroundColor: completa ? '#dcfce7' : '#fef3c7',
            flexShrink: 0,
        };
    };

    const totalStyles = {
        fontSize: '12px',
        fontWeight: '700',
        color: COMPRA_COLOR,
        flexShrink: 0,
    };

    const catCardStyles = {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        boxSizing: 'border-box',
        padding: '10px 14px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        borderLeft: `3px solid #388e3c`,
        backgroundColor: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
    };

    const expandIconStyles = {
        flexShrink: 0,
        color: '#94a3b8',
        fontSize: '14px',
        transition: 'transform 0.2s ease',
    };

    const prodRowStyles = (comprado, prioridad) => {
        const altaPrioridad = normalizeBool(prioridad);
        return {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '6px',
            backgroundColor: comprado ? '#f0fdf4' : altaPrioridad ? '#f0fdf4' : '#fff',
            border: `1px solid ${comprado ? '#bbf7d0' : altaPrioridad ? '#86efac' : '#e2e8f0'}`,
            borderLeft: altaPrioridad ? '3px solid #16a34a' : comprado ? '3px solid #bbf7d0' : '1px solid #e2e8f0',
            boxShadow: altaPrioridad ? '0 2px 8px rgba(22, 163, 74, 0.15)' : 'none',
            opacity: comprado ? 0.7 : 1,
            transition: 'all 0.2s ease',
        };
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

    const totalBarStyles = {
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: '6px 12px',
        fontSize: '13px',
        fontWeight: '700',
        color: COMPRA_COLOR,
        backgroundColor: '#faf5ff',
        borderRadius: '6px',
        border: '1px solid #e9d5ff',
    };

    const detailHeaderStyles = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        backgroundColor: '#fff',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        flexShrink: 0,
        gap: '8px',
    };

    const detailTitleStyles = {
        fontSize: '13px',
        fontWeight: '700',
        color: '#1e293b',
        margin: 0,
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        minWidth: 0,
    };

    const detailTotalStyles = {
        fontSize: '13px',
        fontWeight: '700',
        color: COMPRA_COLOR,
        flexShrink: 0,
    };

    const searchBarStyles = {
        display: 'flex',
        alignItems: 'flex-end',
        padding: '6px 16px',
        backgroundColor: '#fff',
        borderBottom: '1px solid #e2e8f0',
        flexShrink: 0,
        gap: '10px',
    };

    if (selectedCompra) {
        const simbolo = getMonedaSimbolo(selectedCompra.idmon);

        const normalizeText = (s) => (s == null ? '' : String(s)).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        const term = normalizeText(busqueda);

        const applyProductoFilter = (prods) => {
            if (filtroDetalle === 'comprados') return prods.filter((p) => normalizeBool(p.comprado));
            if (filtroDetalle === 'pendientes') return prods.filter((p) => !normalizeBool(p.comprado));
            return prods;
        };

        const categoriasFiltradas = term === ''
            ? categoriasCompra
                .map((cat) => {
                    const allProds = productosPorCategoria[Number(cat.id)] || [];
                    const prods = applyProductoFilter(allProds);
                    return prods.length > 0 ? { cat, prods } : null;
                })
                .filter(Boolean)
            : categoriasCompra
                .map((cat) => {
                    const allProds = productosPorCategoria[Number(cat.id)] || [];
                    const prodsFiltrados = applyProductoFilter(allProds).filter((p) => normalizeText(p.nombre).includes(term));
                    const coincideCat = normalizeText(cat.descrip).includes(term);
                    if (!coincideCat && prodsFiltrados.length === 0) return null;
                    return { cat, prods: coincideCat ? applyProductoFilter(allProds) : prodsFiltrados };
                })
                .filter(Boolean);

        return (
            <>
                <div style={containerStyles}>
                    <div style={detailHeaderStyles}>
                        <div style={iconContainerStyles}>
                            <IoCartOutline size={16} />
                        </div>
                        <h2 style={detailTitleStyles}>{selectedCompra.descrip}</h2>
                        <span style={detailTotalStyles}>{formatTotal(selectedCompra.total, simbolo)}</span>
                    </div>

                    <div style={searchBarStyles}>
                        <CoreText
                            label="Buscar"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            entryMode={ENTRY_MODE.UPPER}
                            width="100%"
                            wrapperStyle={{ flex: '1 1 auto', minWidth: 0 }}
                            ignoreFormState={true}
                        />
                        <div
                            style={{ width: '34px', height: '34px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${PRODUCTO_COLOR}19`, color: PRODUCTO_COLOR, flexShrink: 0, fontSize: '16px', cursor: 'pointer' }}
                            onClick={() => setMenuFiltroVisible(true)}
                        >
                            <IoFilter size={16} />
                        </div>
                    </div>

                    <div style={listContainerStyles}>
                        {categoriasFiltradas.length === 0 ? (
                            <div style={emptyContainerStyles}>
                                <div style={emptyIconStyles}>
                                    <IoCartOutline size={48} />
                                </div>
                                <div style={emptyTextStyles}>{term !== '' ? 'No se encontraron resultados' : 'No hay categorias en esta compra'}</div>
                                <div style={emptySubtextStyles}>{term !== '' ? 'Prueba con otra palabra' : 'Agrega productos desde las categorias'}</div>
                            </div>
                        ) : (
                            categoriasFiltradas.map(({ cat, prods }) => (
                                <div key={cat.id}>
                                    <div
                                        style={catCardStyles}
                                        onClick={() => toggleExpandCategoria(selectedCompra.id, cat.id)}
                                        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.06)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)'; }}
                                    >
                                        <div style={expandIconStyles}>
                                            {expandedCategorias.has(Number(cat.id)) ? <IoChevronDown size={12} /> : <IoChevronForward size={12} />}
                                        </div>
                                        <div style={{ flex: 1, fontSize: '12px', fontWeight: '600', color: '#1e293b' }}>
                                            {cat.descrip}
                                        </div>
                                        <div style={{ flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                                            <CoreButtonSquare
                                                icon={<IoEllipsisVertical size={12} />}
                                                color="#6b7280"
                                                onClick={() => setMenuCategoriaData(menuCategoriaData?.catId === cat.id ? null : { compraId: selectedCompra.id, catId: cat.id, cat })}
                                                ignoreFormState={true}
                                                style={{ width: '24px', height: '24px' }}
                                            />
                                        </div>
                                    </div>

                                            <div
                                                style={{
                                                    display: 'grid',
                                                    gridTemplateRows: (expandedCategorias.has(Number(cat.id)) || term !== '') ? '1fr' : '0fr',
                                                    opacity: (expandedCategorias.has(Number(cat.id)) || term !== '') ? 1 : 0,
                                                    transition: 'grid-template-rows 0.32s ease, opacity 0.25s ease',
                                                }}
                                            >
                                                <div style={{ overflow: 'hidden', minHeight: 0 }}>
                                                <div style={{ paddingLeft: '12px', paddingTop: '5px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {prods.map((prod) => (
                                                    <div
                                                        key={prod.id}
                                                        style={prodRowStyles(normalizeBool(prod.comprado), prod.prioridad)}
                                                        onClick={() => handleOpenEditProducto(prod)}
                                                    >
                                                        <div style={{ flexShrink: 0, color: normalizeBool(prod.comprado) ? '#16a34a' : '#facc15', fontSize: '16px' }}>
                                                            {normalizeBool(prod.comprado) ? <IoCheckmarkCircle /> : <IoTimeOutline />}
                                                        </div>
                                                        <div style={{ flex: 1, fontSize: '12px', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {prod.nombre}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: '#64748b', flexShrink: 0 }}>
                                                            x{prod.cantidad}
                                                        </div>
                                                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b', flexShrink: 0 }}>
                                                            ${parseFloat(prod.precio).toFixed(2)}
                                                        </div>
                                                        <div style={{ flexShrink: 0, display: 'flex', gap: '2px' }} onClick={(e) => e.stopPropagation()}>
                                                            <div
                                                                style={{ width: '22px', height: '22px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(244, 67, 54, 0.1)', color: COLOR_MAP.error, flexShrink: 0, fontSize: '12px', cursor: 'pointer' }}
                                                                onClick={() => handleDeleteProducto(prod)}
                                                            >
                                                                <IoTrash size={12} />
                                                            </div>
                                                        </div>
                                                    </div>
                                            ))}

                                    {expandedCategorias.has(Number(cat.id)) && term === '' && (
                                                <div style={totalBarStyles}>
                                                    Subtotal: ${calcSubtotalCategoria(cat.id).toFixed(2)}
                                                </div>
                                            )}

                                            {term === '' && (
                                            <div style={{ paddingTop: '2px' }}>
                                                <CoreButtonSquare
                                                    icon={<IoAdd size={14} />}
                                                    color={PRODUCTO_COLOR}
                                                    onClick={() => handleOpenAddProducto(selectedCompra.id, cat.id)}
                                                    ignoreFormState={true}
                                                    style={{ width: '26px', height: '26px' }}
                                                />
                                            </div>
                                            )}
                                                </div>
                                                </div>
                                            </div>
                                </div>
                            ))
                        )}
                        <div style={{ height: '70px', flexShrink: 0 }} />
                    </div>

                    <button
                        type="button"
                        onClick={handleOpenAddProductoFromFloating}
                        style={{
                            position: 'absolute',
                            bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
                            right: '20px',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: PRODUCTO_COLOR,
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(25,118,210,0.4)',
                            cursor: 'pointer',
                            border: 'none',
                            outline: 'none',
                            zIndex: 10,
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <IoAdd size={20} />
                    </button>

                    <BackdropLoader />
                    <ErrorModal />
                </div>

                <CoreMenuPopup
                    open={menuCategoriaData !== null}
                    onClose={() => setMenuCategoriaData(null)}
                    items={menuCategoriaData !== null ? [
                        { icon: <IoCopy />, label: 'Copiar Categoria', onClick: () => handleOpenCopiarCategoria(menuCategoriaData.compraId, menuCategoriaData.catId) },
                        { icon: <IoTrash />, label: 'Eliminar Categoria', color: COLOR_MAP.error, onClick: () => handleDeleteCategoriaDeCompra(menuCategoriaData.compraId, menuCategoriaData.cat) },
                    ] : []}
                />

                <CoreMenuPopup
                    open={menuFiltroVisible}
                    onClose={() => setMenuFiltroVisible(false)}
                    items={[
                        { icon: <IoFilter />, label: 'Mostrar todo', onClick: () => setFiltroDetalle('todos') },
                        { icon: <IoTimeOutline />, label: 'Solo pendientes', onClick: () => setFiltroDetalle('pendientes') },
                        { icon: <IoCheckmarkCircle />, label: 'Solo comprados', onClick: () => setFiltroDetalle('comprados') },
                        { label: 'Cancelar', color: COLOR_MAP.error, onClick: () => {} },
                    ]}
                />

                <ModalProducto
                    open={showModalProducto}
                    onClose={handleCloseModalProducto}
                    isAddingNew={isAddingNew}
                    productoEditId={productoEditId}
                    productoNombre={productoNombre}
                    setProductoNombre={setProductoNombre}
                    productoCantidad={productoCantidad}
                    setProductoCantidad={setProductoCantidad}
                    productoPrecio={productoPrecio}
                    setProductoPrecio={setProductoPrecio}
                    productoCategoriaId={productoCategoriaId}
                    setProductoCategoriaId={setProductoCategoriaId}
                    productoComprado={productoComprado}
                    setProductoComprado={setProductoComprado}
                    productoPrioridad={productoPrioridad}
                    setProductoPrioridad={setProductoPrioridad}
                    allCategorias={allCategorias}
                    onSave={handleSaveProducto}
                />

                <ModalCopiar
                    open={showModalCopiar}
                    onClose={() => { setShowModalCopiar(false); setCopiarData(null); }}
                    comprasCopiar={comprasCopiar}
                    onCopiar={handleCopiarCategoria}
                />
            </>
        );
    }

    return (
        <>
            <div style={containerStyles}>
                <div style={headerStyles}>
                    <h2 style={titleStyles}>Compras</h2>
                    <div style={headerActionsStyles}>
                        <button
                            type="button"
                            style={filtroBtnStyles}
                            onClick={() => {
                                const currentIndex = filtroKeys.indexOf(filtro);
                                setFiltro(filtroKeys[(currentIndex + 1) % filtroKeys.length]);
                            }}
                        >
                            <IoFilter size={12} />
                            {filtroLabels[filtro]}
                        </button>
                        <CoreButtonSquare
                            icon={<IoAdd size={18} />}
                            color={COMPRA_COLOR}
                            onClick={handleOpenAddCompra}
                            ignoreFormState={true}
                        />
                    </div>
                </div>

                <div style={listContainerStyles}>
                    {compras.length === 0 ? (
                        <div style={emptyContainerStyles}>
                            <div style={emptyIconStyles}>
                                <IoCartOutline size={48} />
                            </div>
                            <div style={emptyTextStyles}>No hay compras registradas</div>
                            <div style={emptySubtextStyles}>Presiona + para agregar la primera</div>
                        </div>
                    ) : (
                        compras.map((compra) => {
                            const isCompartida = Number(compra.estado_comparticion) === 1;
                            return (
                            <div
                                key={compra.id}
                                style={{
                                    ...cardStyles,
                                    ...(isCompartida ? { borderLeft: '4px solid #16a34a', background: '#f0fdf4', boxShadow: '0 2px 6px rgba(22,163,74,0.15)' } : {}),
                                }}
                                onClick={() => isCompartida ? setCompraRecibida(compra) || setShowModalCompraRecibida(true) : handleOpenDetail(compra)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.04)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                {isCompartida ? (
                                    <>
                                        <div style={{ ...iconContainerStyles, background: '#16a34a15', color: '#16a34a' }}>
                                            <IoLockClosed size={16} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                            <div style={descriptionStyles} title={compra.descrip}>
                                                {compra.descrip}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={dateStyles}>{compra.fecha}</span>
                                                <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: '600' }}>Recibida</span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div style={iconContainerStyles}>
                                            <IoCartOutline size={16} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                            <div style={descriptionStyles} title={compra.descrip}>
                                                {compra.descrip}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={dateStyles}>{compra.fecha}</span>
                                                <span style={statusBadgeStyles(compra.estado)}>
                                                    {normalizeBool(compra.estado) ? <IoCheckmarkCircle size={10} /> : <IoTimeOutline size={10} />}
                                                </span>
                                                <span style={totalStyles}>{formatTotal(compra.total, compra.simbolo)}</span>
                                            </div>
                                        </div>
                                        <div style={{ flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                                            <CoreButtonSquare
                                                icon={<IoEllipsisVertical size={14} />}
                                                color="#6b7280"
                                                onClick={() => setMenuCompraId(menuCompraId === compra.id ? null : compra.id)}
                                                ignoreFormState={true}
                                                style={{ width: '28px', height: '28px' }}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                            );
                        })
                    )}
                </div>

                <BackdropLoader />
                <ErrorModal />
            </div>

            <CoreMenuPopup
                open={menuCompraId !== null}
                onClose={() => setMenuCompraId(null)}
                items={menuCompraId !== null ? (() => {
                    const compra = compras.find((c) => c.id === menuCompraId);
                    if (!compra) return [];
                    const isCompartida = Number(compra.estado_comparticion) === 1;
                    if (isCompartida) {
                        return [];
                    }
                    return [
                        { icon: <IoPencil />, label: 'Editar', onClick: () => handleOpenEditCompra(compra) },
                        { icon: <IoCheckmarkCircle />, label: normalizeBool(compra.estado) ? 'Marcar Pendiente' : 'Marcar Completa', onClick: () => handleChangeEstadoCompra(compra) },
                        { icon: <IoCopy />, label: 'Duplicar', onClick: () => handleOpenDuplicar(compra) },
                        { icon: <IoShareOutline />, label: 'Compartir', onClick: () => handleOpenCompartir(compra) },
                        { icon: <IoTrash />, label: 'Eliminar', color: COLOR_MAP.error, onClick: () => handleDeleteCompra(compra) },
                    ];
                })() : []}
            />

            <ModalCompra
                open={showModalCompra}
                onClose={handleCloseModalCompra}
                compraEditId={compraEditId}
                compraFecha={compraFecha}
                setCompraFecha={setCompraFecha}
                compraDescripcion={compraDescripcion}
                setCompraDescripcion={setCompraDescripcion}
                compraMonedaId={compraMonedaId}
                setCompraMonedaId={setCompraMonedaId}
                monedas={monedas}
                onSave={handleSaveCompra}
                onKeyDown={handleKeyDownCompra}
            />

            <ModalDuplicar
                open={showModalDuplicar}
                onClose={() => { setShowModalDuplicar(false); setCompraOrigenDuplicar(0); }}
                duplicarFecha={duplicarFecha}
                setDuplicarFecha={setDuplicarFecha}
                duplicarDescripcion={duplicarDescripcion}
                setDuplicarDescripcion={setDuplicarDescripcion}
                onSave={handleDuplicar}
            />

            <ModalCompartir
                open={showModalCompartir}
                onClose={() => { setShowModalCompartir(false); setCompraACompartir(null); }}
                compra={compraACompartir}
                onShared={() => { setShowModalCompartir(false); setCompraACompartir(null); refreshCompras(); }}
            />

            <ModalCompraRecibida
                open={showModalCompraRecibida}
                onClose={() => { setShowModalCompraRecibida(false); setCompraRecibida(null); }}
                compra={compraRecibida || {}}
                onResponded={() => { setShowModalCompraRecibida(false); setCompraRecibida(null); refreshCompras(); window.dispatchEvent(new CustomEvent('fcmdata', { detail: { type: 'comparticion_respondida' } })); }}
            />
        </>
    );
};

export default Compras;

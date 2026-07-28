
import { useState, useEffect, useCallback } from 'react';
import { IoSettingsOutline, IoGridOutline, IoCartOutline, IoCashOutline, IoLogOutOutline, IoStarOutline } from 'react-icons/io5';
import CoreGroup from '../CoreGroup/CoreGroup';
import micarritoLogo from '../../assets/micarrito_logo.png';
import useLazyFetch from '../../hooks/useLazyFetch/useLazyFetch';

const MENU_OPTIONS = [
    { key: 'config', label: 'Configuracion', icon: <IoSettingsOutline size={24} />, color: '#1976d2' },
    { key: 'monedas', label: 'Monedas', icon: <IoCashOutline size={24} />, color: '#f57c00' },
    { key: 'categorias', label: 'Categorias', icon: <IoGridOutline size={24} />, color: '#388e3c' },
    { key: 'compras', label: 'Compras', icon: <IoCartOutline size={24} />, color: '#7b1fa2', badge: true },
    { key: 'favoritos', label: 'Favoritos', icon: <IoStarOutline size={24} />, color: '#f57c00' },
    { key: 'logout', label: 'Cerrar Sesion', icon: <IoLogOutOutline size={24} />, color: '#d32f2f' },
];

const MenuPrincipal = ({ onLogoutConfirm, onSelect }) => {
    const [hoveredKey, setHoveredKey] = useState(null);
    const [contadorPendientes, setContadorPendientes] = useState(0);
    const { fetchData } = useLazyFetch();

    const loadContador = useCallback(async () => {
        try {
            const response = await fetchData('getContadorComprasRecibidas', {});
            if (response?.status && response.data) {
                setContadorPendientes(response.data.count || 0);
            }
        } catch {
            // silently fail
        }
    }, [fetchData]);

    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        loadContador();
    }, [loadContador]);
    /* eslint-enable react-hooks/set-state-in-effect */

    useEffect(() => {
        const handler = (e) => {
            if (e.detail?.type === 'compra_recibida' || e.detail?.type === 'comparticion_respondida') {
                loadContador();
            }
        };
        window.addEventListener('fcmdata', handler);
        return () => window.removeEventListener('fcmdata', handler);
    }, [loadContador]);

    const handleOptionClick = (key) => {
        if (key === 'logout') {
            if (typeof onLogoutConfirm === 'function') {
                onLogoutConfirm();
            }
        } else if (typeof onSelect === 'function') {
            onSelect(key);
        }
    };

    const containerStyles = {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '30px 20px',
        boxSizing: 'border-box',
        overflowY: 'auto',
    };

    const logoStyles = {
        height: '90px',
        marginBottom: '24px',
        userSelect: 'none',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(25, 118, 210, 0.4)',
    };

    const gridStyles = {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        maxWidth: '340px',
        width: '100%',
    };

    const getCardStyles = (key, color) => {
        const isHovered = hoveredKey === key;
        return {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px 4px',
            border: 'none',
            borderRadius: '10px',
            background: isHovered ? '#ffffff' : 'linear-gradient(145deg, #f8faff, #eef4fd)',
            boxShadow: isHovered
                ? `0 8px 24px rgba(0,0,0,0.12), 0 0 0 1px ${color}22`
                : '0 2px 6px rgba(0,0,0,0.06)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            transform: isHovered ? 'translateY(-3px)' : 'none',
            outline: 'none',
            width: '100%',
            boxSizing: 'border-box',
            position: 'relative',
        };
    };

    const getIconContainerStyles = (key, color) => {
        const isHovered = hoveredKey === key;
        return {
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isHovered ? color : `${color}15`,
            transition: 'all 0.2s ease',
        };
    };

    const getLabelStyles = (key, color) => ({
        fontSize: '10px',
        fontWeight: '600',
        color: hoveredKey === key ? color : '#444',
        textAlign: 'center',
        userSelect: 'none',
        transition: 'color 0.2s ease',
        lineHeight: '1.3',
    });

    const getIconColor = (key, color) => hoveredKey === key ? '#fff' : color;

    return (
        <div style={containerStyles}>
            <img src={micarritoLogo} alt="MiCarrito" style={logoStyles} />
            <CoreGroup label="Menu Principal">
                <div style={gridStyles}>
                    {MENU_OPTIONS.map(({ key, label, icon, color }) => (
                        <button
                            key={key}
                            style={getCardStyles(key, color)}
                            onClick={() => handleOptionClick(key)}
                            onMouseEnter={() => setHoveredKey(key)}
                            onMouseLeave={() => setHoveredKey(null)}
                        >
                        {key === 'compras' && contadorPendientes > 0 && (
                            <span style={{
                                position: 'absolute', top: -5, right: -5,
                                background: '#d32f2f', color: '#fff',
                                borderRadius: '50%', minWidth: '20px', height: '20px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '11px', fontWeight: 'bold', padding: '0 5px',
                                zIndex: 1,
                            }}>
                                {contadorPendientes}
                            </span>
                        )}
                        <div style={getIconContainerStyles(key, color)}>
                            <span style={{ color: getIconColor(key, color), transition: 'color 0.2s ease' }}>{icon}</span>
                        </div>
                        <div style={getLabelStyles(key, color)}>{label}</div>
                    </button>
                        ))}
                </div>
            </CoreGroup>
        </div>
    );
};

export default MenuPrincipal;

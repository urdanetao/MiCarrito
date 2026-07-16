
import { useState } from 'react';
import { IoSettingsOutline, IoGridOutline, IoCartOutline, IoCashOutline, IoLogOutOutline } from 'react-icons/io5';
import { showConfirm } from '../CoreConfirm/CoreConfirm';
import micarritoLogo from '../../assets/micarrito_logo.png';

const MENU_OPTIONS = [
    { key: 'config', label: 'Configuracion', icon: <IoSettingsOutline size={24} />, color: '#1976d2' },
    { key: 'monedas', label: 'Monedas', icon: <IoCashOutline size={24} />, color: '#f57c00' },
    { key: 'categorias', label: 'Categorias', icon: <IoGridOutline size={24} />, color: '#388e3c' },
    { key: 'compras', label: 'Compras', icon: <IoCartOutline size={24} />, color: '#7b1fa2' },
    { key: 'logout', label: 'Cerrar Sesion', icon: <IoLogOutOutline size={24} />, color: '#d32f2f' },
];

const MenuPrincipal = ({ onLogout, onSelect }) => {
    const [hoveredKey, setHoveredKey] = useState(null);

    const handleOptionClick = (key) => {
        if (key === 'logout') {
            showConfirm({
                text: '¿Está seguro que desea cerrar sesión?',
                okLabel: 'Aceptar',
                cancelLabel: 'Cancelar',
                okAction: () => {
                    if (typeof onLogout === 'function') {
                        onLogout();
                    }
                },
            });
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
    };

    const gridStyles = {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px',
        maxWidth: '360px',
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
            padding: '14px 6px',
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
            overflow: 'hidden',
        };
    };

    const getIconContainerStyles = (key, color) => {
        const isHovered = hoveredKey === key;
        return {
            width: '40px',
            height: '40px',
            borderRadius: '10px',
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
            <div style={gridStyles}>
                {MENU_OPTIONS.map(({ key, label, icon, color }) => (
                    <button
                        key={key}
                        style={getCardStyles(key, color)}
                        onClick={() => handleOptionClick(key)}
                        onMouseEnter={() => setHoveredKey(key)}
                        onMouseLeave={() => setHoveredKey(null)}
                    >
                        <div style={getIconContainerStyles(key, color)}>
                            <span style={{ color: getIconColor(key, color), transition: 'color 0.2s ease' }}>{icon}</span>
                        </div>
                        <div style={getLabelStyles(key, color)}>{label}</div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default MenuPrincipal;

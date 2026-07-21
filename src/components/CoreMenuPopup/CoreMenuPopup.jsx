import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    acquireModalLayerOrder,
    releaseModalLayerOrder,
    resolveModalLayerZIndex,
} from '../../util/modalStack';

const CORE_MENU_POPUP_STYLE_ID = 'core-menu-popup-styles';
const CORE_MENU_POPUP_STYLE_CONTENT = `
@keyframes coreMenuPopupFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes coreMenuPopupFadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
}

@keyframes coreMenuPopupSlideIn {
    from { opacity: 0; transform: scale(0.95) translateY(-10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes coreMenuPopupSlideOut {
    from { opacity: 1; transform: scale(1) translateY(0); }
    to { opacity: 0; transform: scale(0.95) translateY(-10px); }
}
`;

const ensureMenuPopupStyles = () => {
    if (typeof document === 'undefined') {
        return;
    }
    if (document.getElementById(CORE_MENU_POPUP_STYLE_ID)) {
        return;
    }
    const style = document.createElement('style');
    style.id = CORE_MENU_POPUP_STYLE_ID;
    style.textContent = CORE_MENU_POPUP_STYLE_CONTENT;
    document.head.appendChild(style);
};

const ANIMATION_TIME = 200;

const CoreMenuPopup = ({
    open = false,
    onClose,
    items = [],
    zIndex = 1300,
}) => {
    const dialogRef = useRef(null);
    const [isClosing, setIsClosing] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const [layerOrder, setLayerOrder] = useState(0);
    const layerIdRef = useRef(Symbol('core-menu-popup-layer'));

    useEffect(() => {
        ensureMenuPopupStyles();
    }, []);

    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (open) {
            setShouldRender(true);
            setIsClosing(false);
        } else if (shouldRender) {
            setIsClosing(true);
            const timer = setTimeout(() => {
                setShouldRender(false);
                setIsClosing(false);
            }, ANIMATION_TIME);
            return () => clearTimeout(timer);
        }
    }, [open, shouldRender]);
    /* eslint-enable react-hooks/set-state-in-effect */

    useEffect(() => {
        if (!open) {
            return undefined;
        }
        const layerId = layerIdRef.current;
        const nextLayerOrder = acquireModalLayerOrder(layerId);
        setLayerOrder(nextLayerOrder);
        return () => {
            releaseModalLayerOrder(layerId);
        };
    }, [open]);

    useEffect(() => {
        if (!shouldRender) {
            return undefined;
        }
        const el = dialogRef.current;
        if (el && typeof el.show === 'function' && !el.open) {
            try {
                el.show();
            } catch {
                el.setAttribute('open', 'true');
            }
        }
        return () => {
            if (el && typeof el.close === 'function' && el.open) {
                el.close();
            }
        };
    }, [shouldRender, layerOrder]);

    const handleClose = () => {
        if (typeof onClose === 'function') {
            onClose();
        }
    };

    const handleItemClick = (item) => {
        if (typeof item.onClick === 'function') {
            item.onClick();
        }
        handleClose();
    };

    if (!shouldRender) {
        return null;
    }

    const resolvedZIndex = resolveModalLayerZIndex(zIndex, layerOrder);

    const dialogStyles = {
        position: 'fixed',
        inset: 0,
        width: '100vw',
        maxWidth: '100vw',
        height: '100vh',
        maxHeight: '100vh',
        margin: 0,
        padding: '20px',
        border: 'none',
        background: 'rgba(15, 23, 42, 0.42)',
        overflow: 'visible',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: resolvedZIndex,
        animation: isClosing ? 'coreMenuPopupFadeOut 0.2s ease forwards' : 'coreMenuPopupFadeIn 0.2s ease forwards',
    };

    const menuStyles = {
        width: '100%',
        maxWidth: '280px',
        backgroundColor: '#fff',
        borderRadius: '10px',
        boxShadow: '0 12px 36px rgba(15, 23, 42, 0.2)',
        overflow: 'hidden',
        animation: isClosing ? 'coreMenuPopupSlideOut 0.2s ease forwards' : 'coreMenuPopupSlideIn 0.2s ease forwards',
    };

    return createPortal(
        <dialog
            ref={dialogRef}
            style={dialogStyles}
            onCancel={(e) => { e.preventDefault(); handleClose(); }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    handleClose();
                }
            }}
        >
            <div
                style={menuStyles}
                onClick={(e) => e.stopPropagation()}
                role="menu"
                aria-label="Menú de acciones"
            >
                {items.map((item, index) => (
                    <MenuItem
                        key={index}
                        item={item}
                        isLast={index === items.length - 1}
                        onClick={() => handleItemClick(item)}
                    />
                ))}
            </div>
        </dialog>,
        document.body,
    );
};

const MenuItem = ({ item, isLast, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);

    const itemStyles = {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        cursor: 'pointer',
        fontSize: '14px',
        color: item.color || '#1e293b',
        backgroundColor: isHovered ? '#f1f5f9' : 'transparent',
        transition: 'background-color 0.15s ease',
        borderBottom: isLast ? 'none' : '1px solid #f1f5f9',
        userSelect: 'none',
    };

    const iconStyles = {
        fontSize: '18px',
        color: item.color || '#64748b',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
    };

    return (
        <div
            style={itemStyles}
            role="menuitem"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
        >
            {item.icon && <div style={iconStyles}>{item.icon}</div>}
            <span>{item.label}</span>
        </div>
    );
};

export default CoreMenuPopup;


import { useState } from 'react';
import { COLOR_MAP } from '../../util/constants';

const CoreCard = ({ icon, title, color, width, actions, children }) => {
    const [isHovered, setIsHovered] = useState(false);

    if (typeof title !== 'string') {
        title = '';
    }

    let cardColor = color || COLOR_MAP.info;
    if (typeof cardColor !== 'string') {
        cardColor = COLOR_MAP.info;
    }

    let cardWidth = width;
    if (typeof cardWidth === 'number') {
        cardWidth = `${cardWidth}px`;
    }
    if (typeof cardWidth !== 'string') {
        cardWidth = 'auto';
    }

    const hasActions = Array.isArray(actions) && actions.length > 0;

    const cardStyles = {
        width: cardWidth,
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        boxShadow: isHovered
            ? '0 8px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05)'
            : '0 2px 8px rgba(0, 0, 0, 0.06)',
        overflow: 'hidden',
        transition: 'box-shadow 0.25s ease, transform 0.25s ease',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        display: 'flex',
        flexDirection: 'column',
    };

    const accentBarStyles = {
        height: '4px',
        width: '100%',
        background: `linear-gradient(90deg, ${cardColor}, ${cardColor}cc)`,
    };

    const headerStyles = {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '14px 16px 10px 16px',
    };

    const iconContainerStyles = {
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: `${cardColor}15`,
        color: cardColor,
        flexShrink: 0,
        fontSize: '18px',
    };

    const titleStyles = {
        fontSize: '14px',
        fontWeight: '600',
        color: '#1e293b',
        margin: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        flex: 1,
        minWidth: 0,
    };

    const contentStyles = {
        padding: '0 16px',
        flex: 1,
        fontSize: '13px',
        color: '#64748b',
        lineHeight: 1.5,
    };

    const footerStyles = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '8px',
        padding: '10px 16px',
        marginTop: hasActions ? '8px' : '0',
        borderTop: hasActions ? '1px solid #f1f5f9' : 'none',
    };

    const actionButtonStyles = (actionColor) => ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '5px 10px',
        border: 'none',
        borderRadius: '6px',
        backgroundColor: `${actionColor || cardColor}12`,
        color: actionColor || cardColor,
        fontSize: '12px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'background-color 0.18s, transform 0.15s',
        outline: 'none',
        lineHeight: 1,
    });

    const [hoveredAction, setHoveredAction] = useState(null);

    return (
        <div
            style={cardStyles}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div style={accentBarStyles} />

            {(icon || title) && (
                <div style={headerStyles}>
                    {icon && (
                        <div style={iconContainerStyles}>
                            {icon}
                        </div>
                    )}
                    {title && (
                        <div style={titleStyles} title={title}>{title}</div>
                    )}
                </div>
            )}

            {children && (
                <div style={contentStyles}>
                    {children}
                </div>
            )}

            {hasActions && (
                <div style={footerStyles}>
                    {actions.map((action, index) => {
                        const isHoveredAction = hoveredAction === index;
                        return (
                            <button
                                key={index}
                                style={{
                                    ...actionButtonStyles(action.color),
                                    backgroundColor: isHoveredAction
                                        ? `${action.color || cardColor}25`
                                        : `${action.color || cardColor}12`,
                                    transform: isHoveredAction ? 'scale(1.05)' : 'scale(1)',
                                }}
                                title={action.label}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (typeof action.onClick === 'function') {
                                        action.onClick();
                                    }
                                }}
                                onMouseEnter={() => setHoveredAction(index)}
                                onMouseLeave={() => setHoveredAction(null)}
                            >
                                {action.icon}
                                {action.label && <span>{action.label}</span>}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CoreCard;

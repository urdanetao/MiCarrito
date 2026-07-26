import { useRef } from 'react';
import { COLOR_MAP, DISABLED_COLOR, FORMSTATE } from '../../util/constants.js';

const CoreButton = ({
    label = 'Button',
    icon = null,
    color = COLOR_MAP.info,
    width,
    visible = true,
    disabled = false,
    formState = FORMSTATE.NOSHOW,
    ignoreFormState = false,
    onClick,
    ...props
}) => {
    if (typeof label !== 'string') {
        label = 'Button';
    }

    let btnColor = color || COLOR_MAP.info;
    if (typeof btnColor !== 'string') {
        btnColor = COLOR_MAP.info;
    }

    let btnWidth = width;
    if (typeof btnWidth === 'number') {
        btnWidth = `${btnWidth}px`;
    }
    if (typeof btnWidth !== 'string') {
        btnWidth = 'auto';
    }

    let isDisabled = disabled;
    if (!ignoreFormState) {
        if (formState === FORMSTATE.NOSHOW || formState === FORMSTATE.SHOWING) {
            isDisabled = true;
        } else if (formState === FORMSTATE.EDITING) {
            isDisabled = disabled;
        }
    }

    const CORE_BUTTON_STYLES = {
        button: {
            height: '34px',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 16px',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'background-color 0.18s',
            outline: 'none',
            display: 'inline-block',
            minHeight: '36px',
            minWidth: '64px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            position: 'relative',
            overflow: 'hidden',
            color: '#fff',
        },
        buttonDisabled: {
            cursor: 'default',
            opacity: 0.6,
        },
        icon: {
            display: 'inline-flex',
            alignItems: 'center',
            verticalAlign: 'middle',
            marginRight: '8px',
            fontSize: '18px',
        },
        iconDisabled: {
            color: '#bbb',
        },
        ripple: {
            position: 'absolute',
            borderRadius: '50%',
            transform: 'scale(0)',
            backgroundColor: 'rgba(255,255,255,0.35)',
            pointerEvents: 'none',
            opacity: 0.9,
        },
    };

    const { style: customStyle, className, ...restProps } = props;

    const btnRef = useRef(null);

    const createRipple = (event) => {
        const button = btnRef.current;
        if (!button) return;
        const existingRipple = button.querySelector('[data-corebutton-ripple="true"]');
        if (existingRipple) existingRipple.remove();
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2;
        const ripple = document.createElement('span');
        ripple.setAttribute('data-corebutton-ripple', 'true');
        Object.assign(ripple.style, CORE_BUTTON_STYLES.ripple, {
            width: `${size}px`,
            height: `${size}px`,
        });
        const clientX = event.clientX ?? 0;
        const clientY = event.clientY ?? 0;
        const isKeyboardTrigger = event.detail === 0 && clientX === 0 && clientY === 0;
        const rippleX = isKeyboardTrigger ? rect.width / 2 : clientX - rect.left;
        const rippleY = isKeyboardTrigger ? rect.height / 2 : clientY - rect.top;
        ripple.style.left = `${rippleX - size / 2}px`;
        ripple.style.top = `${rippleY - size / 2}px`;
        button.appendChild(ripple);
        const animation = ripple.animate(
            [
                { transform: 'scale(0)', opacity: 0.9 },
                { transform: 'scale(1)', opacity: 0 },
            ],
            { duration: 600, easing: 'ease-out' },
        );
        animation.addEventListener('finish', () => {
            ripple.remove();
        });
    };
    const handleClick = (e) => {
        if (isDisabled) return;
        createRipple(e);
        if (onClick) onClick(e);
    };
    return (
        <button
            ref={btnRef}
            className={className}
            style={{
                ...CORE_BUTTON_STYLES.button,
                ...(isDisabled ? CORE_BUTTON_STYLES.buttonDisabled : {}),
                backgroundColor: isDisabled ? DISABLED_COLOR : btnColor,
                width: btnWidth,
                minWidth: btnWidth,
                ...customStyle,
                display: visible ? undefined : 'none',
            }}
            disabled={isDisabled}
            onClick={handleClick}
            {...restProps}
        >
            {icon && (
                <span
                    style={{
                        ...CORE_BUTTON_STYLES.icon,
                        ...(isDisabled ? CORE_BUTTON_STYLES.iconDisabled : {}),
                    }}
                >
                    {icon}
                </span>
            )}
            {label}
        </button>
    );
};

export default CoreButton;

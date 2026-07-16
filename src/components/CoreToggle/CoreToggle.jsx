import { forwardRef, useImperativeHandle, useRef } from 'react';
import { FORMSTATE } from '../../util/constants';
import { focusElement } from '../../util/focusNavigation';

const normalizeToggleValue = (rawValue) => {
    if (rawValue === '1' || rawValue === true || rawValue === 'true') {
        return '1';
    }
    return '0';
};

const CoreToggle = forwardRef(({
    label = 'Label',
    value = '0',
    onChange,
    width = '100%',
    visible = true,
    disabled = false,
    formState = FORMSTATE.NOSHOW,
    ignoreFormState = false,
    wrapperStyle,
    rowStyle,
    labelStyle,
    toggleStyle,
}, ref) => {
    const toggleRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focus: () => {
            focusElement(toggleRef.current, { selectText: false });
        },
    }));

    const normalizedValue = normalizeToggleValue(value);
    const isOn = normalizedValue === '1';

    let normalizedWidth = width;
    if (typeof normalizedWidth === 'number') {
        normalizedWidth = `${normalizedWidth}px`;
    }
    if (typeof normalizedWidth !== 'string') {
        normalizedWidth = '100%';
    }

    let isDisabled = disabled;
    if (!ignoreFormState) {
        if (formState === FORMSTATE.NOSHOW || formState === FORMSTATE.SHOWING) {
            isDisabled = true;
        } else if (formState === FORMSTATE.EDITING) {
            isDisabled = disabled;
        }
    }

    const wrapperStyles = {
        width: normalizedWidth,
        display: visible ? undefined : 'none',
        ...wrapperStyle,
    };

    const rowStyles = {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        cursor: isDisabled ? undefined : 'pointer',
        ...rowStyle,
    };

    const textStyles = {
        fontSize: '14px',
        color: isDisabled ? '#aaa' : '#666',
        userSelect: 'none',
        lineHeight: 1.2,
        ...labelStyle,
    };

    const switchStyles = {
        position: 'relative',
        width: '46px',
        height: '24px',
        borderRadius: '999px',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: isOn ? '#4285F4' : '#ccc',
        backgroundColor: isOn ? '#4285F4' : '#f3f3f3',
        transition: 'background-color 0.2s ease, border-color 0.2s ease, opacity 0.2s ease',
        opacity: isDisabled ? 0.65 : 1,
        flexShrink: 0,
        padding: 0,
        outline: 'none',
        userSelect: 'none',
        caretColor: 'transparent',
        cursor: isDisabled ? undefined : 'pointer',
        ...toggleStyle,
    };

    const knobStyles = {
        position: 'absolute',
        top: '2px',
        left: isOn ? '24px' : '2px',
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        backgroundColor: '#fff',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
        transition: 'left 0.2s ease',
    };

    const handleToggle = () => {
        if (isDisabled || typeof onChange !== 'function') {
            return;
        }

        const nextValue = isOn ? '0' : '1';
        onChange({
            target: {
                value: nextValue,
                checked: nextValue === '1',
            },
        });
    };

    const handleRowClick = () => {
        handleToggle();
    };

    const handleButtonClick = (event) => {
        event.stopPropagation();
        handleToggle();
    };

    const handleButtonMouseDown = (event) => {
        event.preventDefault();
    };

    const handleButtonFocus = (event) => {
        event.target.blur();
    };

    return (
        <div style={wrapperStyles}>
            <div style={rowStyles} onClick={handleRowClick}>
                <span style={textStyles}>{label}</span>
                <button
                    ref={toggleRef}
                    type="button"
                    role="switch"
                    aria-checked={isOn}
                    aria-label={String(label ?? 'toggle')}
                    disabled={isDisabled}
                    onMouseDown={handleButtonMouseDown}
                    onFocus={handleButtonFocus}
                    onClick={handleButtonClick}
                    style={switchStyles}
                >
                    <span style={knobStyles} />
                </button>
            </div>
        </div>
    );
});

export default CoreToggle;

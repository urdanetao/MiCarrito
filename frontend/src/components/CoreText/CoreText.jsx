
import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { FORMSTATE, ENTRY_MODE } from '../../util/constants';
import { RxCross2 } from "react-icons/rx";
import { focusElement, focusNextControl } from '../../util/focusNavigation';

const CoreText = forwardRef(({
    label = 'Label',
    value = '',
    onChange,
    onEnter,
    onBlur,
    width,
    visible = true,
    disabled = false,
    entryMode = ENTRY_MODE.NORMAL,
    maxLength,
    formState = FORMSTATE.NOSHOW,
    ignoreFormState = false,
    wrapperStyle,
    labelStyle,
    inputStyle,
}, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isInputHovered, setIsInputHovered] = useState(false);
    const [isClearHovered, setIsClearHovered] = useState(false);
    const inputRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focus: () => {
            focusElement(inputRef.current);
        },
    }));

    const hasValue = value !== undefined && value !== null && String(value).length > 0;
    const isLabelNormalState = isFocused || hasValue;

    if (typeof width === 'number') {
        width = `${width}px`;
    }
    if (typeof width !== 'string') {
        width = '200px';
    }

    const handleChange = (e) => {
        let val = e.target.value;
        if (entryMode === ENTRY_MODE.LOWER) {
            val = val.toLowerCase();
        } else if (entryMode === ENTRY_MODE.UPPER) {
            val = val.toUpperCase();
        }
        if (onChange) {
            e.target.value = val;
            onChange(e);
        }
    };

    const handleFocus = () => {
        setIsFocused(true);
        if (inputRef.current) {
            inputRef.current.select();
        }
    };

    const handleKeyDown = (event) => {
        if (event.key !== 'Enter' || isDisabled) {
            return;
        }

        event.preventDefault();

        const shouldMoveFocus = typeof onEnter === 'function'
            ? onEnter(event, { value: String(value ?? '') }) !== false
            : true;

        if (!shouldMoveFocus) {
            requestAnimationFrame(() => {
                focusElement(inputRef.current);
            });
            return;
        }

        requestAnimationFrame(() => {
            focusNextControl(inputRef.current);
        });
    };

    let isDisabled = disabled;
    if (!ignoreFormState) {
        if (formState === FORMSTATE.NOSHOW || formState === FORMSTATE.SHOWING) {
            isDisabled = true;
        } else if (formState === FORMSTATE.EDITING) {
            isDisabled = disabled;
        }
    }

    const wrapperStyles = {
        position: 'relative',
        paddingTop: '16px',
        width,
        display: visible ? undefined : 'none',
        ...wrapperStyle,
    };

    const labelBaseStyles = {
        position: 'absolute',
        left: '10px',
        top: '24px',
        backgroundColor: 'transparent',
        borderRadius: '5px',
        padding: '0 5px',
        fontSize: '14px',
        color: '#aaa',
        pointerEvents: 'none',
        userSelect: 'none',
        transition: 'all 0.2s ease-out',
    };

    const labelUpStyles = {
        left: '5px',
        top: '0',
        fontSize: '11px',
        backgroundColor: '#fff',
    };

    const labelFocusedStyles = {
        color: '#4285F4',
    };

    const labelStyles = {
        ...labelBaseStyles,
        ...(isLabelNormalState ? labelUpStyles : {}),
        ...(isFocused ? labelFocusedStyles : {}),
        ...labelStyle,
    };

    const inputBaseStyles = {
        width,
        fontSize: '14px',
        color: '#666',
        padding: '8px 35px 8px 8px',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: '#ccc',
        borderRadius: '4px',
        outline: 'none',
        backgroundColor: '#fff',
    };

    const inputFocusedStyles = {
        borderColor: '#4285F4',
        boxShadow: '0 0 5px rgba(66, 133, 244, 0.5)',
    };

    const inputDisabledStyles = {
        backgroundColor: '#fafafa',
        color: '#aaa',
        caretColor: 'transparent',
    };

    const inputStyles = {
        ...inputBaseStyles,
        ...(isFocused ? inputFocusedStyles : {}),
        ...(isDisabled ? inputDisabledStyles : {}),
        ...inputStyle,
    };

    const showClear = hasValue && !isDisabled && (isFocused || isInputHovered || isClearHovered);

    const clearWrapperStyles = {
        position: 'absolute',
        right: '8px',
        top: '22px',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        transition: 'background-color 0.2s, opacity 0.2s',
        opacity: showClear ? 1 : 0,
        pointerEvents: showClear ? 'auto' : 'none',
        zIndex: 2,
        backgroundColor: isClearHovered ? '#ddd' : 'transparent',
    };

    return (
        <div style={wrapperStyles}>
            <label style={labelStyles}>
                {label}
            </label>
            <input
                ref={inputRef}
                type="text"
                value={value ?? ''}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={(e) => { setIsFocused(false); onBlur?.(e); }}
                onKeyDown={handleKeyDown}
                onMouseEnter={() => setIsInputHovered(true)}
                onMouseLeave={() => setIsInputHovered(false)}
                style={inputStyles}
                maxLength={maxLength}
                disabled={isDisabled}
                spellCheck={false}
            />
            {hasValue && !isDisabled && (
                <div
                    style={clearWrapperStyles}
                    onMouseEnter={() => setIsClearHovered(true)}
                    onMouseLeave={() => setIsClearHovered(false)}
                    onClick={() => {
                        if (onChange) {
                            onChange({ target: { value: '' } });
                        }
                    }}
                >
                    <RxCross2 style={{ color: '#666' }} />
                </div>
            )}
        </div>
    );
});

export default CoreText;

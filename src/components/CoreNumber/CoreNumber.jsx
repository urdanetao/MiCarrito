import { useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { FORMSTATE } from '../../util/constants';
import { RxCross2 } from 'react-icons/rx';
import { focusElement, focusNextControl } from '../../util/focusNavigation';

const clampDecimals = (value) => {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
        return 2;
    }
    return parsed;
};

const stripThousands = (value) => String(value ?? '').replace(/,/g, '');

const sanitizeNumericInput = (rawValue, decimals) => {
    const raw = String(rawValue ?? '')
        .replace(/,/g, '')
        .replace(/\s+/g, '');

    if (raw === '') {
        return '';
    }

    const signMatches = raw.match(/[+-]/g) || [];
    const hasSingleLeadingSign = signMatches.length === 1 && (raw.startsWith('+') || raw.startsWith('-'));
    const sign = hasSingleLeadingSign ? raw.charAt(0) : '';

    let unsignedRaw = raw.replace(/[+-]/g, '');
    unsignedRaw = unsignedRaw.replace(/[^0-9.]/g, '');

    if (decimals === 0) {
        unsignedRaw = unsignedRaw.replace(/\./g, '');
        return `${sign}${unsignedRaw}`;
    }

    const firstDotIndex = unsignedRaw.indexOf('.');
    if (firstDotIndex === -1) {
        return `${sign}${unsignedRaw}`;
    }

    const integerPart = unsignedRaw.slice(0, firstDotIndex).replace(/\./g, '');
    const decimalPart = unsignedRaw
        .slice(firstDotIndex + 1)
        .replace(/\./g, '')
        .slice(0, decimals);

    return `${sign}${integerPart}.${decimalPart}`;
};

const formatWithThousands = (fixedString) => {
    const isNegative = fixedString.startsWith('-');
    const unsigned = isNegative ? fixedString.slice(1) : fixedString;
    const [integerPart, decimalPart = ''] = unsigned.split('.');
    const integerWithSeparator = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    if (decimalPart === '') {
        return `${isNegative ? '-' : ''}${integerWithSeparator}`;
    }

    return `${isNegative ? '-' : ''}${integerWithSeparator}.${decimalPart}`;
};

const toFixedString = (value, decimals) => {
    const numericValue = Number(stripThousands(value));
    const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
    const normalizedValue = Object.is(safeValue, -0) ? 0 : safeValue;
    return normalizedValue.toFixed(decimals);
};

const normalizeStorageValue = (value, decimals) => {
    const sanitizedValue = sanitizeNumericInput(stripThousands(value), decimals);
    return toFixedString(sanitizedValue, decimals);
};

const formatNumberValue = (value, decimals, thousandSep) => {
    const fixed = normalizeStorageValue(value, decimals);
    if (!thousandSep) {
        return fixed;
    }
    return formatWithThousands(fixed);
};

const CoreNumber = forwardRef(({
    label = 'Label',
    value = '',
    onChange,
    onEnter,
    width,
    visible = true,
    disabled = false,
    maxLength,
    formState = FORMSTATE.NOSHOW,
    ignoreFormState = false,
    decimals = 2,
    thousandSep = true,
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

    const decimalCount = clampDecimals(decimals);
    const useThousandSeparator = thousandSep !== false;

    if (typeof width === 'number') {
        width = `${width}px`;
    }
    if (typeof width !== 'string') {
        width = '200px';
    }

    // Lógica de habilitación/deshabilitación
    let isDisabled = disabled;
    if (!ignoreFormState) {
        if (formState === FORMSTATE.NOSHOW || formState === FORMSTATE.SHOWING) {
            isDisabled = true;
        } else if (formState === FORMSTATE.EDITING) {
            isDisabled = disabled;
        }
    }

    const rawValue = value === undefined || value === null ? '' : String(value);
    const editableValue = useMemo(() => {
        return sanitizeNumericInput(stripThousands(rawValue), decimalCount);
    }, [rawValue, decimalCount]);

    const formattedValue = useMemo(() => {
        return formatNumberValue(rawValue, decimalCount, useThousandSeparator);
    }, [rawValue, decimalCount, useThousandSeparator]);

    const inputValue = isFocused
        ? editableValue
        : formattedValue;

    const hasValue = inputValue !== undefined && inputValue !== null && String(inputValue).length > 0;
    const isLabelNormalState = isFocused || hasValue;

    useEffect(() => {
        if (isFocused || typeof onChange !== 'function') {
            return;
        }

        const nextValue = normalizeStorageValue(rawValue, decimalCount);
        if (rawValue !== nextValue) {
            onChange({ target: { value: nextValue } });
        }
    }, [rawValue, isFocused, decimalCount, onChange]);

    // Selecciona todo el texto al enfocar
    const handleFocus = () => {
        setIsFocused(true);
        if (inputRef.current) {
            requestAnimationFrame(() => {
                inputRef.current.select();
            });
        }
    };

    const handleChange = (event) => {
        let nextValue = sanitizeNumericInput(event.target.value, decimalCount);

        if (typeof maxLength === 'number' && maxLength > 0) {
            nextValue = nextValue.slice(0, maxLength);
        }

        if (onChange) {
            onChange({ ...event, target: { ...event.target, value: nextValue } });
        }
    };

    const handleBlur = () => {
        setIsFocused(false);
    };

    const handleKeyDown = (event) => {
        if (event.key !== 'Enter' || isDisabled) {
            return;
        }

        event.preventDefault();

        const shouldMoveFocus = typeof onEnter === 'function'
            ? onEnter(event, { value: String(rawValue ?? '') }) !== false
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

    // Estilos.
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
        textAlign: isFocused ? 'left' : 'right',
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

    // El componente debe existir aunque visible sea false
    return (
        <div style={wrapperStyles}>
            <label style={labelStyles}>
                {label}
            </label>
            <input
                ref={inputRef}
                type='text'
                value={inputValue}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                onMouseEnter={() => setIsInputHovered(true)}
                onMouseLeave={() => setIsInputHovered(false)}
                style={inputStyles}
                maxLength={maxLength}
                disabled={isDisabled}
                spellCheck={false}
                inputMode={decimalCount > 0 ? 'decimal' : 'numeric'}
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

export default CoreNumber;

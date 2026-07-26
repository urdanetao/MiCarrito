import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { RxChevronDown, RxCross2 } from 'react-icons/rx';
import { FORMSTATE } from '../../util/constants';
import { focusElement, focusNextControl } from '../../util/focusNavigation';

const normalizeOption = (option) => {
	if (typeof option === 'string' || typeof option === 'number') {
		return {
			value: String(option),
			label: String(option),
			disabled: false,
		};
	}

	return {
		value: option?.value ?? '',
		label: option?.label ?? option?.value ?? '',
		disabled: Boolean(option?.disabled),
	};
};

const CoreSelect = forwardRef(({
	label = 'Label',
	value = '',
	onChange,
	onEnter,
	options = [],
	width,
	visible = true,
	disabled = false,
	formState = FORMSTATE.NOSHOW,
	ignoreFormState = false,
	placeholder = '',
	showClearButton = true,
}, ref) => {
	const [isFocused, setIsFocused] = useState(false);
	const [isSelectHovered, setIsSelectHovered] = useState(false);
	const [isClearHovered, setIsClearHovered] = useState(false);
	const selectRef = useRef(null);

	useImperativeHandle(ref, () => ({
		focus: () => {
			focusElement(selectRef.current, { selectText: false });
		},
	}));

	const normalizedOptions = options.map(normalizeOption);
	const hasValue = value !== undefined && value !== null && String(value).length > 0;
	const isLabelNormalState = isFocused || hasValue;

	if (typeof width === 'number') {
		width = `${width}px`;
	}
	if (typeof width !== 'string') {
		width = '200px';
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
		position: 'relative',
		paddingTop: '16px',
		width,
		display: visible ? undefined : 'none',
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
        zIndex: 1,
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
	};

	const selectBaseStyles = {
		width,
		fontSize: '14px',
		color: hasValue ? '#666' : '#aaa',
		padding: '8px 56px 8px 8px',
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: '#ccc',
		borderRadius: '4px',
		outline: 'none',
		backgroundColor: '#fff',
		appearance: 'none',
		WebkitAppearance: 'none',
		MozAppearance: 'none',
		cursor: isDisabled ? 'default' : 'pointer',
	};

	const selectFocusedStyles = {
		borderColor: '#4285F4',
		boxShadow: '0 0 5px rgba(66, 133, 244, 0.5)',
	};

    const selectDisabledStyles = {
        backgroundColor: '#fafafa',
        color: '#aaa',
        caretColor: 'transparent',
    };

	const selectStyles = {
		...selectBaseStyles,
		...(isFocused ? selectFocusedStyles : {}),
		...(isDisabled ? selectDisabledStyles : {}),
	};

	const showClear = showClearButton && hasValue && !isDisabled && (isFocused || isSelectHovered || isClearHovered);

	const clearWrapperStyles = {
		position: 'absolute',
		right: '30px',
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

	const arrowWrapperStyles = {
		position: 'absolute',
		right: '8px',
		top: '22px',
		width: '20px',
		height: '20px',
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		pointerEvents: 'none',
		color: isFocused ? '#4285F4' : '#666',
	};

	const handleClear = () => {
		if (onChange) {
			onChange({ target: { value: '' } });
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
				focusElement(selectRef.current, { selectText: false });
			});
			return;
		}

		requestAnimationFrame(() => {
			focusNextControl(selectRef.current, { selectText: false });
		});
	};

	return (
		<div style={wrapperStyles}>
			<label style={labelStyles}>
				{label}
			</label>
			<select
				ref={selectRef}
				value={value ?? ''}
				onChange={onChange}
				onFocus={() => setIsFocused(true)}
				onBlur={() => setIsFocused(false)}
				onKeyDown={handleKeyDown}
				onMouseEnter={() => setIsSelectHovered(true)}
				onMouseLeave={() => setIsSelectHovered(false)}
				style={selectStyles}
				disabled={isDisabled}
			>
				<option value="" disabled={placeholder === ''} hidden={placeholder === ''}>
					{placeholder}
				</option>
				{normalizedOptions.map((option, index) => (
					<option
						key={`${String(option.value)}-${String(option.label)}-${index}`}
						value={option.value}
						disabled={option.disabled}
					>
						{option.label}
					</option>
				))}
			</select>
			<div style={arrowWrapperStyles}>
				<RxChevronDown />
			</div>
			<div
				style={clearWrapperStyles}
				onMouseEnter={() => setIsClearHovered(true)}
				onMouseLeave={() => setIsClearHovered(false)}
				onClick={handleClear}
			>
				<RxCross2 style={{ color: '#666' }} />
			</div>
		</div>
	);
});

export default CoreSelect;

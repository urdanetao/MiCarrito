import { useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { RxChevronDown, RxCross2 } from 'react-icons/rx';
import { ENTRY_MODE, FORMSTATE } from '../../util/constants';

const normalizeItem = (item) => {
	if (!item || typeof item !== 'object') {
		return { disabled: false };
	}

	return {
		...item,
		disabled: Boolean(item.disabled),
	};
};

const normalizeEntryModeValue = (value, entryMode) => {
	const raw = String(value ?? '');
	if (entryMode === ENTRY_MODE.UPPER) {
		return raw.toUpperCase();
	}
	if (entryMode === ENTRY_MODE.LOWER) {
		return raw.toLowerCase();
	}
	return raw;
};

const getFieldValue = (item, fieldName) => {
	if (!item || typeof item !== 'object' || !fieldName) {
		return undefined;
	}

	if (Object.prototype.hasOwnProperty.call(item, fieldName)) {
		return item[fieldName];
	}

	const normalizedField = String(fieldName).toLowerCase();
	const matchedKey = Object.keys(item).find((key) => String(key).toLowerCase() === normalizedField);
	if (matchedKey) {
		return item[matchedKey];
	}

	return undefined;
};

const focusElement = (element) => {
	if (!element || typeof element.focus !== 'function') {
		return;
	}

	element.focus();

	if (
		typeof element.select === 'function' &&
		(element.tagName === 'INPUT' || element.tagName === 'TEXTAREA')
	) {
		element.select();
	}
};

const findNextFocusableElement = (currentElement) => {
	if (!currentElement || typeof document === 'undefined') {
		return null;
	}

	const focusableSelector = [
		'input:not([type="hidden"]):not([disabled])',
		'select:not([disabled])',
		'textarea:not([disabled])',
		'button:not([disabled])',
		'[tabindex]:not([tabindex="-1"])',
	].join(',');

	const focusableElements = Array.from(document.querySelectorAll(focusableSelector)).filter((element) => {
		if (!(element instanceof HTMLElement)) {
			return false;
		}

		if (element.getAttribute('aria-hidden') === 'true' || element.getAttribute('aria-disabled') === 'true') {
			return false;
		}

		const style = window.getComputedStyle(element);
		if (style.display === 'none' || style.visibility === 'hidden') {
			return false;
		}

		if (element.offsetParent === null && style.position !== 'fixed') {
			return false;
		}

		return true;
	});

	const currentIndex = focusableElements.indexOf(currentElement);
	if (currentIndex < 0) {
		return focusableElements[0] ?? null;
	}

	return focusableElements[currentIndex + 1] ?? null;
};

const focusNextControl = (currentElement) => {
	const nextElement = findNextFocusableElement(currentElement);
	if (!nextElement) {
		return false;
	}

	focusElement(nextElement);
	return true;
};

const CoreSuggest = forwardRef(({
	label = 'Label',
	value = '',
	onChange,
	onSelect,
	onEnter,
	options = [],
	fieldId = 'id',
	displayField = 'text1',
	listDisplayField = '',
	listDisplayWidth,
	filterFields = 'text1',
	showMaxItems = 7,
	width,
	visible = true,
	disabled = false,
	formState = FORMSTATE.NOSHOW,
	ignoreFormState = false,
	placeholder = '',
	entryMode = ENTRY_MODE.NORMAL,
}, ref) => {
	const inputRef = useRef(null);
	const [isFocused, setIsFocused] = useState(false);
	const [isInputHovered, setIsInputHovered] = useState(false);
	const [isClearHovered, setIsClearHovered] = useState(false);
	const [inputValue, setInputValue] = useState('');
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const [isOpen, setIsOpen] = useState(false);
	const skipNextBlurCommitRef = useRef(false);
	const suppressOpenOnNextFocusRef = useRef(false);
	const optionRefs = useRef([]);

	const focusInput = ({ suppressOpenOnFocus = false } = {}) => {
		if (suppressOpenOnFocus) {
			suppressOpenOnNextFocusRef.current = true;
		}

		focusElement(inputRef.current);

		if (
			suppressOpenOnFocus &&
			typeof document !== 'undefined' &&
			document.activeElement !== inputRef.current
		) {
			suppressOpenOnNextFocusRef.current = false;
		}
	};

	useImperativeHandle(ref, () => ({
		focus: () => {
			focusInput({ suppressOpenOnFocus: true });
		},
	}));

	const normalizedOptions = useMemo(
		() => options.map(normalizeItem),
		[options],
	);

	const resolvedFilterFields = useMemo(() => {
		if (Array.isArray(filterFields)) {
			return filterFields.map((field) => String(field).trim()).filter(Boolean);
		}

		if (typeof filterFields === 'string') {
			const fields = filterFields
				.split(',')
				.map((field) => field.trim())
				.filter(Boolean);
			return fields.length > 0 ? fields : ['text1'];
		}

		return ['text1'];
	}, [filterFields]);

	if (typeof width === 'number') {
		width = `${width}px`;
	}
	if (typeof width !== 'string') {
		width = '200px';
	}

	let resolvedListDisplayWidth = listDisplayWidth;
	if (typeof resolvedListDisplayWidth === 'number') {
		resolvedListDisplayWidth = `${resolvedListDisplayWidth}px`;
	}
	if (typeof resolvedListDisplayWidth !== 'string' || resolvedListDisplayWidth.trim() === '') {
		resolvedListDisplayWidth = width;
	}

	let isDisabled = disabled;
	if (!ignoreFormState) {
		if (formState === FORMSTATE.NOSHOW || formState === FORMSTATE.SHOWING) {
			isDisabled = true;
		} else if (formState === FORMSTATE.EDITING) {
			isDisabled = disabled;
		}
	}

	const hasValue = inputValue.length > 0;
	const isLabelNormalState = isFocused || hasValue;
	const optionItemHeight = 34;
	const resolvedShowMaxItems = Math.max(1, Number.isFinite(Number(showMaxItems)) ? Math.floor(Number(showMaxItems)) : 7);
	const dropdownMaxHeight = `${resolvedShowMaxItems * optionItemHeight}px`;
	const resolvedListDisplayField = String(listDisplayField ?? '').trim() || String(displayField ?? '').trim();

	const getOptionDisplayText = (option, primaryField) => {
		const primaryText = getFieldValue(option, primaryField);
		if (primaryText !== undefined && primaryText !== null && String(primaryText).length > 0) {
			return String(primaryText);
		}

		const fallbackField = resolvedFilterFields[0] || fieldId;
		return String(getFieldValue(option, fallbackField) ?? '');
	};

	const getInputDisplayText = (option) => getOptionDisplayText(option, displayField);
	const getListDisplayText = (option) => getOptionDisplayText(option, resolvedListDisplayField);

	const searchCriteria = String(inputValue ?? '').trim().toLowerCase();

	const visibleOptions = useMemo(() => {
		const enabledOptions = normalizedOptions.filter((option) => !option.disabled);

		if (searchCriteria.length === 0) {
			return enabledOptions;
		}

		return enabledOptions.filter((option) => {
			const fieldsText = resolvedFilterFields
				.map((field) => String(getFieldValue(option, field) ?? ''))
				.join(' ')
				.toLowerCase();

			return fieldsText.includes(searchCriteria);
		});
	}, [normalizedOptions, resolvedFilterFields, searchCriteria]);

	useEffect(() => {
		const normalizedValue = String(value ?? '');

		if (normalizedValue === '') {
			setInputValue('');
			return;
		}

		const selected = normalizedOptions.find((option) => {
			const optionId = getFieldValue(option, fieldId);
			if (optionId === null || optionId === undefined) {
				return false;
			}

			return String(optionId) === normalizedValue;
		});

		if (selected) {
			setInputValue(getInputDisplayText(selected));
			return;
		}

		setInputValue('');
	}, [normalizedOptions, value, fieldId, displayField, resolvedFilterFields]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		if (visibleOptions.length === 0) {
			setHighlightedIndex(-1);
			if (searchCriteria.length > 0) {
				setIsOpen(false);
			}
			return;
		}

		setHighlightedIndex((prev) => {
			if (prev < 0 || prev > visibleOptions.length - 1) {
				return 0;
			}
			return prev;
		});
	}, [isOpen, visibleOptions, searchCriteria]);

	useEffect(() => {
		if (!isOpen || highlightedIndex < 0) {
			return;
		}

		const highlightedOption = optionRefs.current[highlightedIndex];
		if (highlightedOption) {
			highlightedOption.scrollIntoView({ block: 'nearest' });
		}
	}, [highlightedIndex, isOpen]);

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
		transition: 'all 0.2s ease-out',
		zIndex: 3,
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

	const inputBaseStyles = {
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
	};

	const inputFocusedStyles = {
		borderColor: '#4285F4',
		boxShadow: '0 0 5px rgba(66, 133, 244, 0.5)',
	};

	const inputDisabledStyles = {
		backgroundColor: '#fafafa',
		color: '#aaa',
	};

	const inputStyles = {
		...inputBaseStyles,
		...(isFocused ? inputFocusedStyles : {}),
		...(isDisabled ? inputDisabledStyles : {}),
	};

	const showClear = hasValue && !isDisabled && (isFocused || isInputHovered || isClearHovered);

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
		zIndex: 4,
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
		zIndex: 2,
	};

	const listStyles = {
		position: 'absolute',
		left: 0,
		top: '100%',
		width: resolvedListDisplayWidth,
		maxHeight: dropdownMaxHeight,
		overflowY: 'auto',
		backgroundColor: '#fff',
		border: '1px solid #ccc',
		borderRadius: '4px',
		boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)',
		zIndex: 20,
		opacity: isOpen ? 1 : 0,
		transform: isOpen ? 'translateY(0)' : 'translateY(-4px)',
		pointerEvents: isOpen ? 'auto' : 'none',
		transition: 'opacity 0.18s ease, transform 0.18s ease',
	};

	const optionBaseStyles = {
		padding: '8px 10px',
		fontSize: '14px',
		lineHeight: '18px',
		height: `${optionItemHeight}px`,
		boxSizing: 'border-box',
		display: 'flex',
		alignItems: 'center',
		color: '#444',
		cursor: 'pointer',
		userSelect: 'none',
		whiteSpace: 'nowrap',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
	};

	const emitValue = (nextId) => {
		if (onChange) {
			onChange({ target: { value: String(nextId ?? '') } });
		}
	};

	const emitSelect = (option) => {
		if (!onSelect || !option) {
			return;
		}

		const selectedValue = String(getFieldValue(option, fieldId) ?? '');
		onSelect(selectedValue, option);
	};

	const focusAndSelectInput = () => {
		focusInput();
	};

	const selectOption = (option, { keepFocus = true } = {}) => {
		setInputValue(getInputDisplayText(option));
		setIsOpen(false);
		emitValue(getFieldValue(option, fieldId) ?? '');
		emitSelect(option);

		if (keepFocus) {
			requestAnimationFrame(() => {
				focusAndSelectInput();
			});
		}
	};

	const notifyEnter = (event, option) => {
		if (typeof onEnter !== 'function') {
			return true;
		}

		const shouldContinue = onEnter(event, {
			value: String(getFieldValue(option, fieldId) ?? ''),
			option: option ?? null,
			inputValue: String(inputValue ?? ''),
		});

		return shouldContinue !== false;
	};

	const handleEnter = (event) => {
		event.preventDefault();

		let optionToSelect;
		if (isOpen && visibleOptions.length > 0) {
			optionToSelect = visibleOptions[highlightedIndex] ?? visibleOptions[0] ?? null;
		} else {
			optionToSelect = normalizedOptions.find(
				(option) => getInputDisplayText(option).toLowerCase() === String(inputValue ?? '').trim().toLowerCase(),
			) ?? null;
		}

		if (optionToSelect) {
			selectOption(optionToSelect, { keepFocus: false });
		} else {
			setIsOpen(false);
		}

		const shouldMoveFocus = notifyEnter(event, optionToSelect);
		if (!shouldMoveFocus) {
			requestAnimationFrame(() => {
				focusAndSelectInput();
			});
			return;
		}

		skipNextBlurCommitRef.current = true;
		requestAnimationFrame(() => {
			const moved = focusNextControl(inputRef.current);
			if (!moved) {
				skipNextBlurCommitRef.current = false;
			}
		});
	};

	const handleInputChange = (event) => {
		const nextRaw = normalizeEntryModeValue(event.target.value, entryMode);
		setInputValue(nextRaw);

		if (nextRaw.trim().length === 0) {
			setIsOpen(false);
			emitValue('');
			return;
		}

		setIsOpen(true);
	};

	const handleToggleDropdown = () => {
		if (isDisabled) {
			return;
		}

		setIsOpen((prev) => !prev);
		if (inputRef.current) {
			inputRef.current.focus();
		}
	};

	const handleFocus = () => {
		setIsFocused(true);
		if (inputRef.current) {
			inputRef.current.select();
		}

		if (suppressOpenOnNextFocusRef.current) {
			suppressOpenOnNextFocusRef.current = false;
			return;
		}

		if (inputValue.trim().length > 0 && visibleOptions.length > 0 && !isDisabled) {
			setIsOpen(true);
		}
	};

	const handleBlur = () => {
		setIsFocused(false);
		setIsOpen(false);

		if (skipNextBlurCommitRef.current) {
			skipNextBlurCommitRef.current = false;
			return;
		}

		const exact = normalizedOptions.find(
			(option) => getInputDisplayText(option).toLowerCase() === String(inputValue ?? '').trim().toLowerCase(),
		);

		if (exact) {
			setInputValue(getInputDisplayText(exact));
			emitValue(getFieldValue(exact, fieldId) ?? '');
			emitSelect(exact);
			return;
		}

		setInputValue('');
		emitValue('');
	};

	const handleKeyDown = (event) => {
		if (event.key === 'Enter') {
			handleEnter(event);
			return;
		}

		if (!isOpen || visibleOptions.length === 0) {
			return;
		}

		if (event.key === 'ArrowDown') {
			event.preventDefault();
			setHighlightedIndex((prev) => {
				if (prev < 0) return 0;
				return prev === visibleOptions.length - 1 ? 0 : prev + 1;
			});
			return;
		}

		if (event.key === 'ArrowUp') {
			event.preventDefault();
			setHighlightedIndex((prev) => {
				if (prev < 0) return visibleOptions.length - 1;
				return prev === 0 ? visibleOptions.length - 1 : prev - 1;
			});
			return;
		}

		if (event.key === 'PageDown') {
			event.preventDefault();
			setHighlightedIndex((prev) => {
				const baseIndex = prev < 0 ? 0 : prev;
				return Math.min(baseIndex + resolvedShowMaxItems, visibleOptions.length - 1);
			});
			return;
		}

		if (event.key === 'PageUp') {
			event.preventDefault();
			setHighlightedIndex((prev) => {
				const baseIndex = prev < 0 ? visibleOptions.length - 1 : prev;
				return Math.max(baseIndex - resolvedShowMaxItems, 0);
			});
			return;
		}

		if (event.key === 'Escape') {
			event.preventDefault();
			setIsOpen(false);
		}
	};

	const handleClear = () => {
		setInputValue('');
		setIsOpen(false);
		emitValue('');
		if (inputRef.current) {
			inputRef.current.focus();
		}
	};

	return (
		<div style={wrapperStyles}>
			<label style={labelStyles}>{label}</label>
			<input
				ref={inputRef}
				type="text"
				value={inputValue}
				onChange={handleInputChange}
				onFocus={handleFocus}
				onBlur={handleBlur}
				onKeyDown={handleKeyDown}
				onMouseEnter={() => setIsInputHovered(true)}
				onMouseLeave={() => setIsInputHovered(false)}
				style={inputStyles}
				disabled={isDisabled}
				spellCheck={false}
				placeholder={placeholder}
				autoComplete="off"
			/>

			<div
				style={{ ...arrowWrapperStyles, pointerEvents: 'auto', cursor: isDisabled ? 'default' : 'pointer' }}
				onMouseDown={(event) => {
					event.preventDefault();
					handleToggleDropdown();
				}}
			>
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

			<div style={listStyles}>
				{visibleOptions.map((option, index) => {
					const isHighlighted = index === highlightedIndex;
					return (
						<div
							ref={(element) => {
								optionRefs.current[index] = element;
							}}
							key={`${String(getFieldValue(option, fieldId) ?? '')}-${getListDisplayText(option)}-${index}`}
							onMouseDown={(event) => {
								event.preventDefault();
								selectOption(option);
							}}
							onMouseEnter={() => setHighlightedIndex(index)}
							style={{
								...optionBaseStyles,
								backgroundColor: isHighlighted ? '#e8f0fe' : '#fff',
								color: isHighlighted ? '#1a73e8' : '#444',
								fontWeight: isHighlighted ? 600 : 400,
							}}
							title={getListDisplayText(option)}
						>
							{getListDisplayText(option)}
						</div>
					);
				})}
			</div>
		</div>
	);
});

export default CoreSuggest;

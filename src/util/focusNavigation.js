
const canSelectText = (element) => {
    if (!element || typeof element.select !== 'function') {
        return false;
    }

    return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA';
};

const isHTMLElementNode = (element) => {
    if (!element) {
        return false;
    }

    if (typeof HTMLElement !== 'undefined') {
        return element instanceof HTMLElement;
    }

    return element.nodeType === 1;
};

export const focusElement = (element, { selectText = true } = {}) => {
    if (!element || typeof element.focus !== 'function') {
        return false;
    }

    element.focus();

    if (selectText && canSelectText(element)) {
        element.select();
    }

    return true;
};

export const findNextFocusableElement = (currentElement) => {
    if (!currentElement || typeof document === 'undefined') {
        return null;
    }

    const focusableSelector = [
        'input:not([type="hidden"]):not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'button:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    const focusableElements = Array.from(document.querySelectorAll(focusableSelector)).filter((element) => {
        if (!isHTMLElementNode(element)) {
            return false;
        }

        if (element.getAttribute('aria-hidden') === 'true' || element.getAttribute('aria-disabled') === 'true') {
            return false;
        }

        if (element.hasAttribute('disabled')) {
            return false;
        }

        if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
            const style = window.getComputedStyle(element);
            if (style.display === 'none' || style.visibility === 'hidden') {
                return false;
            }

            if (element.offsetParent === null && style.position !== 'fixed') {
                return false;
            }
        }

        return true;
    });

    const currentIndex = focusableElements.indexOf(currentElement);
    if (currentIndex < 0) {
        return focusableElements[0] ?? null;
    }

    return focusableElements[currentIndex + 1] ?? null;
};

export const focusNextControl = (currentElement, { selectText = true } = {}) => {
    const nextElement = findNextFocusableElement(currentElement);
    if (!nextElement) {
        return false;
    }

    return focusElement(nextElement, { selectText });
};

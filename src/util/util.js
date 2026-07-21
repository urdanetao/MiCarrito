
const emptySessionData = {
    sessionId: "",
    company: {},
    user: {},
};

function getSessionData(getEmpty = false) {
    if (getEmpty) {
        return emptySessionData;
    }

    const data = sessionStorage.getItem('sessionData');

    if (!data) {
        return emptySessionData;
    }

    try {
        return JSON.parse(data);
    } catch {
        return emptySessionData;
    }
}

function setSessionData(data) {
    try {
        const stringData = JSON.stringify(data);
        sessionStorage.setItem('sessionData', stringData);
    } catch {
        return emptySessionData;
    }
}

function isRunningInWebView() {
    return typeof Android !== 'undefined' && typeof Android.showToast === 'function';
}

function normalizeBool(value) {
    return value === '1' || value === true || value === 'true';
}

const backHandlerRegistry = {
    handler: null,
    restore: null,
    _modalStack: [],
    set(fn) {
        this.handler = typeof fn === 'function' ? fn : null;
    },
    setRestore(fn) {
        this.restore = typeof fn === 'function' ? fn : null;
    },
    clear() {
        this.handler = null;
    },
    clearRestore() {
        this.restore = null;
    },
    pushModalBackHandler(fn) {
        this._modalStack.push(typeof fn === 'function' ? fn : null);
    },
    popModalBackHandler() {
        this._modalStack.pop();
    },
    invoke() {
        if (this._modalStack.length > 0) {
            const fn = this._modalStack[this._modalStack.length - 1];
            if (typeof fn === 'function') {
                fn();
                return true;
            }
        }
        if (typeof this.handler === 'function') {
            this.handler();
            return true;
        }
        return false;
    },
};

function setBackHandler(fn) {
    backHandlerRegistry.set(fn);
}

function setRestoreHandler(fn) {
    backHandlerRegistry.setRestore(fn);
}

function clearBackHandler() {
    backHandlerRegistry.clear();
}

export { getSessionData, setSessionData, isRunningInWebView, normalizeBool, setBackHandler, setRestoreHandler, clearBackHandler, clearBackHandler as clearRestoreHandler, pushModalBackHandler, popModalBackHandler, backHandlerRegistry };

function pushModalBackHandler(fn) {
    backHandlerRegistry.pushModalBackHandler(fn);
}

function popModalBackHandler() {
    backHandlerRegistry.popModalBackHandler();
}

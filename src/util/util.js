
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
    invoke() {
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

export { getSessionData, setSessionData, isRunningInWebView, normalizeBool, setBackHandler, setRestoreHandler, clearBackHandler, clearBackHandler as clearRestoreHandler, backHandlerRegistry };

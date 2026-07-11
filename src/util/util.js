
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

export { getSessionData, setSessionData };

import { useState, useEffect, useRef, useCallback } from 'react';
import { CoreHeader } from './components';
import { Login, Engine } from './system';
import { getSessionData, setSessionData, isRunningInWebView } from './util/util';
import useLazyFetch from './hooks/useLazyFetch/useLazyFetch';

function App() {
    const moduleName = "MiCarrito";
    const [session, setSession] = useState(getSessionData());
    const logued = session?.sessionId?.trim() !== "" ? true : false;
    const { fetchData } = useLazyFetch();
    const pendingFcmTokenRef = useRef(null);

    const registerFcmToken = useCallback(async (token) => {
        if (!token) return;
        const sessionData = getSessionData();
        const sessionId = sessionData?.sessionId;
        if (!sessionId || sessionId.trim() === '') {
            pendingFcmTokenRef.current = token;
            return;
        }
        try {
            await fetchData('registerDevice', { fcmToken: token, platform: 'android' });
        } catch {
            // useLazyFetch muestra el error
        }
    }, [fetchData]);

    useEffect(() => {
        if (logued && pendingFcmTokenRef.current) {
            registerFcmToken(pendingFcmTokenRef.current);
            pendingFcmTokenRef.current = null;
        }
    }, [logued]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const toast = (msg) => {
            if (isRunningInWebView() && typeof Android !== 'undefined' && typeof Android.showToast === 'function') {
                Android.showToast(msg, 3000);
            } else {
                console.warn(msg);
            }
        };

        window.onFcmTokenReceived = (token) => {
            registerFcmToken(token);
        };

        window.onBiometricEnabled = async (bioToken) => {
            try {
                const response = await fetchData('registerBiometric', { bioToken });
                if (!response?.status) {
                    toast(response?.message || 'No se pudo registrar la biometría');
                }
            } catch {
                // useLazyFetch muestra el error
            }
        };

        window.onBiometricAuth = async (nickname, bioToken) => {
            try {
                const response = await fetchData('loginBiometric', { nickname, bioToken });
                if (response?.status) {
                    setSessionData(response.data);
                    setSession(response.data);
                } else {
                    toast(response?.message || 'No se pudo iniciar sesión');
                }
            } catch {
                // useLazyFetch muestra el error
            }
        };

        window.onBiometricError = (msg) => {
            toast(msg);
        };

        return () => {
            delete window.onFcmTokenReceived;
            delete window.onBiometricEnabled;
            delete window.onBiometricAuth;
            delete window.onBiometricError;
        };
    }, [fetchData, registerFcmToken]);

    const mainWindowStyles = {
        width: "100%",
        height: "calc(100vh - 50px)",
        overflowX: "hidden",
        overflowY: "hidden",
    };

    return (
        <>
            <CoreHeader
                sessionData={session}
                moduleName={moduleName}
            />
            <div style={mainWindowStyles}>
                {logued ? <Engine setSession={setSession} /> : <Login setSession={setSession} />}
            </div>
        </>
    )
}

export default App

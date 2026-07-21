
import { useEffect, useRef, useState } from "react";
import { LuLogIn, LuFingerprint } from "react-icons/lu";
import { ENTRY_MODE, COLOR_MAP } from "../../util/constants";
import { CoreWindow, CoreGroup, CoreText, CorePassword, CoreVSep, CoreButton } from "../../components";
import useLazyFetch from "../../hooks/useLazyFetch/useLazyFetch";
import micarritoLogo from "../../assets/micarrito_logo.png";
import { setSessionData, setBackHandler, clearBackHandler, isRunningInWebView } from '../../util/util';

const Login = ({ setSession }) => {
    const { fetchData, BackdropLoader, ErrorModal } = useLazyFetch();

    const [loginData, setLoginData] = useState({
        nickname: "",
        pwd: "",
    });
    const [bioAvailable, setBioAvailable] = useState(false);

    const nicknameRef = useRef(null);

    useEffect(() => {
        nicknameRef.current?.focus();
    }, []);

    useEffect(() => {
        if (isRunningInWebView() && typeof Android !== 'undefined' && typeof Android.isBiometricAvailable === 'function') {
            try {
                if (typeof Android.getBiometricDiag === 'function') {
                    console.log('[Biometric Diag]', Android.getBiometricDiag());
                }
                const available = Android.isBiometricAvailable();
                console.log('[Biometric] isBiometricAvailable:', available);
                if (available) {
                    setBioAvailable(true); // eslint-disable-line react-hooks/set-state-in-effect
                }
            } catch (e) {
                console.log('[Biometric] check error:', e);
            }
        }
    }, []);

    useEffect(() => {
        setBackHandler(() => {
            if (isRunningInWebView() && typeof Android !== 'undefined') {
                Android.onBackPressed();
            }
        });
        return () => clearBackHandler();
    }, []);

    const loginMainContainerStyles = {
        width: "100%",
        height: "calc(100vh - 50px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "25px 20px",
    };

    const Styles = {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: "20px",
    };

    const logoStyles = {
        height: "120px",
    };

    const handleLogin = async () => {
        if (loginData.nickname.trim() === "") {
            return;
        }
        if (loginData.pwd.trim() === "") {
            return;
        }

        try {
            const response = await fetchData("login", loginData);
            if (!response?.status) {
                return;
            }

            const newSessionData = response.data;

            setSessionData(newSessionData);

            setSession(newSessionData);

            if (
                isRunningInWebView()
                && typeof Android !== 'undefined'
                && typeof Android.enableBiometric === 'function'
                && !Android.isBiometricAvailable()
            ) {
                setTimeout(() => Android.enableBiometric(loginData.nickname.trim()), 500);
            }
        } catch {
            // intentionally empty
        }
    }

    return (
        <>
            <div style={loginMainContainerStyles}>
                <CoreWindow
                    icon={<LuLogIn />}
                    title="Acceso al Sistema"
                    width="350px"
                >
                    <div style={Styles}>
                        <img src={micarritoLogo} alt="MiCarrito Logo" style={logoStyles} />
                    </div>

                    <CoreGroup label="Credenciales del Usuario">
                        <CoreText
                            ref={nicknameRef}
                            label="Nombre de Usuario"
                            value={loginData.nickname}
                            onChange={(e) => setLoginData({ ...loginData, nickname: e.target.value })}
                            entryMode={ENTRY_MODE.LOWER}
                            ignoreFormState={true}
                            width={"100%"}
                        />
                        <CoreVSep />
                        <CorePassword
                            label="Contraseña"
                            value={loginData.pwd}
                            onChange={(e) => setLoginData({ ...loginData, pwd: e.target.value })}
                            onEnter={handleLogin}
                            entryMode={ENTRY_MODE.NORMAL}
                            ignoreFormState={true}
                            width={"100%"}
                        />
                        <CoreVSep size={20} />
                        <CoreButton
                            label="Iniciar Sesión"
                            icon={<LuLogIn />}
                            color={COLOR_MAP.success}
                            width={"100%"}
                            onClick={handleLogin}
                            ignoreFormState={true}
                        />
                        {bioAvailable && (
                            <>
                                <CoreVSep size={12} />
                                <CoreButton
                                    label="Entrar con huella"
                                    icon={<LuFingerprint />}
                                    color={COLOR_MAP.info}
                                    width={"100%"}
                                    onClick={() => {
                                        if (isRunningInWebView() && typeof Android !== 'undefined' && typeof Android.authenticateBiometric === 'function') {
                                            Android.authenticateBiometric();
                                        }
                                    }}
                                    ignoreFormState={true}
                                />
                            </>
                        )}
                    </CoreGroup>
                </CoreWindow>
            </div>
            <BackdropLoader />
            <ErrorModal />
        </>
    );
};

export default Login;

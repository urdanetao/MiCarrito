
import { useEffect, useRef, useState } from "react";
import { LuLogIn } from "react-icons/lu";
import { ENTRY_MODE, COLOR_MAP } from "../../util/constants";
import { CoreWindow, CoreGroup, CoreText, CorePassword, CoreVSep, CoreButton } from "../../components";
import useLazyFetch from "../../hooks/useLazyFetch/useLazyFetch";
import micarritoLogo from "../../assets/micarrito_logo.png";
import { setSessionData } from '../../util/util';

const Login = ({ setSession }) => {
    const { fetchData, BackdropLoader, ErrorModal } = useLazyFetch();

    const [loginData, setLoginData] = useState({
        nickname: "",
        pwd: "",
    });

    const nicknameRef = useRef(null);

    useEffect(() => {
        nicknameRef.current?.focus();
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
                            color={COLOR_MAP.success}
                            width={"100%"}
                            onClick={handleLogin}
                            ignoreFormState={true}
                        />
                    </CoreGroup>
                </CoreWindow>
            </div>
            <BackdropLoader />
            <ErrorModal />
        </>
    );
};

export default Login;

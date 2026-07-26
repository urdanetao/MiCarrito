import { useState, useRef, useEffect } from 'react';
import { IoArrowBack, IoCheckmark, IoPersonAdd } from 'react-icons/io5';
import { CoreText, CorePassword, CoreToggle, CoreButtonSquare, CoreModal, CoreWindow, CoreGroup, CoreVSep } from '../../components';
import { ENTRY_MODE } from '../../util/constants';

const CONFIG_COLOR = '#1976d2';

const ModalCrearUsuario = ({ open, onClose, onSave }) => {
    const nicknameRef = useRef(null);
    const [nickname, setNickname] = useState('');
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [pwd, setPwd] = useState('');
    const [admin, setAdmin] = useState('0');
    const [error, setError] = useState('');

    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (open) {
            setNickname('');
            setNombre('');
            setEmail('');
            setPwd('');
            setAdmin('0');
            setError('');
            const timer = setTimeout(() => { nicknameRef.current?.focus(); }, 100);
            return () => clearTimeout(timer);
        }
    }, [open]);
    /* eslint-enable react-hooks/set-state-in-effect */

    const handleSave = (closeModal) => {
        if (nickname.trim() === '') {
            setError('Debe indicar el nombre de usuario');
            return;
        }
        if (pwd === '') {
            setError('Debe indicar la contrasena');
            return;
        }
        if (pwd.length < 4) {
            setError('La contrasena debe tener al menos 4 caracteres');
            return;
        }
        setError('');
        onSave({
            nickname: nickname.trim(),
            nombre: nombre.trim(),
            email: email.trim(),
            pwd,
            admin: admin === '1' ? 1 : 0,
        }, closeModal);
    };

    return (
        <CoreModal
            open={open}
            onClose={onClose}
            closeOnOverlayClick={false}
            contentStyle={{ maxWidth: '400px', width: '100%' }}
        >
            {({ closeModal }) => (
                <CoreWindow
                    icon={<IoPersonAdd size={20} color="#fff" />}
                    title="Crear usuario"
                    color={CONFIG_COLOR}
                >
                    <CoreGroup label="Datos del usuario">
                        <CoreText
                            ref={nicknameRef}
                            label="Nombre de usuario"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            width="100%"
                            maxLength={30}
                            entryMode={ENTRY_MODE.LOWER}
                            ignoreFormState={true}
                        />
                        <CoreVSep size={10} />
                        <CoreText
                            label="Nombre"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            width="100%"
                            maxLength={60}
                            entryMode={ENTRY_MODE.UPPER}
                            ignoreFormState={true}
                        />
                        <CoreVSep size={10} />
                        <CoreText
                            label="Correo electronico"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            width="100%"
                            maxLength={120}
                            entryMode={ENTRY_MODE.LOWER}
                            ignoreFormState={true}
                        />
                        <CoreVSep size={10} />
                        <CorePassword
                            label="Contrasena"
                            value={pwd}
                            onChange={(e) => setPwd(e.target.value)}
                            width="100%"
                            ignoreFormState={true}
                        />
                        <CoreVSep size={18} />
                        <CoreToggle
                            label="Administrador"
                            value={admin}
                            onChange={(e) => setAdmin(e.target.value)}
                            width="100%"
                            ignoreFormState={true}
                        />
                        {error !== '' && (
                            <div style={{ fontSize: '12px', color: '#d32f2f', marginTop: '4px' }}>
                                {error}
                            </div>
                        )}
                    </CoreGroup>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                        <CoreButtonSquare icon={<IoArrowBack size={18} />} color="#6b7280" onClick={() => closeModal()} ignoreFormState={true} />
                        <CoreButtonSquare icon={<IoCheckmark size={18} />} color={CONFIG_COLOR} onClick={() => handleSave(closeModal)} ignoreFormState={true} />
                    </div>
                </CoreWindow>
            )}
        </CoreModal>
    );
};

export default ModalCrearUsuario;

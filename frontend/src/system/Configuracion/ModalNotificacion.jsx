import { useState, useRef, useEffect } from 'react';
import { IoArrowBack, IoCheckmark, IoSend } from 'react-icons/io5';
import { CoreText, CoreButtonSquare, CoreModal, CoreWindow, CoreGroup } from '../../components';
import { ENTRY_MODE } from '../../util/constants';

const CONFIG_COLOR = '#00bcd4';

const ModalNotificacion = ({ open, onClose, onSend }) => {
    const nicknameRef = useRef(null);
    const [nickname, setNickname] = useState('');
    const [error, setError] = useState('');

    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (open) {
            setNickname('');
            setError('');
            const timer = setTimeout(() => { nicknameRef.current?.focus(); }, 100);
            return () => clearTimeout(timer);
        }
    }, [open]);
    /* eslint-enable react-hooks/set-state-in-effect */

    const handleSend = (closeModal) => {
        if (nickname.trim() === '') {
            setError('Debe indicar el nombre de usuario');
            return;
        }
        setError('');
        onSend({ nickname: nickname.trim() }, closeModal);
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
                    icon={<IoSend size={20} color="#fff" />}
                    title="Notificacion de prueba"
                    color={CONFIG_COLOR}
                >
                    <CoreGroup label="Enviar a">
                        <CoreText
                            ref={nicknameRef}
                            label="Nombre de usuario destino"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            width="100%"
                            maxLength={30}
                            entryMode={ENTRY_MODE.LOWER}
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
                        <CoreButtonSquare icon={<IoCheckmark size={18} />} color={CONFIG_COLOR} onClick={() => handleSend(closeModal)} ignoreFormState={true} />
                    </div>
                </CoreWindow>
            )}
        </CoreModal>
    );
};

export default ModalNotificacion;

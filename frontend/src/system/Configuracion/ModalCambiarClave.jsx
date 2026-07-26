import { useState, useRef, useEffect } from 'react';
import { IoArrowBack, IoCheckmark } from 'react-icons/io5';
import { TbLockPassword } from 'react-icons/tb';
import { CorePassword, CoreButtonSquare, CoreModal, CoreWindow, CoreGroup } from '../../components';

const CONFIG_COLOR = '#1976d2';

const ModalCambiarClave = ({ open, onClose, onSave }) => {
    const actualRef = useRef(null);
    const [actual, setActual] = useState('');
    const [nueva, setNueva] = useState('');
    const [confirmacion, setConfirmacion] = useState('');
    const [error, setError] = useState('');

    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (open) {
            setActual('');
            setNueva('');
            setConfirmacion('');
            setError('');
            const timer = setTimeout(() => { actualRef.current?.focus(); }, 100);
            return () => clearTimeout(timer);
        }
    }, [open]);
    /* eslint-enable react-hooks/set-state-in-effect */

    const handleSave = (closeModal) => {
        if (actual.trim() === '' || nueva.trim() === '' || confirmacion.trim() === '') {
            setError('Debe completar todos los campos');
            return;
        }
        if (nueva !== confirmacion) {
            setError('La nueva clave y su confirmación no coinciden');
            return;
        }
        setError('');
        onSave({ actual, nueva, confirmacion }, closeModal);
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
                    icon={<TbLockPassword size={20} color="#fff" />}
                    title="Cambiar contrasena"
                    color={CONFIG_COLOR}
                >
                    <CoreGroup label="Datos de la cuenta">
                        <CorePassword
                            ref={actualRef}
                            label="Clave actual"
                            value={actual}
                            onChange={(e) => setActual(e.target.value)}
                            width="100%"
                            ignoreFormState={true}
                        />
                        <CorePassword
                            label="Nueva clave"
                            value={nueva}
                            onChange={(e) => setNueva(e.target.value)}
                            width="100%"
                            ignoreFormState={true}
                        />
                        <CorePassword
                            label="Confirmar clave"
                            value={confirmacion}
                            onChange={(e) => setConfirmacion(e.target.value)}
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

export default ModalCambiarClave;

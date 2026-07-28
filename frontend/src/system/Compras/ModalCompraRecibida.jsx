import { IoArrowBack, IoLockClosed, IoCheckmark, IoClose } from 'react-icons/io5';
import { CoreButtonSquare, CoreModal, CoreWindow, CoreGroup } from '../../components';
import { showConfirm } from '../../components/CoreConfirm/CoreConfirm';
import useLazyFetch from '../../hooks/useLazyFetch/useLazyFetch';

const COMPRA_COLOR = '#f57c00';

const ModalCompraRecibida = ({ open, onClose, compra, onResponded }) => {
    const { fetchData } = useLazyFetch();

    const handleAceptar = async (closeModal) => {
        try {
            const response = await fetchData('aceptarComparticion', { idcompra: compra.id });
            if (response?.status) {
                closeModal();
                if (typeof onResponded === 'function') {
                    onResponded();
                }
            }
        } catch {
            // el error lo muestra useLazyFetch
        }
    };

    const handleRechazar = async (closeModal) => {
        showConfirm({
            text: `¿Rechazar la compra "${compra.descrip}"?\nEsta accion no se puede deshacer.`,
            okLabel: 'Rechazar',
            cancelLabel: 'Cancelar',
            color: '#d32f2f',
            okAction: async () => {
                try {
                    const response = await fetchData('rechazarComparticion', { idcompra: compra.id });
                    if (response?.status) {
                        closeModal();
                        if (typeof onResponded === 'function') {
                            onResponded();
                        }
                    }
                } catch {
                    // el error lo muestra useLazyFetch
                }
            },
        });
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
                    icon={<IoLockClosed size={20} color="#fff" />}
                    title="Compra Recibida"
                    color={COMPRA_COLOR}
                >
                    <CoreGroup label="Detalles">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                                {compra.descrip}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>De:</span>
                                <span style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b' }}>{compra.remitente}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>Fecha:</span>
                                <span style={{ fontSize: '12px', color: '#1e293b' }}>{compra.fecha}</span>
                            </div>
                        </div>
                    </CoreGroup>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                        <CoreButtonSquare icon={<IoArrowBack size={18} />} color="#6b7280" onClick={() => closeModal()} ignoreFormState={true} title="Cerrar" />
                        <CoreButtonSquare icon={<IoClose size={18} />} color="#d32f2f" onClick={() => handleRechazar(closeModal)} ignoreFormState={true} title="Rechazar" />
                        <CoreButtonSquare icon={<IoCheckmark size={18} />} color="#16a34a" onClick={() => handleAceptar(closeModal)} ignoreFormState={true} title="Aceptar" />
                    </div>
                </CoreWindow>
            )}
        </CoreModal>
    );
};

export default ModalCompraRecibida;

import { IoCartOutline, IoCopy } from 'react-icons/io5';
import { CoreModal, CoreWindow, CoreGroup } from '../../components';

const COMPRA_COLOR = '#7b1fa2';

const ModalCopiar = ({ open, onClose, comprasCopiar, onCopiar }) => {
    return (
        <CoreModal
            open={open}
            onClose={onClose}
            closeOnOverlayClick={false}
            contentStyle={{ maxWidth: '400px', width: '100%' }}
        >
            {() => (
                <CoreWindow
                    icon={<IoCopy size={20} color="#fff" />}
                    title="Copiar Categoria"
                    color={COMPRA_COLOR}
                >
                    <CoreGroup label="Seleccionar destino">
                        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '10px' }}>Seleccione la compra destino:</div>
                        {comprasCopiar.length === 0 ? (
                            <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '20px' }}>No hay otras compras</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
                                {comprasCopiar.map((c) => (
                                    <div
                                        key={c.id}
                                        style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'background-color 0.15s' }}
                                        onClick={() => onCopiar(c.id)}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
                                    >
                                        <IoCartOutline size={16} color={COMPRA_COLOR} />
                                        <div style={{ flex: 1, fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>{c.descrip}</div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{c.fecha}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CoreGroup>
                </CoreWindow>
            )}
        </CoreModal>
    );
};

export default ModalCopiar;

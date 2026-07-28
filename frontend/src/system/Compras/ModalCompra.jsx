import { useRef, useEffect } from 'react';
import { IoArrowBack, IoCheckmark, IoCart } from 'react-icons/io5';
import { ENTRY_MODE } from '../../util/constants';
import { CoreText, CoreButtonSquare, CoreModal, CoreSelect, CoreWindow, CoreGroup, CoreVSep } from '../../components';

const COMPRA_COLOR = '#7b1fa2';

const ModalCompra = ({ open, onClose, compraEditId, compraFecha, setCompraFecha, compraDescripcion, setCompraDescripcion, compraMonedaId, setCompraMonedaId, monedas, onSave, onKeyDown }) => {
    const compraDescRef = useRef(null);

    useEffect(() => {
        if (open && compraDescRef.current) {
            const timer = setTimeout(() => { compraDescRef.current?.focus(); }, 100);
            return () => clearTimeout(timer);
        }
    }, [open]);

    return (
        <CoreModal
            open={open}
            onClose={onClose}
            closeOnOverlayClick={false}
            contentStyle={{ maxWidth: '400px', width: '100%' }}
        >
            {({ closeModal }) => (
                <CoreWindow
                    icon={<IoCart size={20} color="#fff" />}
                    title={compraEditId > 0 ? 'Editar Compra' : 'Nueva Compra'}
                    color={COMPRA_COLOR}
                >
                    <CoreGroup label="Datos de la compra">
                        <CoreText
                            ref={compraDescRef}
                            label="Fecha"
                            value={compraFecha}
                            onChange={(e) => setCompraFecha(e.target.value)}
                            onKeyDown={onKeyDown}
                            entryMode={ENTRY_MODE.NORMAL}
                            width="100%"
                            ignoreFormState={true}
                        />
                        <CoreVSep />
                        <CoreText
                            label="Descripcion"
                            value={compraDescripcion}
                            onChange={(e) => setCompraDescripcion(e.target.value)}
                            onKeyDown={onKeyDown}
                            entryMode={ENTRY_MODE.UPPER}
                            maxLength={50}
                            width="100%"
                            ignoreFormState={true}
                        />
                        <CoreVSep />
                        <CoreSelect
                            label="Moneda"
                            value={compraMonedaId}
                            onChange={(e) => setCompraMonedaId(e.target.value)}
                            options={monedas.map((m) => ({ value: String(m.id), label: `${m.simbolo} ${m.nombre} (${m.siglas})` }))}
                            width="100%"
                            ignoreFormState={true}
                        />
                    </CoreGroup>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                        <CoreButtonSquare icon={<IoArrowBack size={18} />} color="#6b7280" onClick={() => closeModal()} ignoreFormState={true} />
                        <CoreButtonSquare icon={<IoCheckmark size={18} />} color={COMPRA_COLOR} onClick={onSave} ignoreFormState={true} />
                    </div>
                </CoreWindow>
            )}
        </CoreModal>
    );
};

export default ModalCompra;

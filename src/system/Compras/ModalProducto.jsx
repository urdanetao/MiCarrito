import { useRef, useEffect } from 'react';
import { IoArrowBack, IoCheckmark, IoAdd } from 'react-icons/io5';
import { IoCreate } from 'react-icons/io5';
import { ENTRY_MODE } from '../../util/constants';
import { CoreText, CoreNumber, CoreButtonSquare, CoreModal, CoreSuggest, CoreToggle, CoreVSep, CoreGroup, CoreWindow } from '../../components';

const PRODUCTO_COLOR = '#1976d2';

const ModalProducto = ({ open, onClose, isAddingNew, productoNombre, setProductoNombre, productoCantidad, setProductoCantidad, productoPrecio, setProductoPrecio, productoCategoriaId, setProductoCategoriaId, productoComprado, setProductoComprado, allCategorias, onSave }) => {
    const productoNombreRef = useRef(null);
    const productoCategoriaRef = useRef(null);
    const productoCloseModalRef = useRef(null);

    useEffect(() => {
        if (open && productoNombreRef.current) {
            const timer = setTimeout(() => { productoNombreRef.current?.focus(); }, 100);
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
            {({ closeModal }) => {
                productoCloseModalRef.current = closeModal;
                return (
                    <CoreWindow
                        icon={isAddingNew ? <IoAdd size={20} color="#fff" /> : <IoCreate size={20} color="#fff" />}
                        title={isAddingNew ? 'Nuevo Producto' : 'Editar Producto'}
                        color={PRODUCTO_COLOR}
                    >
                        <CoreGroup label="Nuevo producto">
                            <CoreSuggest
                                ref={productoCategoriaRef}
                                label="Categoria"
                                value={productoCategoriaId ? String(productoCategoriaId) : ''}
                                onChange={(e) => setProductoCategoriaId(e.target.value ? parseInt(e.target.value, 10) : '')}
                                options={allCategorias}
                                fieldId="id"
                                displayField="descrip"
                                filterFields="descrip"
                                width="100%"
                                ignoreFormState={true}
                            />
                            <CoreVSep size={6} />
                            <CoreText
                                ref={productoNombreRef}
                                label="Nombre"
                                value={productoNombre}
                                onChange={(e) => setProductoNombre(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') onSave(productoCloseModalRef.current);
                                }}
                                entryMode={ENTRY_MODE.UPPER}
                                maxLength={50}
                                width="100%"
                                ignoreFormState={true}
                            />
                            <CoreVSep size={6} />
                            <CoreNumber
                                label="Cantidad"
                                value={productoCantidad}
                                onChange={(e) => setProductoCantidad(e.target.value)}
                                decimals={0}
                                thousandSep={true}
                                width="100%"
                                ignoreFormState={true}
                            />
                            <CoreVSep size={6} />
                            <CoreNumber
                                label="Precio"
                                value={productoPrecio}
                                onChange={(e) => setProductoPrecio(e.target.value)}
                                decimals={2}
                                thousandSep={true}
                                width="100%"
                                ignoreFormState={true}
                            />
                            <CoreVSep size={6} />
                            <div style={{ marginTop: '8px' }}>
                                <CoreToggle
                                    label="Comprado"
                                    value={productoComprado}
                                    onChange={(e) => setProductoComprado(e.target.value)}
                                    ignoreFormState={true}
                                />
                            </div>
                        </CoreGroup>
                        <CoreVSep size={12} />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <CoreButtonSquare icon={<IoArrowBack size={18} />} color="#6b7280" onClick={() => closeModal()} ignoreFormState={true} />
                            <CoreButtonSquare icon={<IoCheckmark size={18} />} color={PRODUCTO_COLOR} onClick={() => onSave(closeModal)} ignoreFormState={true} />
                        </div>
                    </CoreWindow>
                );
            }}
        </CoreModal>
    );
};

export default ModalProducto;

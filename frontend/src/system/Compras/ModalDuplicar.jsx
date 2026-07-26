import { IoArrowBack, IoCheckmark, IoCopy } from 'react-icons/io5';
import { ENTRY_MODE } from '../../util/constants';
import { CoreText, CoreButtonSquare, CoreModal, CoreWindow, CoreGroup } from '../../components';

const COMPRA_COLOR = '#7b1fa2';

const ModalDuplicar = ({ open, onClose, duplicarFecha, setDuplicarFecha, duplicarDescripcion, setDuplicarDescripcion, onSave }) => {
    return (
        <CoreModal
            open={open}
            onClose={onClose}
            closeOnOverlayClick={false}
            contentStyle={{ maxWidth: '400px', width: '100%' }}
        >
            {({ closeModal }) => (
                <CoreWindow
                    icon={<IoCopy size={20} color="#fff" />}
                    title="Duplicar Compra"
                    color={COMPRA_COLOR}
                >
                    <CoreGroup label="Nueva compra">
                        <CoreText
                            label="Fecha"
                            value={duplicarFecha}
                            onChange={(e) => setDuplicarFecha(e.target.value)}
                            entryMode={ENTRY_MODE.NORMAL}
                            width="100%"
                            ignoreFormState={true}
                        />
                        <CoreText
                            label="Descripcion"
                            value={duplicarDescripcion}
                            onChange={(e) => setDuplicarDescripcion(e.target.value)}
                            entryMode={ENTRY_MODE.UPPER}
                            maxLength={50}
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

export default ModalDuplicar;

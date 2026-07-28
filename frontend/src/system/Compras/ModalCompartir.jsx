import { useState, useRef, useEffect, useCallback } from 'react';
import { IoArrowBack, IoCheckmark, IoShareOutline, IoStar } from 'react-icons/io5';
import { CoreText, CoreButtonSquare, CoreModal, CoreWindow, CoreGroup, CoreToggle, CoreMenuPopup, CoreVSep } from '../../components';
import { ENTRY_MODE } from '../../util/constants';
import useLazyFetch from '../../hooks/useLazyFetch/useLazyFetch';

const COMPRA_COLOR = '#7b1fa2';

const ModalCompartir = ({ open, onClose, compra, onShared }) => {
    const { fetchData } = useLazyFetch();
    const nicknameRef = useRef(null);
    const [nickname, setNickname] = useState('');
    const [addToFavorito, setAddToFavorito] = useState('0');
    const [favoritos, setFavoritos] = useState([]);
    const [showFavPopup, setShowFavPopup] = useState(false);
    const [error, setError] = useState('');

    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (open) {
            setNickname('');
            setAddToFavorito('0');
            setError('');
            setShowFavPopup(false);
            const timer = setTimeout(() => { nicknameRef.current?.focus(); }, 100);
            return () => clearTimeout(timer);
        }
    }, [open]);
    /* eslint-enable react-hooks/set-state-in-effect */

    const loadFavoritos = useCallback(async () => {
        try {
            const response = await fetchData('getFavoritos', {});
            if (response?.status && Array.isArray(response.data)) {
                setFavoritos(response.data);
            }
        } catch {
            // silently fail
        }
    }, [fetchData]);

    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (open) {
            loadFavoritos();
        }
    }, [open, loadFavoritos]);
    /* eslint-enable react-hooks/set-state-in-effect */

    const handleFavSelect = (fav) => {
        setNickname(fav.nickname);
        setShowFavPopup(false);
        setError('');
    };

    const handleShare = async (closeModal) => {
        const nick = nickname.trim();
        if (nick === '') {
            setError('Debe indicar el nombre de usuario');
            return;
        }
        setError('');

        try {
            const response = await fetchData('shareCompra', {
                idcompra: compra.id,
                nickname: nick,
                addToFavorito: addToFavorito === '1',
            });
            if (response?.status) {
                closeModal();
                if (typeof onShared === 'function') {
                    onShared();
                }
            }
        } catch {
            // el error lo muestra useLazyFetch
        }
    };

    return (
        <>
        <CoreModal
            open={open}
            onClose={onClose}
            closeOnOverlayClick={false}
            contentStyle={{ maxWidth: '400px', width: '100%' }}
        >
            {({ closeModal }) => (
                <CoreWindow
                    icon={<IoShareOutline size={20} color="#fff" />}
                    title="Compartir Compra"
                    color={COMPRA_COLOR}
                >
                    <CoreGroup label="Enviar a">
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <CoreText
                                    ref={nicknameRef}
                                    label="Nombre de usuario"
                                    value={nickname}
                                    onChange={(e) => { setNickname(e.target.value); setError(''); }}
                                    width="100%"
                                    maxLength={30}
                                    entryMode={ENTRY_MODE.LOWER}
                                    ignoreFormState={true}
                                />
                            </div>
                            <CoreButtonSquare
                                icon={<IoStar size={16} />}
                                color="#f57c00"
                                onClick={() => {
                                    if (favoritos.length > 0) {
                                        setShowFavPopup(!showFavPopup);
                                    }
                                }}
                                ignoreFormState={true}
                                style={{ width: '36px', height: '36px', flexShrink: 0 }}
                            />
                        </div>
                        {error !== '' && (
                            <div style={{ fontSize: '12px', color: '#d32f2f', marginTop: '4px' }}>
                                {error}
                            </div>
                        )}
                        <CoreVSep size={15} />
                        <CoreToggle
                            label="Agregar a favoritos"
                            value={addToFavorito}
                            onChange={(e) => setAddToFavorito(e.target.value)}
                            ignoreFormState={true}
                        />
                    </CoreGroup>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                        <CoreButtonSquare icon={<IoArrowBack size={18} />} color="#6b7280" onClick={() => closeModal()} ignoreFormState={true} />
                        <CoreButtonSquare icon={<IoCheckmark size={18} />} color={COMPRA_COLOR} onClick={() => handleShare(closeModal)} ignoreFormState={true} />
                    </div>
                </CoreWindow>
            )}
        </CoreModal>

        <CoreMenuPopup
            open={showFavPopup}
            onClose={() => setShowFavPopup(false)}
            items={[
                ...favoritos.map((fav) => ({
                    icon: <IoStar size={16} color="#f57c00" />,
                    label: fav.nickname,
                    onClick: () => handleFavSelect(fav),
                })),
                { label: 'Cancelar', color: '#d32f2f', onClick: () => {} },
            ]}
        />
        </>
    );
};

export default ModalCompartir;

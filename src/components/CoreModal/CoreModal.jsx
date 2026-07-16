import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    acquireModalLayerOrder,
    releaseModalLayerOrder,
    resolveModalLayerZIndex,
} from '../../util/modalStack';

const CORE_MODAL_STYLES = {
    dialog: {
        position: 'fixed',
        inset: 0,
        width: '100vw',
        maxWidth: '100vw',
        height: '100vh',
        maxHeight: '100vh',
        margin: 0,
        padding: '20px',
        border: 'none',
        background: 'rgba(15, 23, 42, 0.42)',
        overflow: 'visible',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        width: 'fit-content',
        maxWidth: 'min(96vw, 1280px)',
        maxHeight: 'calc(100vh - 40px)',
        overflowY: 'auto',
    },
};

const MODAL_DIALOG_STYLE_ID = 'core-modal-dialog-styles';
const MODAL_DIALOG_STYLE_CONTENT = `
.core-modal-dialog::backdrop {
    background-color: rgba(15, 23, 42, 0.42);
}
`;

const ensureDialogStyles = () => {
    if (typeof document === 'undefined') {
        return;
    }

    if (document.getElementById(MODAL_DIALOG_STYLE_ID)) {
        return;
    }

    const style = document.createElement('style');
    style.id = MODAL_DIALOG_STYLE_ID;
    style.textContent = MODAL_DIALOG_STYLE_CONTENT;
    document.head.appendChild(style);
};

const openNativeDialog = (dialogElement) => {
    if (!dialogElement) {
        return;
    }

    if (typeof dialogElement.show === 'function') {
        if (!dialogElement.open) {
            try {
                dialogElement.show();
            } catch {
                dialogElement.setAttribute('open', 'true');
            }
        }
        return;
    }

    dialogElement.setAttribute('open', 'true');
};

const closeNativeDialog = (dialogElement) => {
    if (!dialogElement) {
        return;
    }

    if (typeof dialogElement.close === 'function') {
        if (dialogElement.open) {
            dialogElement.close();
        }
        return;
    }

    dialogElement.removeAttribute('open');
};

const CoreModal = ({
    open = false,
    onClose,
    onResolve,
    children,
    closeOnOverlayClick = true,
    closeOnEscape = true,
    autoCloseOnResolve = true,
    zIndex = 1300,
    ariaLabel = 'Dialogo',
    overlayStyle,
    contentStyle,
}) => {
    const layerIdRef = useRef(Symbol('core-modal-layer'));
    const dialogRef = useRef(null);
    const [layerOrder, setLayerOrder] = useState(0);

    const closeModal = (payload) => {
        if (typeof onClose === 'function') {
            onClose(payload);
        }
    };

    const resolveModal = (payload) => {
        if (typeof onResolve === 'function') {
            onResolve(payload);
        }

        if (autoCloseOnResolve) {
            closeModal(payload);
        }
    };

    useEffect(() => {
        ensureDialogStyles();
    }, []);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const nextLayerOrder = acquireModalLayerOrder(layerIdRef.current);
        setLayerOrder(nextLayerOrder);

        return () => {
            releaseModalLayerOrder(layerIdRef.current);
        };
    }, [open]);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const dialogElement = dialogRef.current;
        openNativeDialog(dialogElement);

        return () => {
            closeNativeDialog(dialogElement);
        };
    }, [open, layerOrder]);

    const modalApi = {
        closeModal,
        resolveModal,
    };

    if (!open) {
        return null;
    }

    const resolvedContent = typeof children === 'function'
        ? children(modalApi)
        : children;
    const resolvedZIndex = resolveModalLayerZIndex(zIndex, layerOrder);

    return createPortal(
        <dialog
            ref={dialogRef}
            className="core-modal-dialog"
            style={{
                ...CORE_MODAL_STYLES.dialog,
                zIndex: resolvedZIndex,
                ...overlayStyle,
            }}
            role="presentation"
            aria-label={ariaLabel}
            onCancel={(event) => {
                event.preventDefault();
                if (closeOnEscape) {
                    closeModal();
                }
            }}
            onClick={(event) => {
                if (event.target !== event.currentTarget) {
                    return;
                }

                if (!closeOnOverlayClick) {
                    return;
                }

                closeModal();
            }}
        >
            <div
                style={{
                    ...CORE_MODAL_STYLES.content,
                    ...contentStyle,
                }}
                role="dialog"
                aria-modal="true"
                aria-label={ariaLabel}
                onClick={(event) => event.stopPropagation()}
            >
                {resolvedContent}
            </div>
        </dialog>,
        document.body,
    );
};

export default CoreModal;

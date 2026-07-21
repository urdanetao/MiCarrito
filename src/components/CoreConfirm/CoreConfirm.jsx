import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BsQuestionCircleFill } from "react-icons/bs";
import { COLOR_MAP } from "../../util/constants";
import {
    acquireModalLayerOrder,
    releaseModalLayerOrder,
    resolveModalLayerZIndex,
} from "../../util/modalStack";
import { pushModalBackHandler, popModalBackHandler } from "../../util/util";

let confirmDispatcher = null;
let confirmDismissHandler = null;
const pendingConfirmQueue = [];

// eslint-disable-next-line react-refresh/only-export-components
export const isConfirmOpen = () => {
    const dialog = document.querySelector('.core-confirm-dialog');
    return dialog?.open === true;
};

// eslint-disable-next-line react-refresh/only-export-components
export const dismissConfirm = () => {
    if (typeof confirmDismissHandler === 'function') {
        confirmDismissHandler();
    }
};

const EMPTY_ACTION = () => {};
const ANIMATION_TIME = 300;

const CORE_CONFIRM_STYLE_ID = "core-confirm-dialog-styles";
const CORE_CONFIRM_STYLE_CONTENT = `
.core-confirm-dialog::backdrop {
    background-color: rgba(15, 23, 42, 0.42);
}

@keyframes slideInScale {
    from {
        opacity: 0;
        transform: scale(0.95) translateY(-20px);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

@keyframes slideOutScale {
    from {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
    to {
        opacity: 0;
        transform: scale(0.95) translateY(-20px);
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

@keyframes fadeOut {
    from {
        opacity: 1;
    }
    to {
        opacity: 0;
    }
}
`;

const createInitialState = () => ({
    open: false,
    icon: <BsQuestionCircleFill size={28} />,
    text: "",
    okLabel: "Aceptar",
    cancelLabel: "Cancelar",
    okAction: EMPTY_ACTION,
    cancelAction: null,
    color: COLOR_MAP.warning,
    width: 520,
    zIndex: 1300,
});

const ensureConfirmStyles = () => {
    if (typeof document === "undefined") {
        return;
    }

    if (document.getElementById(CORE_CONFIRM_STYLE_ID)) {
        return;
    }

    const style = document.createElement("style");
    style.id = CORE_CONFIRM_STYLE_ID;
    style.textContent = CORE_CONFIRM_STYLE_CONTENT;
    document.head.appendChild(style);
};

const openNativeDialog = (dialogElement) => {
    if (!dialogElement) {
        return;
    }

    if (typeof dialogElement.show === "function") {
        if (!dialogElement.open) {
            try {
                dialogElement.show();
            } catch {
                dialogElement.setAttribute("open", "true");
            }
        }
        return;
    }

    dialogElement.setAttribute("open", "true");
};

const closeNativeDialog = (dialogElement) => {
    if (!dialogElement) {
        return;
    }

    if (typeof dialogElement.close === "function") {
        if (dialogElement.open) {
            dialogElement.close();
        }
        return;
    }

    dialogElement.removeAttribute("open");
};

const runActionSafely = (action) => {
    try {
        const result = action?.();
        if (result && typeof result.then === "function") {
            result.catch((error) => {
                console.error("CoreConfirm action error:", error);
            });
        }
    } catch (error) {
        console.error("CoreConfirm action error:", error);
    }
};

const flushPendingConfirmQueue = () => {
    if (typeof confirmDispatcher !== "function") {
        return;
    }

    while (pendingConfirmQueue.length > 0) {
        const payload = pendingConfirmQueue.shift();
        confirmDispatcher(payload);
    }
};

// eslint-disable-next-line react-refresh/only-export-components
export const showConfirm = ({
    icon = <BsQuestionCircleFill size={28} />,
    text = "",
    okLabel = "Aceptar",
    okAction = EMPTY_ACTION,
    cancelLabel = "Cancelar",
    cancelAction,
    color = COLOR_MAP.warning,
    width = 520,
    zIndex = 1300,
} = {}) => {
    const payload = {
        icon,
        text,
        okLabel,
        okAction: typeof okAction === "function" ? okAction : EMPTY_ACTION,
        cancelLabel,
        cancelAction: typeof cancelAction === "function" ? cancelAction : null,
        color,
        width,
        zIndex,
    };

    if (typeof confirmDispatcher !== "function") {
        pendingConfirmQueue.push(payload);
        return;
    }

    confirmDispatcher(payload);
};

const CoreConfirm = () => {
    const [confirmState, setConfirmState] = useState(createInitialState);
    const [isClosing, setIsClosing] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const [layerOrder, setLayerOrder] = useState(0);
    const layerIdRef = useRef(Symbol("core-confirm-layer"));
    const dialogRef = useRef(null);

    useLayoutEffect(() => {
        const handleShow = (payload) => {
            setConfirmState({
                ...createInitialState(),
                ...payload,
                open: true,
            });
        };

        const handleDismiss = () => {
            setConfirmState((previous) => ({ ...previous, open: false }));
        };

        confirmDispatcher = handleShow;
        confirmDismissHandler = handleDismiss;
        flushPendingConfirmQueue();

        return () => {
            if (confirmDispatcher === handleShow) {
                confirmDispatcher = null;
            }
            if (confirmDismissHandler === handleDismiss) {
                confirmDismissHandler = null;
            }
        };
    }, []);

    useEffect(() => {
        ensureConfirmStyles();
    }, []);

    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (confirmState.open) {
            setShouldRender(true);
            setIsClosing(false);
        } else if (shouldRender) {
            setIsClosing(true);
            const timer = setTimeout(() => {
                setShouldRender(false);
                setIsClosing(false);
            }, ANIMATION_TIME);
            return () => clearTimeout(timer);
        }

        return undefined;
    }, [confirmState.open, shouldRender]);
    /* eslint-enable react-hooks/set-state-in-effect */

    useEffect(() => {
        if (!confirmState.open) {
            return undefined;
        }

        const layerId = layerIdRef.current;
        const nextLayerOrder = acquireModalLayerOrder(layerId);
        setLayerOrder(nextLayerOrder);

        return () => {
            releaseModalLayerOrder(layerId);
        };
    }, [confirmState.open]);

    useEffect(() => {
        if (!shouldRender) {
            return undefined;
        }

        const dialogElement = dialogRef.current;
        openNativeDialog(dialogElement);

        return () => {
            closeNativeDialog(dialogElement);
        };
    }, [shouldRender, layerOrder]);

    useEffect(() => {
        if (!confirmState.open) {
            return undefined;
        }

        pushModalBackHandler(() => {
            setConfirmState((previous) => ({ ...previous, open: false }));
            runActionSafely(confirmState.cancelAction);
        });
        return () => {
            popModalBackHandler();
        };
    }, [confirmState.open]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!shouldRender) {
        return null;
    }

    const closeDialog = () => {
        setConfirmState((previous) => ({ ...previous, open: false }));
    };

    const handleCancel = () => {
        closeDialog();
        runActionSafely(confirmState.cancelAction);
    };

    const handleConfirm = () => {
        closeDialog();
        runActionSafely(confirmState.okAction);
    };

    const resolvedZIndex = resolveModalLayerZIndex(confirmState.zIndex, layerOrder);

    const dialogStyles = {
        position: "fixed",
        inset: 0,
        width: "100vw",
        maxWidth: "100vw",
        height: "100vh",
        maxHeight: "100vh",
        margin: 0,
        padding: "20px",
        border: "none",
        background: "rgba(15, 23, 42, 0.42)",
        overflow: "visible",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: resolvedZIndex,
        animation: isClosing ? "fadeOut 0.3s ease forwards" : "fadeIn 0.3s ease forwards",
    };

    const modalStyles = {
        width: "100%",
        maxWidth: typeof confirmState.width === "number" ? `${confirmState.width}px` : confirmState.width,
        borderRadius: "10px",
        border: `1px solid ${confirmState.color || COLOR_MAP.warning}`,
        boxShadow: "0 18px 48px rgba(15, 23, 42, 0.24)",
        backgroundColor: "#fefefe",
        overflow: "hidden",
        animation: isClosing ? "slideOutScale 0.3s ease forwards" : "slideInScale 0.3s ease forwards",
    };

    const headerStyles = {
        backgroundColor: confirmState.color || COLOR_MAP.warning,
        color: "#fff",
        fontSize: "16px",
        padding: "10px 15px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
    };

    const bodyStyles = {
        padding: "20px",
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        alignItems: "flex-start",
        gap: "14px",
    };

    const contentIconStyles = {
        width: "46px",
        height: "46px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff7e6",
        color: confirmState.color || COLOR_MAP.warning,
        flexShrink: 0,
    };

    const messageStyles = {
        margin: 0,
        color: "#374151",
        fontSize: "14px",
        lineHeight: 1.5,
        overflow: "hidden",
        textOverflow: "ellipsis",
        display: "-webkit-box",
        WebkitLineClamp: 3,
        WebkitBoxOrient: "vertical",
        minHeight: "63px",
    };

    const actionsStyles = {
        display: "flex",
        justifyContent: "flex-end",
        gap: "15px",
        padding: "0 20px 20px",
    };

    const buttonBaseStyles = {
        border: "none",
        borderRadius: "4px",
        padding: "8px 16px",
        fontSize: "14px",
        minWidth: "96px",
        minHeight: "36px",
        cursor: "pointer",
        color: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        transition: "filter 0.18s ease",
    };

    const cancelButtonStyles = {
        ...buttonBaseStyles,
        backgroundColor: "#6b7280",
    };

    const confirmButtonStyles = {
        ...buttonBaseStyles,
        backgroundColor: confirmState.color || COLOR_MAP.warning,
    };

    return createPortal(
        <dialog
            ref={dialogRef}
            className="core-confirm-dialog"
            style={dialogStyles}
            onCancel={(event) => {
                event.preventDefault();
            }}
            onClick={(event) => {
                if (event.target === event.currentTarget) {
                    event.preventDefault();
                }
            }}
            aria-label="Confirmación requerida"
        >
            <div
                style={modalStyles}
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Confirmación requerida"
            >
                <div style={headerStyles}>
                    <BsQuestionCircleFill size={20} color="#fff" />
                    <span>Confirmación requerida</span>
                </div>

                <div style={bodyStyles}>
                    <div style={contentIconStyles}>{confirmState.icon}</div>
                    <p style={messageStyles}>{confirmState.text}</p>
                </div>

                <div style={actionsStyles}>
                    <button type="button" style={confirmButtonStyles} onClick={handleConfirm}>
                        {confirmState.okLabel}
                    </button>
                    <button type="button" style={cancelButtonStyles} onClick={handleCancel}>
                        {confirmState.cancelLabel}
                    </button>
                </div>
            </div>
        </dialog>,
        document.body,
    );
};

export default CoreConfirm;

import React, { useCallback, useState } from 'react';
import { useToast } from '../Toast';
import { getSessionData } from '../../util/util';
import loadingGif from '../../assets/loading.gif';
import errorPng from '../../assets/error.png';

const mainUrl = import.meta.env.VITE_API_URL || '/api.php';

const lazyFetchState = {
	pendingRequests: 0,
	loaderHostId: null,
	listeners: new Set(),
};

const notifyLazyFetchState = () => {
	const snapshot = {
		pendingRequests: lazyFetchState.pendingRequests,
		loaderHostId: lazyFetchState.loaderHostId,
	};

	lazyFetchState.listeners.forEach((listener) => {
		listener(snapshot);
	});
};

const subscribeLazyFetchState = (listener) => {
	lazyFetchState.listeners.add(listener);

	return () => {
		lazyFetchState.listeners.delete(listener);
	};
};

let backdropEl = null;

const BACKDROP_STYLES = {
	position: 'fixed',
	inset: 0,
	width: '100vw',
	height: '100vh',
	maxWidth: 'none',
	maxHeight: 'none',
	boxSizing: 'border-box',
	borderRadius: 0,
	background: 'rgba(0,0,0,0.1)',
	zIndex: 2000,
	display: 'none',
	alignItems: 'center',
	justifyContent: 'center',
	border: 'none',
	padding: 0,
	margin: 0,
	overflow: 'hidden',
};

const ensureBackdropEl = () => {
	if (!backdropEl) {
		backdropEl = document.createElement('div');
		Object.assign(backdropEl.style, BACKDROP_STYLES);
		backdropEl.innerHTML = `<img src="${loadingGif}" alt="Cargando..." style="width:80px;height:80px">`;
		document.body.appendChild(backdropEl);
	}
	return backdropEl;
};

const showBackdropDOM = () => {
	const el = ensureBackdropEl();
	el.style.display = 'flex';
};

const hideBackdropDOM = () => {
	if (backdropEl) {
		backdropEl.style.display = 'none';
	}
};

const MIN_LOADING_MS = 150;
let loadingStartTime = 0;
let pendingHideTimer = null;

const incrementGlobalPendingRequests = () => {
	if (pendingHideTimer) {
		clearTimeout(pendingHideTimer);
		pendingHideTimer = null;
	}

	if (lazyFetchState.pendingRequests === 0) {
		loadingStartTime = Date.now();
		showBackdropDOM();
	}

	lazyFetchState.pendingRequests += 1;
	notifyLazyFetchState();
};

const decrementGlobalPendingRequests = () => {
	lazyFetchState.pendingRequests = Math.max(0, lazyFetchState.pendingRequests - 1);

	if (lazyFetchState.pendingRequests === 0 && loadingStartTime > 0) {
		const elapsed = Date.now() - loadingStartTime;
		const remaining = MIN_LOADING_MS - elapsed;

		if (remaining > 0) {
			pendingHideTimer = setTimeout(() => {
				pendingHideTimer = null;
				hideBackdropDOM();
				notifyLazyFetchState();
			}, remaining);
			return;
		}

		hideBackdropDOM();
	}

	notifyLazyFetchState();
};

const claimGlobalLoaderHost = (instanceId) => {
	if (!instanceId || lazyFetchState.loaderHostId) {
		return;
	}

	lazyFetchState.loaderHostId = instanceId;
	notifyLazyFetchState();
};

const releaseGlobalLoaderHost = (instanceId) => {
	if (!instanceId || lazyFetchState.loaderHostId !== instanceId) {
		return;
	}

	lazyFetchState.loaderHostId = null;
	notifyLazyFetchState();
};

const LAZY_FETCH_STYLES = {
	backdropDialog: {
		position: 'fixed',
		inset: 0,
		width: '100vw',
		height: '100vh',
		maxWidth: 'none',
		maxHeight: 'none',
		boxSizing: 'border-box',
		borderRadius: 0,
		background: 'rgba(0,0,0,0.1)',
		zIndex: 2000,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		border: 'none',
		padding: 0,
		margin: 0,
		overflow: 'hidden',
	},
	backdropImage: {
		width: 80,
		height: 80,
	},
	errorDialog: {
		position: 'fixed',
		inset: 0,
		width: '100vw',
		height: '100vh',
		maxWidth: 'none',
		maxHeight: 'none',
		boxSizing: 'border-box',
		borderRadius: 0,
		background: 'rgba(0,0,0,0.15)',
		zIndex: 1500,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		border: 'none',
		padding: 0,
		margin: 0,
		overflow: 'hidden',
	},
	errorContainer: {
		background: '#fff',
		borderRadius: 12,
		boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
		padding: 32,
		minWidth: 340,
        width: '600px',
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		gap: 18,
	},
	errorImage: {
		width: 80,
		height: 80,
		marginBottom: 8,
		borderRadius: '5px',
	},
	errorTitle: {
		fontWeight: 600,
		fontSize: 18,
		color: '#d32f2f',
		marginBottom: 8,
	},
	errorContent: {
		width: '100%',
		height: 200,
		overflow: 'auto',
		fontFamily: 'monospace',
		fontSize: 14,
		color: '#333',
		background: '#f7f7f7',
		border: '1px solid #ddd',
		borderRadius: 6,
		padding: 8,
		whiteSpace: 'pre-wrap',
		wordBreak: 'break-word',
	},
	errorButton: {
		marginTop: 16,
		alignSelf: 'center',
		minWidth: 120,
		background: '#4285f4',
		color: '#fff',
		border: 'none',
		borderRadius: 6,
		fontSize: 15,
		fontWeight: 500,
		padding: '10px 0',
		cursor: 'pointer',
		boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
		transition: 'background 0.2s',
		outline: 'none',
		height: 40,
	},
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

const useLazyFetch = () => {
	const instanceIdRef = React.useRef(Symbol('lazy-fetch-instance'));
	const [response, setResponse] = useState({
		status: false,
		message: '',
		data: {},
	});
	const [errorModal, setErrorModal] = useState({ open: false, message: '' });
	const toast = useToast();

	React.useEffect(() => subscribeLazyFetchState(() => {
	}), []);

	const fetchData = useCallback(async (action, params = {}) => {
		incrementGlobalPendingRequests();
		try {
			const sessionData = getSessionData();
			const token = typeof sessionData?.sessionId === 'string' ? sessionData.sessionId : '';
			
			const bodyWithToken = { action: action, params: params || {}, token };
			const url = mainUrl;
			const res = await fetch(url, {
				method: 'POST',
				credentials: 'same-origin',
				mode: 'cors',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(bodyWithToken),
			});
			let jsonData = {};
			let rawText = '';
			try {
				rawText = await res.text();
				try {
					jsonData = JSON.parse(rawText);
				} catch {
					setErrorModal({ open: true, message: 'Respuesta del servidor inválida o incompleta.\n\n' + rawText });
					return {status: false, message: 'Respuesta del servidor no es JSON válido', data: {}};
				}
			} catch {
				setErrorModal({ open: true, message: 'No se pudo leer la respuesta del servidor.' });
				return {status: false, message: 'No se pudo leer la respuesta del servidor.', data: {}};
			}
			if (!res.ok) {
				const errMsg = jsonData.message || `Error HTTP: ${res.status}`;
				throw new Error(errMsg);
			}
			const formattedResponse = {
				status: jsonData.status === true,
				message: jsonData.message || '',
				data: jsonData.data || [],
			};
			setResponse(formattedResponse);
			if (formattedResponse.message) {
				if (typeof Android !== 'undefined' && Android.showToast) {
					const duration = formattedResponse.status ? 2000 : 3500;
					Android.showToast(formattedResponse.message, duration);
				} else {
					toast.showToast(formattedResponse.message, formattedResponse.status ? 'success' : 'warning');
				}
			}
			return formattedResponse;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			const errorResponse = {
				status: false,
				message: errorMessage,
				data: {},
			};
			setResponse(errorResponse);
			if (typeof Android !== 'undefined' && Android.showToast) {
				Android.showToast(errorMessage, 3500);
			} else {
				toast.showToast(errorMessage, 'error');
			}
			throw error;
		} finally {
			decrementGlobalPendingRequests();
		}
	}, [toast]);

	const BackdropLoader = React.useCallback(function BackdropLoader() {
		React.useEffect(() => {
			claimGlobalLoaderHost(instanceIdRef.current);
			return () => releaseGlobalLoaderHost(instanceIdRef.current);
		}, []);

		return null;
	}, []);

	const ErrorModal = React.useCallback(function ErrorModal() {
		const dialogRef = React.useRef(null);

		React.useEffect(() => {
			if (!errorModal.open) {
				return undefined;
			}

			const dialogElement = dialogRef.current;
			openNativeDialog(dialogElement);

			return () => {
				closeNativeDialog(dialogElement);
			};
		}, [errorModal.open]); // eslint-disable-line react-hooks/exhaustive-deps

		if (!errorModal.open) return null;
		return (
			<dialog
				ref={dialogRef}
				style={LAZY_FETCH_STYLES.errorDialog}
				tabIndex={-1}
				aria-modal="true"
				aria-label="Error"
				onCancel={(event) => event.preventDefault()}
			>
				<div
					style={LAZY_FETCH_STYLES.errorContainer}
				>
					<img src={errorPng} alt="Error" style={LAZY_FETCH_STYLES.errorImage} />
					<div style={LAZY_FETCH_STYLES.errorTitle}>
						Error de respuesta del servidor
					</div>
					<div
						dangerouslySetInnerHTML={{ __html: errorModal.message }}
						style={LAZY_FETCH_STYLES.errorContent}
					/>
					<button
						style={LAZY_FETCH_STYLES.errorButton}
						onClick={() => setErrorModal({ open: false, message: '' })}
					>
						Cerrar
					</button>
				</div>
			</dialog>
		);
	}, [errorModal.open, errorModal.message]);

	return {
		...response,
		fetchData,
		BackdropLoader,
		ErrorModal,
	};
};

export default useLazyFetch;

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { FaBell, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimesCircle } from 'react-icons/fa';
import { COLOR_MAP } from '../../util/constants';
import ToastContext from './ToastContext';

const TOAST_PROGRESS_KEYFRAMES = `
@keyframes toast-progress-shrink {
	from { transform: scaleX(1); }
	to { transform: scaleX(0); }
}
`;

const TOAST_STYLES = {
	stack: {
		position: 'fixed',
		top: 70,
		right: 20,
		zIndex: 9999,
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'flex-end',
		width: 400,
		maxWidth: 'calc(100vw - 40px)',
		gap: 10,
		pointerEvents: 'none',
		height: 'calc(100vh - 70px)',
		overflow: 'hidden',
	},
	toast: {
		maxWidth: 350,
		padding: '14px 18px 14px 14px',
		borderRadius: 5,
		color: '#fff',
		display: 'flex',
		alignItems: 'center',
		boxShadow: '0 2px 12px rgba(0, 0, 0, 0.3)',
		opacity: 1,
		transform: 'translateX(0)',
		transition: 'opacity 0.3s, transform 0.3s',
		position: 'relative',
		right: 0,
		pointerEvents: 'auto',
		fontSize: 14,
		fontFamily: 'Arial, sans-serif',
		width: '100%',
	},
	toastLeave: {
		opacity: 0,
		transform: 'translateX(120px)',
		transition: 'opacity 0.35s cubic-bezier(0.4,0,0.2,1), transform 0.35s cubic-bezier(0.4,0,0.2,1)',
	},
	toastColor: {
		success: {
			background: COLOR_MAP.success,
		},
		error: {
			background: COLOR_MAP.error,
		},
		warning: {
			background: COLOR_MAP.warning,
		},
		info: {
			background: COLOR_MAP.info,
		},
		notify: {
			background: COLOR_MAP.notify,
		},
	},
	icon: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 12,
		fontSize: '1.4em',
		color: '#fff',
		minWidth: 24,
		minHeight: 24,
	},
	close: {
		background: 'none',
		border: 'none',
		color: '#fff',
		fontSize: '1.7em',
		marginLeft: 16,
		cursor: 'pointer',
		opacity: 0.7,
		transition: 'opacity 0.2s, box-shadow 0.2s, background 0.2s',
		width: 36,
		height: 36,
		borderRadius: '50%',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		boxShadow: '0 0 0 rgba(0,0,0,0)',
	},
	closeHover: {
		opacity: 1,
		color: '#fff',
		background: 'rgba(255,255,255,0.12)',
		boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
	},
	message: {
		flex: 1,
		display: 'flex',
		alignItems: 'center',
		wordBreak: 'break-word',
	},
	progress: {
		position: 'absolute',
		left: 0,
		bottom: 0,
		height: 2,
		width: '100%',
		background: '#fff',
		borderRadius: '0 0 3px 3px',
		pointerEvents: 'none',
		zIndex: 2,
		transformOrigin: 'left center',
	},
};


let toastId = 0;

export const ToastProvider = ({ children }) => {
	const [toasts, setToasts] = useState([]);
	const [leaving, setLeaving] = useState([]);
	const timers = useRef({});
	const startTimes = useRef({});
	const remainingTimes = useRef({});
	const [pausedToasts, setPausedToasts] = useState([]);
	const [hoveredClose, setHoveredClose] = useState(null);

	const removeToast = useCallback((id) => {
		setLeaving((leaving) => [...leaving, id]);
		setTimeout(() => {
			setToasts((toasts) => toasts.filter((t) => t.id !== id));
			setLeaving((leaving) => leaving.filter((lid) => lid !== id));
			delete timers.current[id];
			delete startTimes.current[id];
			delete remainingTimes.current[id];
		}, 350);
	}, []);

	const startTimer = useCallback((id, duration) => {
		startTimes.current[id] = Date.now();
		timers.current[id] = setTimeout(() => removeToast(id), duration);
		remainingTimes.current[id] = duration;
	}, [removeToast]);

	const pauseTimer = (id) => {
		if (timers.current[id]) {
			clearTimeout(timers.current[id]);
			const elapsed = Date.now() - startTimes.current[id]; // eslint-disable-line react-hooks/purity
			remainingTimes.current[id] -= elapsed;
			setPausedToasts((prev) => [...prev, id]);
		}
	};

	const resumeTimer = (id) => {
		if (remainingTimes.current[id] > 0) {
			startTimer(id, remainingTimes.current[id]);
			setPausedToasts((prev) => prev.filter((pid) => pid !== id));
		}
	};

	const showToast = useCallback((message, color = 'info', duration = 4000) => {
		const id = ++toastId;
		setToasts((toasts) => [...toasts, { id, message, type: color, duration }]);
		setTimeout(() => startTimer(id, duration), 0);
	}, [startTimer]);

	React.useEffect(() => {
		const currentTimers = timers.current;
		return () => {
			Object.values(currentTimers).forEach(clearTimeout);
		};
	}, []);

	const toastContextValue = useMemo(() => ({ showToast }), [showToast]);

	return (
		<ToastContext.Provider value={toastContextValue}>
			<style>{TOAST_PROGRESS_KEYFRAMES}</style>
			{children}
			<div style={TOAST_STYLES.stack}>
				{toasts.map((toast) => {
					const isLeaving = leaving.includes(toast.id);
					const isPaused = pausedToasts.includes(toast.id);
					const typeStyle = TOAST_STYLES.toastColor[toast.type] || TOAST_STYLES.toastColor.info;
					return (
						<div
							key={toast.id}
							style={{
								...TOAST_STYLES.toast,
								...typeStyle,
								...(isLeaving ? TOAST_STYLES.toastLeave : {}),
							}}
							onMouseEnter={() => pauseTimer(toast.id)}
							onMouseLeave={() => resumeTimer(toast.id)}
						>
							<span style={TOAST_STYLES.icon}>{getIcon(toast.type)}</span>
							<span style={TOAST_STYLES.message}>{toast.message}</span>
							<button
								style={{
									...TOAST_STYLES.close,
									...(hoveredClose === toast.id ? TOAST_STYLES.closeHover : {}),
								}}
								onMouseEnter={() => setHoveredClose(toast.id)}
								onMouseLeave={() => setHoveredClose(null)}
								onClick={() => removeToast(toast.id)}
							>
								&times;
							</button>
							{!isLeaving && (
								<div
									style={{
										...TOAST_STYLES.progress,
										animation: `toast-progress-shrink ${toast.duration}ms linear forwards`,
										animationPlayState: isPaused ? 'paused' : 'running',
									}}
								/>
							)}
						</div>
					);
				})}
			</div>
		</ToastContext.Provider>
	);
};

function getIcon(type) {
	const toastColor = COLOR_MAP[type] || COLOR_MAP.info;
	const iconColor = '#fff';

	switch (toastColor) {
		case COLOR_MAP.success:
			return <FaCheckCircle style={{ color: iconColor }} />;
		case COLOR_MAP.error:
			return <FaTimesCircle style={{ color: iconColor }} />;
		case COLOR_MAP.warning:
			return <FaExclamationTriangle style={{ color: iconColor }} />;
		case COLOR_MAP.notify:
			return <FaBell style={{ color: iconColor }} />;
		case COLOR_MAP.info:
		default:
			return <FaInfoCircle style={{ color: iconColor }} />;
	}
}

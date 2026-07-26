
import { COLOR_MAP, DISABLED_COLOR, FORMSTATE } from '../../util/constants.js';

const CoreButtonSquare = ({
    icon = null,
    color = COLOR_MAP.info,
    visible = true,
    disabled = false,
    formState = FORMSTATE.NOSHOW,
    ignoreFormState = false,
    onClick,
    ...props
}) => {
    let btnColor = color || COLOR_MAP.info;
    if (typeof btnColor !== 'string') {
        btnColor = COLOR_MAP.info;
    }

    let isDisabled = disabled;
    if (!ignoreFormState) {
        if (formState === FORMSTATE.NOSHOW || formState === FORMSTATE.SHOWING) {
            isDisabled = true;
        } else if (formState === FORMSTATE.EDITING) {
            isDisabled = disabled;
        }
    }

    const { style: customStyle, className, ...restProps } = props;

    return (
        <button
            className={className}
            style={{
                width: '36px',
                height: '36px',
                border: 'none',
                borderRadius: '6px',
                padding: 0,
                fontSize: '18px',
                cursor: isDisabled ? 'default' : 'pointer',
                transition: 'background-color 0.18s, opacity 0.18s',
                outline: 'none',
                display: visible ? 'inline-flex' : 'none',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                color: '#fff',
                backgroundColor: isDisabled ? DISABLED_COLOR : btnColor,
                opacity: isDisabled ? 0.6 : 1,
                ...customStyle,
            }}
            disabled={isDisabled}
            onClick={isDisabled ? undefined : onClick}
            {...restProps}
        >
            {icon}
        </button>
    );
};

export default CoreButtonSquare;

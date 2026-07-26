
const CoreVSep = ({size}) => {
    const defaultSize = '12px';

    if (typeof size === 'number') {
        size = `${size}px`;
    }
    if (typeof size !== 'string') {
        size = defaultSize;
    }

    return (
        <div style={{ height: size }} />
    );
}

export default CoreVSep;

const MODAL_LAYER_STEP = 10;

const openedLayerOrder = new Map();
let openingSequence = 0;

const toNumericValue = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

export const acquireModalLayerOrder = (layerId) => {
    if (!layerId) {
        return 0;
    }

    openingSequence += 1;
    openedLayerOrder.set(layerId, openingSequence);
    return openingSequence;
};

export const releaseModalLayerOrder = (layerId) => {
    if (!layerId) {
        return;
    }

    openedLayerOrder.delete(layerId);

    if (openedLayerOrder.size === 0) {
        openingSequence = 0;
    }
};

export const resolveModalLayerZIndex = (baseZIndex = 1300, layerOrder = 0) => {
    const safeBaseZIndex = toNumericValue(baseZIndex, 1300);
    const safeLayerOrder = toNumericValue(layerOrder, 0);
    return safeBaseZIndex + (safeLayerOrder * MODAL_LAYER_STEP);
};

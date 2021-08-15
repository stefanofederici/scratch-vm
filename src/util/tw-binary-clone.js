const reset = buffer => {
    const uint8 = new Uint8Array(buffer);
    uint8[0] = 0;
};

const encodeResult = (buffer, value) => {
    const view = new DataView(buffer);
    if (typeof value === 'number') {
        view.setUint8(0, 1);
        view.setFloat64(1, value);
    } else if (typeof value === 'boolean') {
        view.setUint8(0, 2);
        view.setUint8(1, value ? 1 : 0);
    } else if (typeof value === 'string') {
        const encoded = new TextEncoder().encode(value);
        if (encoded.byteLength > buffer.byteLength - 1 - 4) {
            // Too long to fit
            view.setUint8(0, 254);
            return;
        }
        view.setUint8(0, 3);
        view.setUint32(1, encoded.byteLength);
        for (let i = 0; i < encoded.byteLength; i++) {
            view.setUint8(5 + i, encoded[i]);
        }
    } else if (typeof value === 'undefined') {
        view.setUint8(0, 4);
    } else if (value === null) {
        view.setUint8(0, 5);
    } else {
        view.setUint8(0, 255);
    }
};

const encodeError = buffer => {
    encodeResult(buffer, null);
};

const decode = buffer => {
    const view = new DataView(buffer);
    const type = view.getUint8(0);
    if (type === 0) {
        throw new Error('nothing to decode');
    } else if (type === 1) {
        return view.getFloat64(1);
    } else if (type === 2) {
        return !!view.getUint8(1);
    } else if (type === 3) {
        const length = view.getUint32(1);
        const decoded = new TextDecoder('utf-8').decode(buffer.slice(5, 5 + length));
        return decoded;
    } else if (type === 4) {
        // eslint-disable-next-line no-undefined
        return undefined;
    } else if (type === 5) {
        return null;
    } else if (type === 254) {
        return 'String too long';
    } else {
        throw new Error('cannot decode; unknown type');
    }
};

const waitAndDecode = buffer => {
    const uint8 = new Uint8Array(buffer);
    while (Atomics.load(uint8, 0) === 0) {
        // Busy loop
    }
    return decode(buffer);
};

module.exports = {
    encodeError,
    encodeResult,
    reset,
    decode,
    waitAndDecode
};

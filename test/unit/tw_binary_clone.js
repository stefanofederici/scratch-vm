const tap = require('tap');
const binaryClone = require('../../src/util/tw-binary-clone');

const test = tap.test;

test('error', t => {
    const buffer = new ArrayBuffer(1024);
    binaryClone.encodeError(buffer);
    t.equal(binaryClone.decode(buffer), null);
    t.end();
});

test('result', t => {
    const buffer = new ArrayBuffer(1024);
    for (const value of [
        0.124, 0, -3, Infinity, -Infinity, null, undefined, true, false, '', '123', '😋\n\0񟍆ꫭ󲔌.ʿ貹쐽⼾ꆛ[񏖰xSw'
    ]) {
        binaryClone.reset(buffer);
        binaryClone.encodeResult(buffer, value);
        t.equal(binaryClone.decode(buffer), value, `${value}`);
    }
    for (const value of [NaN, -0]) {
        binaryClone.reset(buffer);
        binaryClone.encodeResult(buffer, value);
        t.ok(Object.is(binaryClone.decode(buffer), value), `${value}`);
    }
    t.end();
});

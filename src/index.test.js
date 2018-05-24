// @flow

import foo from '.';

describe('wombat', () => {
    test('a', () => {
        expect(foo).toBeDefined();
    });

    test('b', () => {
        expect(1).not.toBe(2);
    });
});

// @flow

import type { ReducerArg } from './types';

import applyReducerResult from './applyReducerResult';
import Reducer from './Reducer';

const mockSetExtState = jest.fn();

const xsf = {
    setExtState: mockSetExtState,
};

// $FlowFixMe (ignore as xsf isn't a real instance)
const reducerarg: ReducerArg = {};

beforeEach(() => {
    mockSetExtState.mockClear();
});

describe('applyReducerResult', () => {
    test('is a function', () => {
        expect(applyReducerResult).toBeInstanceOf(Function);
    });

    test('Reducer.noUpdate', () => {
        const reducerresult = Reducer.noUpdate();

        // $FlowFixMe (ignore as xsf isn't a real instance)
        applyReducerResult({ xsf, reducerarg, reducerresult });

        expect(mockSetExtState).toHaveBeenCalledTimes(0);
    });

    test('Reducer.update(ExtState)', () => {
        const update = { foo: 1 };
        const reducerresult = Reducer.update(update);

        // $FlowFixMe (ignore as xsf isn't a real instance)
        applyReducerResult({ xsf, reducerarg, reducerresult });

        expect(mockSetExtState).toHaveBeenCalledTimes(1);

        expect(mockSetExtState.mock.calls[0]).toHaveLength(1);
        expect(mockSetExtState.mock.calls[0][0]).toBe(update);
    });

    test('Reducer.update(ReducerArg => ExtState)', () => {
        const update = { foo: 1 };
        const updatefn = jest.fn(() => update);
        const reducerresult = Reducer.update(updatefn);

        // $FlowFixMe (ignore as xsf isn't a real instance)
        applyReducerResult({ xsf, reducerarg, reducerresult });

        expect(updatefn).toHaveBeenCalledTimes(1);
        expect(updatefn.mock.calls[0]).toHaveLength(1);
        expect(updatefn.mock.calls[0][0]).toBe(reducerarg);

        expect(mockSetExtState).toHaveBeenCalledTimes(1);

        expect(mockSetExtState.mock.calls[0]).toHaveLength(1);
        expect(mockSetExtState.mock.calls[0][0]).toBe(update);
    });

    test('Reducer.effect((XStateful, ReducerArg) => whatevs)', () => {
        const effect = jest.fn();
        const reducerresult = Reducer.effect(effect);

        // $FlowFixMe (ignore error as xsf isn't a real instance)
        const result = applyReducerResult({ xsf, reducerarg, reducerresult });

        expect(mockSetExtState).toHaveBeenCalledTimes(0);
        expect(effect).toHaveBeenCalledTimes(0);
        expect(result).toBeInstanceOf(Function);

        // $FlowFixMe (ignore error as we know result is a function)
        result();

        expect(effect).toHaveBeenCalledTimes(1);
        expect(effect.mock.calls[0]).toHaveLength(2);
        expect(effect.mock.calls[0][0]).toBe(xsf);
        expect(effect.mock.calls[0][1]).toBe(reducerarg);
    });

    test('Reducer.updateWithEffect(ExtState, (XStateful, ReducerArg) => whatevs)', () => {
        const update = { foo: 1 };
        const effect = jest.fn();
        const reducerresult = Reducer.updateWithEffect(update, effect);

        // $FlowFixMe (ignore as xsf isn't a real instance)
        const result = applyReducerResult({ xsf, reducerarg, reducerresult });

        expect(mockSetExtState).toHaveBeenCalledTimes(1);
        expect(effect).toHaveBeenCalledTimes(0);
        expect(result).toBeInstanceOf(Function);

        expect(mockSetExtState.mock.calls[0]).toHaveLength(1);
        expect(mockSetExtState.mock.calls[0][0]).toBe(update);

        // $FlowFixMe (ignore error as we know result is a function)
        result();

        expect(effect).toHaveBeenCalledTimes(1);
        expect(effect.mock.calls[0]).toHaveLength(2);
        expect(effect.mock.calls[0][0]).toBe(xsf);
        expect(effect.mock.calls[0][1]).toBe(reducerarg);
    });
});

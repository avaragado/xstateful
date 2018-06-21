// @flow

import type { ReducerArg, ReducerSpec, ReducerResult } from './types';

import { ACTION_TYPE } from './constants';
import Reducer from './Reducer';
import getReducerResult from './getReducerResult';

const rargNull: ReducerArg = {
    state: null,
    extstate: {},
    event: null,
    action: null,
    statePrevious: null,
    transition: () => undefined,
};

type Fixture = () => {
    title: string,
    in: {
        reducer: ReducerSpec,
        reducerarg: ReducerArg,
    },
    out: ReducerResult,
};

const fixtures: Array<Fixture> = [
    () => {
        const reducer = Reducer.noUpdate();

        return {
            title: 'returns a ReducerResult as-is - noUpdate',
            in: {
                reducer,
                reducerarg: rargNull,
            },
            out: reducer,
        };
    },

    () => {
        const reducer = Reducer.update({ a: 2 });

        return {
            title: 'returns a ReducerResult as-is - sparse update',
            in: {
                reducer,
                reducerarg: rargNull,
            },
            out: reducer,
        };
    },

    () => {
        const reducer = Reducer.update(() => ({ a: 2 }));

        return {
            title: 'returns a ReducerResult as-is - function update',
            in: {
                reducer,
                reducerarg: rargNull,
            },
            out: reducer,
        };
    },

    () => {
        const reducer = Reducer.effect(() => {});

        return {
            title: 'returns a ReducerResult as-is - sync effect',
            in: {
                reducer,
                reducerarg: rargNull,
            },
            out: reducer,
        };
    },

    () => {
        const reducer = Reducer.effect(async () => {});

        return {
            title: 'returns a ReducerResult as-is - async effect',
            in: {
                reducer,
                reducerarg: rargNull,
            },
            out: reducer,
        };
    },

    () => {
        const reducer = Reducer.updateWithEffect({ a: 2 }, () => {});

        return {
            title: 'returns a ReducerResult as-is - update with effect',
            in: {
                reducer,
                reducerarg: rargNull,
            },
            out: reducer,
        };
    },

    () => {
        const result = Reducer.noUpdate();
        const reducer = () => 123;

        return {
            title:
                'invokes a function with reducerarg as argument, returns no update if not ReducerResult',
            in: {
                // $FlowFixMe (deliberate error)
                reducer,
                reducerarg: rargNull,
            },
            out: result,
        };
    },

    () => {
        const result = Reducer.update({});
        const reducer = rarg =>
            rarg === rargNull ? result : Reducer.noUpdate();

        return {
            title:
                'invokes a function with reducerarg as argument, returns its result if ReducerResult',
            in: {
                reducer,
                reducerarg: rargNull,
            },
            out: result,
        };
    },

    () => {
        const reducerarg = {
            state: null,
            extstate: {},
            event: null,
            action: {
                type: 'not-matched',
            },
            statePrevious: null,
            transition: () => undefined,
        };
        const result = Reducer.noUpdate();
        const resultIgnored = Reducer.update({ a: 1 });
        const reducer = Reducer.map({
            ping: resultIgnored,
        });

        return {
            title:
                'defaults to no update if action type not matched in reducer map',
            in: {
                reducer,
                reducerarg,
            },
            out: result,
        };
    },

    () => {
        const reducerarg = {
            state: null,
            extstate: {},
            event: null,
            action: {
                type: 'ping',
            },
            statePrevious: null,
            transition: () => undefined,
        };
        const result = Reducer.update({ a: 1 });
        const reducer = Reducer.map({
            ping: result,
        });

        return {
            title:
                'returns reducer result value if action type matched in reducer map',
            in: {
                reducer,
                reducerarg,
            },
            out: result,
        };
    },

    () => {
        const reducerarg = {
            state: null,
            extstate: {},
            event: null,
            action: {
                type: 'ping',
            },
            statePrevious: null,
            transition: () => undefined,
        };
        const result = Reducer.update({ a: 1 });
        const reducer = Reducer.map({
            ping: rarg => (rarg === reducerarg ? result : Reducer.noUpdate()),
        });

        return {
            title:
                'invokes a function and returns reducer result value if action type matched in reducer map',
            in: {
                reducer,
                reducerarg,
            },
            out: result,
        };
    },

    () => {
        const reducerarg = {
            state: null,
            extstate: {},
            event: null,
            action: {
                type: ACTION_TYPE.ACTIVITY_START,
                activity: 'ping',
            },
            statePrevious: null,
            transition: () => undefined,
        };
        const result = Reducer.update({ a: 1 });
        const reducer = Reducer.map({
            'ping:start': rarg =>
                rarg === reducerarg ? result : Reducer.noUpdate(),
        });

        return {
            title:
                'invokes a function and returns reducer result value if activity start matched in reducer map',
            in: {
                reducer,
                reducerarg,
            },
            out: result,
        };
    },

    () => {
        const reducerarg = {
            state: null,
            extstate: {},
            event: null,
            action: {
                type: ACTION_TYPE.ACTIVITY_STOP,
                activity: 'ping',
            },
            statePrevious: null,
            transition: () => undefined,
        };
        const result = Reducer.update({ a: 1 });
        const reducer = Reducer.map({
            'ping:stop': rarg =>
                rarg === reducerarg ? result : Reducer.noUpdate(),
        });

        return {
            title:
                'invokes a function and returns reducer result value if activity start matched in reducer map',
            in: {
                reducer,
                reducerarg,
            },
            out: result,
        };
    },
];

describe('getReducerResult', () => {
    test('is a function', () => {
        expect(getReducerResult).toBeInstanceOf(Function);
    });

    fixtures.map(fixture => fixture()).forEach(fixture => {
        test(fixture.title, () => {
            const received = getReducerResult(fixture.in);

            expect(received).toBe(fixture.out);
        });
    });
});

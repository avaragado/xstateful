// @flow

import { Machine } from 'xstate';

import type { ExtState } from '..';

import { createStatefulMachine, Reducer, ACTION_TYPE } from '..';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

describe('XStateful', () => {
    describe('reducers', () => {
        test('string/object actions/activities ignored if not in reducer map', () => {
            const machine = Machine({
                key: 'test',
                initial: 'before',
                states: {
                    before: {
                        activities: [
                            'activity_missing1',
                            { type: 'activity_missing1 }' },
                        ],
                        onEntry: ['missing1', { type: 'missing1' }],
                        on: {
                            NEXT: {
                                after: {
                                    actions: ['missing3', { type: 'missing3' }],
                                },
                            },
                        },
                        onExit: ['missing2', { type: 'missing2' }],
                    },
                    after: {
                        onEntry: ['missing4', { type: 'missing4' }],
                        activities: [
                            'activity_missing2',
                            { type: 'activity_missing2 ' },
                        ],
                    },
                },
            });
            const map = {
                enter_before: jest.fn(),
            };
            const reducer = Reducer.map(map);

            const xsf = createStatefulMachine({
                machine,
                reducer,
            });
            xsf.init();

            xsf.transition('NEXT');

            expect(map.enter_before).toHaveBeenCalledTimes(0);
        });

        test('string/object actions/activities invoked if in reducer map', () => {
            const machine = Machine({
                key: 'test',
                initial: 'before',
                states: {
                    before: {
                        activities: [
                            'before_activity',
                            { type: 'before_activity' },
                        ],
                        onEntry: ['enter_before', { type: 'enter_before' }],
                        on: {
                            NEXT: {
                                after: {
                                    actions: [
                                        'before_on_NEXT',
                                        { type: 'before_on_NEXT' },
                                    ],
                                },
                            },
                        },
                        onExit: ['exit_before', { type: 'exit_before' }],
                    },
                    after: {
                        onEntry: ['enter_after', { type: 'enter_after' }],
                        activities: [
                            'after_activity',
                            { type: 'after_activity' },
                        ],
                    },
                },
            });

            const map = {
                'before_activity:start': jest.fn(),
                'before_activity:stop': jest.fn(),
                enter_before: jest.fn(),
                before_on_NEXT: jest.fn(),
                exit_before: jest.fn(),
                'after_activity:start': jest.fn(),
                'after_activity:stop': jest.fn(),
                enter_after: jest.fn(),
            };

            const reducer = Reducer.map(map);

            const xsf = createStatefulMachine({
                machine,
                reducer,
            });
            xsf.init();

            expect(map['before_activity:start']).toHaveBeenCalledTimes(2);
            expect(map['before_activity:stop']).toHaveBeenCalledTimes(0);
            expect(map.enter_before).toHaveBeenCalledTimes(2);
            expect(map.before_on_NEXT).toHaveBeenCalledTimes(0);
            expect(map.exit_before).toHaveBeenCalledTimes(0);
            expect(map['after_activity:start']).toHaveBeenCalledTimes(0);
            expect(map['after_activity:stop']).toHaveBeenCalledTimes(0);
            expect(map.enter_after).toHaveBeenCalledTimes(0);

            xsf.transition('NEXT');

            expect(map['before_activity:start']).toHaveBeenCalledTimes(2);
            expect(map['before_activity:stop']).toHaveBeenCalledTimes(2);
            expect(map.enter_before).toHaveBeenCalledTimes(2);
            expect(map.before_on_NEXT).toHaveBeenCalledTimes(2);
            expect(map.exit_before).toHaveBeenCalledTimes(2);
            expect(map['after_activity:start']).toHaveBeenCalledTimes(2);
            expect(map['after_activity:stop']).toHaveBeenCalledTimes(0);
            expect(map.enter_after).toHaveBeenCalledTimes(2);
        });

        test('string/object actions/activities passed to reducer fn', () => {
            const machine = Machine({
                key: 'test',
                initial: 'before',
                states: {
                    before: {
                        activities: [
                            'before_activity',
                            { type: 'before_activity' },
                        ],
                        onEntry: ['enter_before', { type: 'enter_before' }],
                        on: {
                            NEXT: {
                                after: {
                                    actions: [
                                        'before_on_NEXT',
                                        { type: 'before_on_NEXT' },
                                    ],
                                },
                            },
                        },
                        onExit: ['exit_before', { type: 'exit_before' }],
                    },
                    after: {
                        onEntry: ['enter_after', { type: 'enter_after' }],
                        activities: [
                            'after_activity',
                            { type: 'after_activity' },
                        ],
                    },
                },
            });

            const reducer = jest.fn();

            const xsf = createStatefulMachine({
                machine,
                reducer,
            });
            xsf.init();

            expect(reducer).toHaveBeenCalledTimes(4);

            xsf.transition('NEXT');

            expect(reducer).toHaveBeenCalledTimes(14);
        });

        test('reducer fn called with state, extstate from the XStateful instance', () => {
            const spyPing = jest.fn();
            const spyInc = jest.fn(({ extstate: xs }) => ({
                count: xs.count + 1,
            }));

            const machine = Machine({
                key: 'test',
                initial: 'first',
                states: {
                    first: {
                        onEntry: 'ping',
                        on: {
                            NEXT: {
                                second: {
                                    actions: ['inc', 'ping'],
                                },
                            },
                        },
                    },
                    second: {},
                },
            });

            const reducer = Reducer.map({
                ping: spyPing,
                inc: Reducer.update(spyInc),
            });

            const extstate: ExtState = {
                count: 1,
            };

            const xsf = createStatefulMachine({ machine, reducer, extstate });
            xsf.init();

            expect(spyInc).toHaveBeenCalledTimes(0);
            expect(spyPing).toHaveBeenCalledTimes(1);

            expect(spyPing.mock.calls[0]).toHaveLength(1);
            expect(spyPing.mock.calls[0][0].state).toBe(xsf.state);
            expect(spyPing.mock.calls[0][0].extstate).toBe(xsf.extstate);

            expect(spyPing.mock.calls[0][0].state.value).toBe('first');

            xsf.transition('NEXT');

            expect(spyInc).toHaveBeenCalledTimes(1);
            expect(spyPing).toHaveBeenCalledTimes(2);

            expect(spyInc.mock.calls[0]).toHaveLength(1);
            expect(spyInc.mock.calls[0][0].state).toBe(xsf.state);
            expect(spyInc.mock.calls[0][0].extstate).toBe(extstate); // before inc updates it

            expect(spyInc.mock.calls[0][0].state.value).toBe('second'); // NB state has already changed at this point

            expect(spyPing.mock.calls[1]).toHaveLength(1);
            expect(spyPing.mock.calls[1][0].state).toBe(xsf.state);
            expect(spyPing.mock.calls[1][0].extstate).toBe(xsf.extstate); // after inc updates it

            expect(spyPing.mock.calls[1][0].state.value).toBe('second');
        });

        test('reducer fn called with event, action - actions', () => {
            const wibble = jest.fn(() => Reducer.noUpdate());

            const machine = Machine({
                key: 'test',
                initial: 'first',
                states: {
                    first: {
                        onEntry: 'wibble',
                        on: {
                            NEXT: {
                                second: {
                                    actions: [{ type: 'wibble', foo: 3 }],
                                },
                            },
                        },
                        onExit: { type: 'wibble', foo: 2 },
                    },
                    second: {
                        onEntry: { type: 'wibble', foo: 4 },
                    },
                },
            });
            const reducer = Reducer.map({
                wibble,
            });
            const extstate: ExtState = {
                foo: 123,
            };

            const xsf = createStatefulMachine({ machine, reducer, extstate });
            xsf.init();

            const { calls } = wibble.mock;

            expect(wibble).toHaveBeenCalledTimes(1);
            expect(calls[0]).toHaveLength(1);
            expect(calls[0][0]).toMatchObject({
                event: null,
                action: {
                    type: 'wibble',
                },
            });

            xsf.transition('NEXT');

            expect(wibble).toHaveBeenCalledTimes(4);

            expect(calls[1]).toHaveLength(1);
            expect(calls[1][0]).toMatchObject({
                event: {
                    type: 'NEXT',
                },
                action: {
                    type: 'wibble',
                    foo: 2,
                },
            });

            expect(calls[2]).toHaveLength(1);
            expect(calls[2][0]).toMatchObject({
                event: {
                    type: 'NEXT',
                },
                action: {
                    type: 'wibble',
                    foo: 3,
                },
            });

            expect(calls[3]).toHaveLength(1);
            expect(calls[3][0]).toMatchObject({
                event: {
                    type: 'NEXT',
                },
                action: {
                    type: 'wibble',
                    foo: 4,
                },
            });
        });

        test('reducer fn called with event, action - activities', () => {
            const wibbleStart = jest.fn(() => Reducer.noUpdate());
            const wibbleStop = jest.fn(() => Reducer.noUpdate());

            const machine = Machine({
                key: 'test',
                initial: 'first',
                states: {
                    first: {
                        on: {
                            NEXT: 'second',
                        },
                    },
                    second: {
                        activities: ['wibble', { type: 'wibble', foo: 1 }],
                        on: {
                            NEXT: 'third',
                        },
                    },
                    third: {},
                },
            });
            const reducer = Reducer.map({
                'wibble:start': wibbleStart,
                'wibble:stop': wibbleStop,
            });
            const extstate: ExtState = {
                foo: 123,
            };

            const xsf = createStatefulMachine({ machine, reducer, extstate });
            xsf.init();

            const { calls: callsStart } = wibbleStart.mock;
            const { calls: callsStop } = wibbleStop.mock;

            expect(wibbleStart).toHaveBeenCalledTimes(0);
            expect(wibbleStop).toHaveBeenCalledTimes(0);

            xsf.transition('NEXT');

            expect(wibbleStart).toHaveBeenCalledTimes(2);
            expect(wibbleStop).toHaveBeenCalledTimes(0);

            expect(callsStart[0]).toHaveLength(1);
            expect(callsStart[0][0]).toMatchObject({
                event: {
                    type: 'NEXT',
                },
                action: {
                    type: ACTION_TYPE.ACTIVITY_START,
                    activity: 'wibble',
                    data: {
                        type: 'wibble',
                    },
                },
            });

            expect(callsStart[1]).toHaveLength(1);
            expect(callsStart[1][0]).toMatchObject({
                event: {
                    type: 'NEXT',
                },
                action: {
                    type: ACTION_TYPE.ACTIVITY_START,
                    activity: 'wibble',
                    data: {
                        type: 'wibble',
                        foo: 1,
                    },
                },
            });

            xsf.transition('NEXT');

            expect(wibbleStart).toHaveBeenCalledTimes(2);
            expect(wibbleStop).toHaveBeenCalledTimes(2);

            expect(callsStop[0]).toHaveLength(1);
            expect(callsStop[0][0]).toMatchObject({
                event: {
                    type: 'NEXT',
                },
                action: {
                    type: ACTION_TYPE.ACTIVITY_STOP,
                    activity: 'wibble',
                    data: {
                        type: 'wibble',
                    },
                },
            });

            expect(callsStop[1]).toHaveLength(1);
            expect(callsStop[1][0]).toMatchObject({
                event: {
                    type: 'NEXT',
                },
                action: {
                    type: ACTION_TYPE.ACTIVITY_STOP,
                    activity: 'wibble',
                    data: {
                        type: 'wibble',
                        foo: 1,
                    },
                },
            });
        });

        test('reducer fn called to update extstate', () => {
            const machine = Machine({
                key: 'test',
                initial: 'test',
                states: {
                    test: {
                        activities: ['append'],
                        onEntry: ['inc', 'inc', 'dummy'],
                        on: {
                            NEXT: 'test',
                        },
                    },
                },
            });

            const extstate: ExtState = {
                count: 1,
                chars: '',
            };

            const inc = jest.fn(({ extstate: xs }) =>
                Reducer.update({ count: xs.count + 1 }),
            );

            const append = jest.fn(({ extstate: xs, action }) =>
                Reducer.update({
                    chars:
                        xs.chars + (action.type === 'xstate.start' ? 'A' : 'Z'),
                }),
            );

            const reducer = Reducer.map({
                dummy: () => null,
                inc,
                'append:start': append,
                'append:stop': append,
            });

            const xsf = createStatefulMachine({ machine, reducer, extstate });
            xsf.init();

            expect(xsf.extstate).toEqual({ chars: 'A', count: 3 });

            xsf.transition('NEXT');

            expect(xsf.extstate).toEqual({ chars: 'AZA', count: 5 });
        });

        test('reducer side-effect called with xsf, reducerarg', async () => {
            const machine = Machine({
                key: 'test',
                initial: 'first',
                states: {
                    first: {
                        on: {
                            NEXT: 'second',
                        },
                    },
                    second: {
                        onEntry: [{ type: 'ping', foo: 123 }],
                    },
                },
            });

            const extstate = {
                bar: 1,
            };
            const effect = jest.fn();
            const reducer = Reducer.map({
                ping: Reducer.effect(effect),
            });

            const xsf = createStatefulMachine({ machine, reducer, extstate });
            xsf.init();

            xsf.transition('NEXT');

            await delay(50);

            expect(effect).toHaveBeenCalledTimes(1);
            expect(effect.mock.calls[0]).toHaveLength(2);
            expect(effect.mock.calls[0][0]).toBe(xsf);
            expect(effect.mock.calls[0][1]).toMatchObject({
                event: {
                    type: 'NEXT',
                },
                action: {
                    type: 'ping',
                    foo: 123,
                },
                state: {
                    value: 'second',
                    // plus other stuff
                },
                extstate: {
                    bar: 1,
                },
            });
        });

        test('reducer side-effect called, sync, after all updates to extstate', () => {
            const machine = Machine({
                key: 'test',
                initial: 'test',
                states: {
                    test: {
                        onEntry: [
                            'ping',
                            'checkCount',
                            'checkHasRunInc',
                            'inc',
                            'ping',
                        ],
                        on: {
                            NEXT: 'test',
                        },
                    },
                },
            });

            const extstate: ExtState = {
                count: 1,
            };

            let shouldPassCountCheck = false;
            let shouldPassRunCheck = false;
            let hasRunInc = false;

            const effect = jest.fn();
            const reducer = Reducer.map({
                inc: ({ extstate: xs }) => {
                    hasRunInc = true; // sneaky side-effect for testing only

                    return Reducer.update({
                        count: xs.count + 1,
                    });
                },
                ping: () => Reducer.effect(effect),
                checkCount: Reducer.effect(xsf => {
                    shouldPassCountCheck = xsf.extstate.count === 2;
                }),
                checkHasRunInc: Reducer.effect(() => {
                    shouldPassRunCheck = hasRunInc;
                }),
            });

            const xsf = createStatefulMachine({ machine, reducer, extstate });
            xsf.init();

            expect(effect).toHaveBeenCalledTimes(2);
            expect(shouldPassCountCheck).toBeTruthy();
            expect(shouldPassRunCheck).toBeTruthy();

            expect(effect.mock.calls[0][1]).toMatchObject({
                extstate: {
                    count: 1,
                },
            });
            expect(effect.mock.calls[1][1]).toMatchObject({
                extstate: {
                    count: 2,
                },
            });

            xsf.transition('NEXT');

            expect(effect).toHaveBeenCalledTimes(4);
        });

        test('reducer side-effect can call transition to change state', async () => {
            const machine = Machine({
                key: 'test',
                initial: 'first',
                states: {
                    first: {
                        on: {
                            NEXT: 'second',
                        },
                    },
                    second: {
                        onEntry: 'triggerNEXT',
                        on: {
                            NEXT: 'third',
                        },
                    },
                    third: {},
                },
            });

            const reducer = Reducer.map({
                triggerNEXT: Reducer.effect(xsf => xsf.transition('NEXT')),
            });

            const xsf = createStatefulMachine({ machine, reducer });
            xsf.init();

            xsf.transition('NEXT');
            await delay(50);

            expect(xsf.state.value).toBe('third');
        });

        test('reducer side-effect can be async', async () => {
            const machine = Machine({
                key: 'test',
                initial: 'first',
                states: {
                    first: {
                        on: {
                            NEXT: 'second',
                        },
                    },
                    second: {
                        onEntry: 'triggerNEXT',
                        on: {
                            NEXT: 'third',
                        },
                    },
                    third: {},
                },
            });

            const reducer = Reducer.map({
                triggerNEXT: Reducer.effect(async xsf => {
                    await delay(100);
                    xsf.transition('NEXT');
                }),
            });

            const xsf = createStatefulMachine({ machine, reducer });
            xsf.init();

            xsf.transition('NEXT');

            expect(xsf.state.value).toBe('second');

            await delay(200);

            expect(xsf.state.value).toBe('third');
        });
    });
});

// @flow

import { Machine } from 'xstate';

import createStatefulMachine from './createStatefulMachine';
import Reducer from './Reducer';

import { TYPE_REDUCER_RESULT as type } from './constants';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

describe('Reducer', () => {
    test('exists', () => {
        expect(Reducer).toBeDefined();
    });

    describe('noUpdate', () => {
        test('exists', () => {
            expect(Reducer).toHaveProperty('noUpdate');
            expect(Reducer.noUpdate).toBeInstanceOf(Function);
        });

        test('returns an appropriate Reducer value', () => {
            expect(Reducer.noUpdate()).toEqual({ type });
        });
    });

    describe('update', () => {
        test('exists', () => {
            expect(Reducer).toHaveProperty('update');
            expect(Reducer.update).toBeInstanceOf(Function);
        });

        test('returns an appropriate Reducer value', () => {
            const update = { foo: 123 };

            expect(Reducer.update(update)).toEqual({
                type,
                update,
            });
        });
    });

    describe('effect', () => {
        test('exists', () => {
            expect(Reducer).toHaveProperty('effect');
            expect(Reducer.effect).toBeInstanceOf(Function);
        });

        test('returns an appropriate Reducer value', () => {
            const effect = () => undefined;

            expect(Reducer.effect(effect)).toEqual({
                type,
                effect,
            });
        });
    });

    describe('updateWithEffect', () => {
        test('exists', () => {
            expect(Reducer).toHaveProperty('updateWithEffect');
            expect(Reducer.updateWithEffect).toBeInstanceOf(Function);
        });

        test('returns an appropriate Reducer value', () => {
            const update = { foo: 123 };
            const effect = () => undefined;

            expect(Reducer.updateWithEffect(update, effect)).toEqual({
                type,
                update,
                effect,
            });
        });
    });

    describe('map', () => {
        test('exists', () => {
            expect(Reducer).toHaveProperty('map');
            expect(Reducer.map).toBeInstanceOf(Function);
        });

        test('turns a plain object mapping keys to ReducerFns/Results into a ReducerFn', () => {
            const map = {
                foo: () => Reducer.noUpdate(),
            };

            expect(Reducer.map(map)).toBeInstanceOf(Function);
        });
    });

    describe('util', () => {
        describe('timeoutActivity', () => {
            test('exists', () => {
                expect(Reducer.util).toHaveProperty('timeoutActivity');
                expect(Reducer.util.timeoutActivity).toBeInstanceOf(Function);
            });

            test('ins and outs', () => {
                const timeout = Reducer.util.timeoutActivity({
                    activity: 'test',
                    ms: 2000,
                    event: 'PING',
                });

                expect(timeout).toHaveProperty('activity');
                expect(timeout.activity).toBe('test');

                expect(timeout).toHaveProperty('map');
                expect(timeout.map).toBeInstanceOf(Object);
            });

            test('calls transition after the desired delay', async () => {
                const timeout = Reducer.util.timeoutActivity({
                    activity: 'nextAfter100',
                    ms: 100,
                    event: 'NEXT',
                });

                const machine = Machine({
                    key: 'test',
                    initial: 'first',
                    states: {
                        first: {
                            activities: [timeout.activity],
                            on: {
                                NEXT: 'second',
                            },
                        },
                        second: {},
                    },
                });

                const reducer = Reducer.map({
                    ...timeout.map,
                });

                const xsf = createStatefulMachine({ machine, reducer });
                xsf.init();

                expect(xsf.state.value).toBe('first');

                await delay(150);

                expect(xsf.state.value).toBe('second');
            });

            test('does not call transition if we leave the state before the timeout', async () => {
                const timeout = Reducer.util.timeoutActivity({
                    activity: 'nextAfter100',
                    ms: 100,
                    event: 'NEXT',
                });

                const machine = Machine({
                    key: 'test',
                    initial: 'first',
                    states: {
                        first: {
                            activities: [timeout.activity],
                            on: {
                                NEXT: 'second',
                            },
                        },
                        second: {
                            on: {
                                NEXT: 'third',
                            },
                        },
                        third: {},
                    },
                });

                const reducer = Reducer.map({
                    ...timeout.map,
                });

                const xsf = createStatefulMachine({ machine, reducer });
                xsf.init();

                expect(xsf.state.value).toBe('first');

                xsf.transition('NEXT');

                expect(xsf.state.value).toBe('second');

                await delay(150);

                expect(xsf.state.value).toBe('second');
            });

            test('supports multiple independent timers', async () => {
                const timeout1 = Reducer.util.timeoutActivity({
                    activity: 'nextAfter100',
                    ms: 100,
                    event: 'NEXT',
                });

                const timeout2 = Reducer.util.timeoutActivity({
                    activity: 'nextAfter100_b',
                    ms: 200,
                    event: 'NEXT',
                });

                const machine = Machine({
                    key: 'test',
                    initial: 'running',
                    states: {
                        running: {
                            activities: [timeout1.activity, timeout2.activity],
                            initial: 'first',
                            states: {
                                first: {
                                    on: {
                                        NEXT: 'second',
                                    },
                                },
                                second: {
                                    on: {
                                        NEXT: 'third',
                                    },
                                },
                                third: {},
                            },
                        },
                    },
                });

                const reducer = Reducer.map({
                    ...timeout1.map,
                    ...timeout2.map,
                });

                const xsf = createStatefulMachine({ machine, reducer });
                xsf.init();

                await delay(125);

                expect(xsf.state.toString()).toBe('running.second');

                await delay(100);

                expect(xsf.state.toString()).toBe('running.third');
            });
        });

        describe('intervalActivity', () => {
            test('exists', () => {
                expect(Reducer.util).toHaveProperty('intervalActivity');
                expect(Reducer.util.intervalActivity).toBeInstanceOf(Function);
            });

            test('ins and outs', () => {
                const interval = Reducer.util.intervalActivity({
                    activity: 'test',
                    ms: 2000,
                    event: 'PING',
                });

                expect(interval).toHaveProperty('activity');
                expect(interval.activity).toBe('test');

                expect(interval).toHaveProperty('map');
                expect(interval.map).toBeInstanceOf(Object);
            });

            test('calls transition after the desired delay, repeatedly', async () => {
                const interval = Reducer.util.intervalActivity({
                    activity: 'nextAfter100',
                    ms: 100,
                    event: 'NEXT',
                });

                const machine = Machine({
                    key: 'test',
                    initial: 'parent',
                    states: {
                        parent: {
                            activities: [interval.activity],
                            initial: 'first',
                            states: {
                                first: {
                                    on: {
                                        NEXT: 'second',
                                    },
                                },
                                second: {
                                    on: {
                                        NEXT: 'first',
                                    },
                                },
                            },
                        },
                    },
                });

                const reducer = Reducer.map({
                    ...interval.map,
                });

                const xsf = createStatefulMachine({ machine, reducer });
                xsf.init();

                expect(xsf.state.value).toEqual({ parent: 'first' });

                await delay(125);

                expect(xsf.state.value).toEqual({ parent: 'second' });

                await delay(125);

                expect(xsf.state.value).toEqual({ parent: 'first' });
            });

            test('stops calling transition when we leave the state', async () => {
                const interval = Reducer.util.intervalActivity({
                    activity: 'nextAfter100',
                    ms: 100,
                    event: 'NEXT',
                });

                const machine = Machine({
                    key: 'test',
                    initial: 'running',
                    states: {
                        running: {
                            activities: [interval.activity],
                            initial: 'first',
                            states: {
                                first: {
                                    on: {
                                        NEXT: 'second',
                                    },
                                },
                                second: {
                                    on: {
                                        NEXT: '#stopped',
                                    },
                                },
                            },
                        },
                        stopped: {
                            id: 'stopped',
                        },
                    },
                });

                const reducer = Reducer.map({
                    ...interval.map,
                });

                const xsf = createStatefulMachine({ machine, reducer });
                xsf.init();

                expect(xsf.state.value).toEqual({ running: 'first' });

                await delay(125);

                expect(xsf.state.value).toEqual({ running: 'second' });

                await delay(250);

                expect(xsf.state.value).toBe('stopped');

                await delay(125);

                expect(xsf.state.value).toBe('stopped');
            });

            test('supports multiple independent timers', async () => {
                const interval1 = Reducer.util.intervalActivity({
                    activity: 'nextAfter100',
                    ms: 100,
                    event: 'NEXT',
                });

                const interval2 = Reducer.util.intervalActivity({
                    activity: 'nextAfter100_b',
                    ms: 200,
                    event: 'NEXT',
                });

                const machine = Machine({
                    key: 'test',
                    initial: 'running',
                    states: {
                        running: {
                            activities: [
                                interval1.activity,
                                interval2.activity,
                            ],
                            initial: 'first',
                            states: {
                                first: {
                                    on: {
                                        NEXT: 'second',
                                    },
                                },
                                second: {
                                    on: {
                                        NEXT: 'third',
                                    },
                                },
                                third: {},
                            },
                        },
                    },
                });

                const reducer = Reducer.map({
                    ...interval1.map,
                    ...interval2.map,
                });

                const xsf = createStatefulMachine({ machine, reducer });
                xsf.init();

                await delay(125);

                expect(xsf.state.toString()).toBe('running.second');

                await delay(100);

                expect(xsf.state.toString()).toBe('running.third');
            });
        });
    });
});

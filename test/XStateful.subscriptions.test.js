// @flow

import { Machine, State } from 'xstate';

import { createStatefulMachine, Reducer } from '..';

import configs from './fixtures';

describe('XStateful', () => {
    describe('change event handlers', () => {
        test('can add after init, not called', () => {
            const machine = Machine(configs.updown);
            const xsf = createStatefulMachine({ machine });
            const callback = jest.fn();

            xsf.init();
            xsf.on('change', callback);

            expect(callback).toHaveBeenCalledTimes(0);
        });

        test('can add before init, called on init', () => {
            const machine = Machine(configs.updown);
            const xsf = createStatefulMachine({ machine });
            const callback = jest.fn();

            xsf.on('change', callback);
            xsf.init();

            expect(callback).toHaveBeenCalledTimes(1);
        });

        test('can remove', () => {
            const machine = Machine(configs.updown);
            const xsf = createStatefulMachine({ machine });
            const callback1 = jest.fn();
            const callback2 = jest.fn();

            xsf.on('change', callback1);
            xsf.init();
            xsf.on('change', callback2);

            xsf.off('change', callback1);
            xsf.off('change', callback2);

            expect(callback1).toHaveBeenCalledTimes(1); // on init
            expect(callback2).toHaveBeenCalledTimes(0);
        });

        test('called on machine state change, unless removed', () => {
            const machine = Machine(configs.updown);
            const xsf = createStatefulMachine({ machine });
            const callback1 = jest.fn();
            const callback2 = jest.fn();

            xsf.init();
            xsf.on('change', callback1);
            xsf.on('change', callback2);

            xsf.off('change', callback2);

            xsf.transition('SWITCH');

            expect(callback1).toHaveBeenCalledTimes(1);
            expect(callback2).toHaveBeenCalledTimes(0);

            expect(callback1.mock.calls[0]).toHaveLength(1);
            expect(callback1.mock.calls[0][0]).toHaveProperty('state');
            expect(callback1.mock.calls[0][0]).toHaveProperty('extstate');
            expect(callback1.mock.calls[0][0].state).toBeInstanceOf(State);
            expect(callback1.mock.calls[0][0].state).toBe(xsf.state);
            expect(callback1.mock.calls[0][0].extstate).toBe(xsf.extstate);
        });

        test('called on extended state change, unless removed', () => {
            const machine = Machine(configs.updown);
            const extstate = {
                foo: 0,
            };
            const xsf = createStatefulMachine({ machine, extstate });
            const callback1 = jest.fn();
            const callback2 = jest.fn();

            xsf.init();
            xsf.on('change', callback1);
            xsf.on('change', callback2);

            xsf.off('change', callback2);

            xsf.setExtState({ foo: 1 });

            expect(callback1).toHaveBeenCalledTimes(1);
            expect(callback2).toHaveBeenCalledTimes(0);

            expect(callback1.mock.calls[0]).toHaveLength(1);
            expect(callback1.mock.calls[0][0]).toHaveProperty('state');
            expect(callback1.mock.calls[0][0]).toHaveProperty('extstate');
            expect(callback1.mock.calls[0][0].state).toBeInstanceOf(State);
            expect(callback1.mock.calls[0][0].state).toBe(xsf.state);
            expect(callback1.mock.calls[0][0].extstate).toBe(xsf.extstate);
        });

        test('can set "this" context on add', () => {
            const machine = Machine(configs.updown);
            const extstate = {
                foo: 0,
            };
            const xsf = createStatefulMachine({ machine, extstate });
            const callback = jest.fn().mockReturnThis();

            xsf.init();
            xsf.on('change', callback, xsf);

            xsf.setExtState({ foo: 1 });

            expect(callback).toHaveBeenCalledTimes(1);
            // $FlowFixMe
            expect(callback).toHaveReturnedWith(xsf);
        });

        test('called once if reducer effect causes state change', () => {
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
            const callback = jest.fn();

            xsf.init();
            xsf.on('change', callback);
            xsf.transition('NEXT');

            expect(xsf.state.value).toBe('third');
            expect(callback).toHaveBeenCalledTimes(1);
        });
    });

    describe('action, before-actions, after-actions event handlers', () => {
        const machine = Machine({
            key: 'test',
            initial: 'first',
            states: {
                first: {
                    on: {
                        NEXT: {
                            first: {
                                actions: ['ping', 'pong'],
                            },
                        },
                    },
                },
            },
        });

        test('before-actions called', () => {
            const xsf = createStatefulMachine({ machine });
            const callback = jest.fn();

            xsf.on('before-actions', callback);

            xsf.init();

            expect(callback).toHaveBeenCalledTimes(0);

            xsf.transition('NEXT');

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback.mock.calls[0]).toHaveLength(1);
            expect(callback.mock.calls[0][0]).toEqual([
                { type: 'ping' },
                { type: 'pong' },
            ]);
        });

        test('after-actions called', () => {
            const xsf = createStatefulMachine({ machine });
            const callback = jest.fn();

            xsf.on('after-actions', callback);

            xsf.init();

            expect(callback).toHaveBeenCalledTimes(0);

            xsf.transition('NEXT');

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback.mock.calls[0]).toHaveLength(1);
            expect(callback.mock.calls[0][0]).toEqual([
                { type: 'ping' },
                { type: 'pong' },
            ]);
        });

        test('action called, for each, in order', () => {
            const extstate = { foo: 123 };
            const xsf = createStatefulMachine({ machine, extstate });
            const callback = jest.fn();

            xsf.on('action', callback);

            xsf.init();

            expect(callback).toHaveBeenCalledTimes(0);

            xsf.transition('NEXT');

            expect(callback).toHaveBeenCalledTimes(2);

            expect(callback.mock.calls[0]).toHaveLength(1);
            expect(callback.mock.calls[0][0]).toMatchObject({
                event: {
                    type: 'NEXT',
                },
                action: {
                    type: 'ping',
                },
                state: {
                    value: 'first',
                },
                extstate: {
                    foo: 123,
                },
            });
            expect(callback.mock.calls[0][0].state).toBe(xsf.state);
            expect(callback.mock.calls[0][0].extstate).toBe(extstate);

            expect(callback.mock.calls[1]).toHaveLength(1);
            expect(callback.mock.calls[1][0]).toMatchObject({
                event: {
                    type: 'NEXT',
                },
                action: {
                    type: 'pong',
                },
                state: {
                    value: 'first',
                },
                extstate: {
                    foo: 123,
                },
            });
            expect(callback.mock.calls[0][0].state).toBe(xsf.state);
            expect(callback.mock.calls[0][0].extstate).toBe(extstate);
        });

        test('before-actions, then each action, then after-actions', () => {
            const names = [];

            const xsf = createStatefulMachine({ machine });
            const callback = name => () => names.push(name);

            xsf.on('before-actions', callback('before-actions'));
            xsf.on('action', callback('action'));
            xsf.on('after-actions', callback('after-actions'));

            xsf.init();

            xsf.transition('NEXT');

            expect(names).toEqual([
                'before-actions',
                'action',
                'action',
                'after-actions',
            ]);
        });
    });
});

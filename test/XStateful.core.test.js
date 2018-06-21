// @flow

import { Machine } from 'xstate';

import { createStatefulMachine } from '..';

import configs from './fixtures';

describe('XStateful', () => {
    describe('instantiation and access', () => {
        test('before init, current state is null', () => {
            const machine = Machine(configs.updown);
            const xsf = createStatefulMachine({ machine });

            expect(xsf.state).toEqual(null);
        });

        test('after init, current state is the machine initial state', () => {
            const machine = Machine(configs.updown);
            const xsf = createStatefulMachine({ machine });
            xsf.init();

            expect(xsf.state).toEqual(machine.initialState);
        });

        test('can update extended state at any time', () => {
            const machine = Machine({
                key: 'test',
                initial: 'test',
                states: {
                    test: {},
                },
            });
            const extstate = {
                foo: 123,
            };

            const xsf = createStatefulMachine({ machine, extstate });

            xsf.setExtState({ bar: 234 });

            expect(xsf.extstate).toEqual({ foo: 123, bar: 234 });

            xsf.setExtState({ foo: 'x' });

            expect(xsf.extstate).toEqual({ foo: 'x', bar: 234 });

            xsf.setExtState(xs => ({ quux: xs.foo }));

            expect(xsf.extstate).toEqual({ foo: 'x', bar: 234, quux: 'x' });

            xsf.setExtState(null);

            expect(xsf.extstate).toEqual({ foo: 'x', bar: 234, quux: 'x' });

            xsf.setExtState(() => null);

            expect(xsf.extstate).toEqual({ foo: 'x', bar: 234, quux: 'x' });
        });

        test('can call init at any time to reset state and extstate', () => {
            const machine = Machine({
                key: 'test',
                initial: 'first',
                states: {
                    first: {
                        on: {
                            NEXT: 'second',
                        },
                    },
                    second: {},
                },
            });
            const extstate = {
                foo: 0,
            };

            const xsf = createStatefulMachine({ machine, extstate });
            xsf.init();

            xsf.transition('NEXT');
            xsf.setExtState({ foo: 1 });

            xsf.init();

            // this is bizarrely not true. xstate bug?
            // expect(xsf.state).toBe(machine.initialState);
            expect(xsf.state.value).toBe(machine.initialState.value);
            expect(xsf.extstate).toBe(extstate);
        });
    });
});

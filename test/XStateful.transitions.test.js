// @flow

import { Machine } from 'xstate';

import { createStatefulMachine } from '..';

import configs from './fixtures';

describe('XStateful', () => {
    describe('transitions', () => {
        test('can transition using an event and access the new state', () => {
            const machine = Machine(configs.updown);
            const xsf = createStatefulMachine({ machine });
            xsf.init();

            xsf.transition('SWITCH');
            expect(xsf.state.value).toEqual('up');

            xsf.transition('SWITCH');
            expect(xsf.state.value).toEqual('down');
        });

        test('pass extended state to guard - fail guard 1', () => {
            const machine = Machine(configs.guard);
            const extstate = {
                hello: false,
            };
            const xsf = createStatefulMachine({ machine, extstate });
            xsf.init();

            expect(xsf.state.value).toEqual('started');

            xsf.transition({ type: 'BUMP', goodbye: true });

            expect(xsf.state.value).toEqual('stopped');
        });

        test('pass extended state to guard - fail guard 2', () => {
            const machine = Machine(configs.guard);
            const extstate = {
                hello: true,
            };
            const xsf = createStatefulMachine({ machine, extstate });
            xsf.init();

            expect(xsf.state.value).toEqual('started');

            xsf.transition({ type: 'BUMP', goodbye: false });

            expect(xsf.state.value).toEqual('stopped');
        });

        test('pass extended state to guard - pass guard', () => {
            const machine = Machine(configs.guard);
            const extstate = {
                hello: true,
            };
            const xsf = createStatefulMachine({ machine, extstate });
            xsf.init();

            expect(xsf.state.value).toEqual('started');

            xsf.transition({ type: 'BUMP', goodbye: true });

            expect(xsf.state.value).toEqual('bumped');
        });
    });
});

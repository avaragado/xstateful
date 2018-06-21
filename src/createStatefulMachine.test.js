// @flow

import type { MachineConfig } from 'xstate';
import { Machine } from 'xstate';

import createStatefulMachine from './createStatefulMachine';
import XStateful from './XStateful';

const config: MachineConfig = {
    key: 'updown',
    initial: 'down',
    states: {
        up: {
            on: {
                SWITCH: 'down',
            },
        },
        down: {
            on: {
                SWITCH: 'up',
            },
        },
    },
};

describe('createStatefulMachine', () => {
    test('cannot pass nothing', () => {
        const fn = () => {
            // $FlowFixMe (deliberate error)
            createStatefulMachine();
        };

        expect(fn).toThrowErrorMatchingSnapshot();
    });

    test('must pass a machine key', () => {
        const fn = () => {
            // $FlowFixMe (deliberate error)
            createStatefulMachine({});
        };

        expect(fn).toThrowErrorMatchingSnapshot();
    });

    test('cannot pass an xstate config as machine', () => {
        const fn = () => {
            // $FlowFixMe (deliberate error)
            createStatefulMachine({ machine: config });
        };

        expect(fn).toThrowErrorMatchingSnapshot();
    });

    test('on success, return is an instance of XStateful', () => {
        const machine = Machine(config);
        const xsf = createStatefulMachine({ machine });

        expect(xsf).toBeInstanceOf(XStateful);
    });

    test('can pass extstate through to XStateful instance', () => {
        const machine = Machine(config);
        const extstate = { foo: 123 };
        const xsf = createStatefulMachine({ machine, extstate });

        expect(xsf.extstate).toBe(extstate);
    });

    test('can pass reducer which ends up seeing actions', () => {
        const machine = Machine({
            key: 'test',
            initial: 'first',
            states: {
                first: {
                    onEntry: 'ping',
                },
            },
        });
        const reducer = jest.fn();

        // $FlowFixMe (deliberate error)
        const xsf = createStatefulMachine({ machine, reducer });
        xsf.init();

        expect(reducer).toHaveBeenCalledTimes(1);
        expect(reducer.mock.calls[0]).toHaveLength(1);
        expect(reducer.mock.calls[0][0]).toHaveProperty('action');
        expect(reducer.mock.calls[0][0].action.type).toBe('ping');
    });
});

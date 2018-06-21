// @flow

import type { MachineConfig } from 'xstate';

type Configs = {
    [key: string]: MachineConfig,
};

const configs: Configs = {
    updown: {
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
    },

    guard: {
        key: 'guard',
        initial: 'started',
        states: {
            started: {
                on: {
                    BUMP: [
                        {
                            target: 'bumped',
                            cond: (extState, eventObj) =>
                                extState.hello && eventObj.goodbye,
                        },
                        {
                            target: 'stopped',
                        },
                    ],
                },
            },
            bumped: {},
            stopped: {},
        },
    },
};

export default configs;

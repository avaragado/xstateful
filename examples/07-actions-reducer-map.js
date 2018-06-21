const { Machine } = require('xstate');
const { createStatefulMachine, Reducer } = require('..');

const machine = Machine({
    key: 'actions-reducer-map',
    initial: 'down',
    states: {
        up: {
            on: {
                SWITCH: {
                    down: {
                        actions: [{ type: 'inc', key: 'down' }, 'incTotal'],
                    },
                },
            },
        },
        down: {
            on: {
                SWITCH: {
                    up: {
                        actions: [{ type: 'inc', key: 'up' }, 'incTotal'],
                    },
                },
            },
        },
    },
});

const extstate = {
    up: 0,
    down: 0,
    switches: 0,
};

// reducer maps let you reduce boilerplate.
// keys are action types, or activity types suffixed with ':start' or ':stop'.
// values are calls to Reducer methods, or functions returning calls to Reducer methods.
const reducer = Reducer.map({
    inc: Reducer.update(({ action, extstate: xs }) => ({
        [action.key]: xs[action.key] + 1,
    })),
    incTotal: Reducer.update(({ extstate: xs }) => ({
        switches: xs.switches + 1,
    })),

    // if the statechart had an activity type 'whistle':
    // 'whistle:start': ...
    // 'whistle:stop': ...
});

const xsf = createStatefulMachine({ machine, extstate, reducer });

const logState = ({ state, extstate: xs }) => {
    console.log(
        `state: ${state.value} -- switches: ${xs.switches} (${xs.up} up, ${
            xs.down
        } down)`,
    );
};

xsf.on('change', logState);

xsf.init();

xsf.transition('SWITCH');
xsf.transition('SWITCH');
xsf.transition('SWITCH');
xsf.transition('SWITCH');

xsf.off('change', logState);

// output:
// state: down -- switches: 0 (0 up, 0 down)
// state: up -- switches: 1 (1 up, 0 down)
// state: down -- switches: 2 (1 up, 1 down)
// state: up -- switches: 3 (2 up, 1 down)
// state: down -- switches: 4 (2 up, 2 down)

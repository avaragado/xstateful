const { Machine } = require('xstate');
// extra import
const { createStatefulMachine, Reducer } = require('..');

const machine = Machine({
    key: 'actions-reducer',
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

// xstateful passes a reducer the same as it passes an action handler.
// reducers must return the result of calling a Reducer static method.
const reducer = ({ action, extstate: xs }) => {
    switch (action.type) {
        case 'inc': {
            // sparse update
            return Reducer.update({ [action.key]: xs[action.key] + 1 });
        }

        case 'incTotal': {
            return Reducer.update({ switches: xs.switches + 1 });
        }

        default: {
            // explicitly say "nothing changed"
            return Reducer.noUpdate();
        }
    }
};

// pass your reducer as the "reducer" key in the argument
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

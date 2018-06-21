const { Machine } = require('xstate');
const { createStatefulMachine } = require('..');

const machine = Machine({
    key: 'actions-extstate',
    initial: 'down',
    states: {
        up: {
            on: {
                SWITCH: {
                    down: {
                        // actions can be objects: 'type' property is required
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

const xsf = createStatefulMachine({ machine, extstate });

const logState = ({ state, extstate: xs }) => {
    console.log(
        `state: ${state.value} -- switches: ${xs.switches} (${xs.up} up, ${
            xs.down
        } down)`,
    );
};

// a SWITCH event emits two actions, each of which modifies extstate, but the
// 'change' handler is called once, after all actions, for each SWITCH.
const handleAction = ({ action }) => {
    console.log(action.type);

    switch (action.type) {
        case 'inc': {
            xsf.setExtState(xs => ({ [action.key]: xs[action.key] + 1 }));
            break;
        }

        case 'incTotal': {
            xsf.setExtState(xs => ({ switches: xs.switches + 1 }));
            break;
        }

        default: {
            break;
        }
    }
};

xsf.on('change', logState);

xsf.on('action', handleAction, xsf);

xsf.init();

xsf.transition('SWITCH');
xsf.transition('SWITCH');
xsf.transition('SWITCH');
xsf.transition('SWITCH');

xsf.off('change', logState);
xsf.off('action', handleAction);

// output:
// state: down -- switches: 0 (0 up, 0 down)
// inc
// incTotal
// state: up -- switches: 1 (1 up, 0 down)
// inc
// incTotal
// state: down -- switches: 2 (1 up, 1 down)
// inc
// incTotal
// state: up -- switches: 3 (2 up, 1 down)
// inc
// incTotal
// state: down -- switches: 4 (2 up, 2 down)

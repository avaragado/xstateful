const { Machine } = require('xstate');
const { createStatefulMachine } = require('..');

const machine = Machine({
    key: 'log-changes',
    initial: 'down',
    states: {
        up: {
            on: {
                SWITCH: {
                    down: {
                        cond: extstate => extstate.canSwitch,
                    },
                },
            },
        },
        down: {
            on: {
                SWITCH: {
                    up: {
                        cond: extstate => extstate.canSwitch,
                    },
                },
            },
        },
    },
});

const extstate = {
    canSwitch: true,
    foo: 123,
};

const xsf = createStatefulMachine({ machine, extstate });

const log = ({ state, extstate: xs }) => {
    console.log(
        `state: ${state.value}, extstate: ${JSON.stringify(xs, null, 4)}`,
    );
};

// the event handler is called whenever state or extstate changes
// (you can compare object references: these objects are updated immutably).
xsf.on('change', log);

xsf.init(); // changes state (to initial state) => log

xsf.transition('SWITCH'); // changes state => log
xsf.setExtState({ canSwitch: !xsf.extstate.canSwitch }); // changes extstate => log
xsf.transition('SWITCH'); // no change in state or extstate => no log

// remove event handler.
// you can also use xsf.once(...) for one-time handlers.
xsf.off('change', log);

// output:
// state: down, extstate: {
//     "canSwitch": true,
//     "foo": 123
// }
// state: up, extstate: {
//     "canSwitch": true,
//     "foo": 123
// }
// state: up, extstate: {
//     "canSwitch": false,
//     "foo": 123
// }

const { Machine } = require('xstate');
const { createStatefulMachine } = require('..');

const machine = Machine({
    key: 'up-down',
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
});

// this function takes an object as argument: the property 'machine' is required
// and must be an xstate StateNode instance
const xsf = createStatefulMachine({ machine });

// the machine is inert until you call init.
// (call init later to reset to initial state and extstate).
xsf.init();

// xsf.state = the current machine state, as determined by xstate
console.log(xsf.state.value);
// down

// call the transition method to send an xstate event to the machine
xsf.transition('SWITCH');

console.log(xsf.state.value);
// up

xsf.transition('SWITCH');

console.log(xsf.state.value);
// down

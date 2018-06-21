const { Machine } = require('xstate');
const { createStatefulMachine } = require('..');

const machine = Machine({
    key: 'up-down-guard',
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

// an arbitrary object
const extstate = {
    canSwitch: true,
    foo: 123,
};

// pass the initial extended state as 'exstate' in the argument object
const xsf = createStatefulMachine({ machine, extstate });
xsf.init();

console.log(xsf.state.value);
// down

xsf.transition('SWITCH');

console.log(xsf.state.value);
// up

// xsf.extstate = the current extended state
// setExtState specifies a sparse update (any other properties untouched)
xsf.setExtState({ canSwitch: !xsf.extstate.canSwitch });

// alternative functional form, that takes the current extended state
// and returns a sparse update:
// xsf.setExtState(extstate => ({ canSwitch: !extstate.canSwitch }));

xsf.transition('SWITCH');

console.log(xsf.state.value);
// up

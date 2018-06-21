const { Machine } = require('xstate');
const { createStatefulMachine } = require('..');

const machine = Machine({
    key: 'actions-activities',
    initial: 'down',
    states: {
        up: {
            activities: ['humming'],
            on: {
                SWITCH: {
                    down: {
                        actions: ['buzz', 'click'],
                    },
                },
            },
        },
        down: {
            onEntry: ['ping'],
            onExit: ['pong'],
            on: {
                SWITCH: {
                    up: {
                        actions: ['honk'],
                    },
                },
            },
        },
    },
});

const xsf = createStatefulMachine({ machine });
let ix = 1;

const logState = ({ state }) => {
    console.log(`${ix} state: ${state.value}\n`);
    ix += 1;
};

const logAction = ({ action }) => {
    console.log(`${ix} action: ${JSON.stringify(action, null, 4)}\n`);
    ix += 1;
};

const logActions = phase => actions => {
    console.log(
        `${ix} ${phase} actions: ${JSON.stringify(actions, null, 4)}\n`,
    );
    ix += 1;
};

xsf.on('change', logState);

// the 'action' event occurs whenever a transition results in actions or
// activity start/stop. you see one event per action, with separate events for
// activity start and activity stop.
xsf.on('action', logAction);

// the 'before-actions' and 'after-actions' events occur before and after
// all 'action' events for a transition.
xsf.on('before-actions', logActions('before'));
xsf.on('after-actions', logActions('after'));

// numbers in comments relate to output shown below

xsf.init(); // 1, 2, 3, 4

xsf.transition('SWITCH'); // 5, 6, 7, 8, 9, 10
xsf.transition('SWITCH'); // 11, 12, 13, 14, 15, 16, 17

xsf.off('change', logState);
xsf.off('action', logAction);

// output:
// 1 before actions: [
//     {
//         "type": "ping"
//     }
// ]
//
// 2 action: {
//     "type": "ping"
// }
//
// 3 after actions: [
//     {
//         "type": "ping"
//     }
// ]
//
// 4 state: down
//
// 5 before actions: [
//     {
//         "type": "pong"
//     },
//     {
//         "type": "honk"
//     },
//     {
//         "type": "xstate.start",
//         "activity": "humming",
//         "data": {
//             "type": "humming"
//         }
//     }
// ]
//
// 6 action: {
//     "type": "pong"
// }
//
// 7 action: {
//     "type": "honk"
// }
//
// 8 action: {
//     "type": "xstate.start",
//     "activity": "humming",
//     "data": {
//         "type": "humming"
//     }
// }
//
// 9 after actions: [
//     {
//         "type": "pong"
//     },
//     {
//         "type": "honk"
//     },
//     {
//         "type": "xstate.start",
//         "activity": "humming",
//         "data": {
//             "type": "humming"
//         }
//     }
// ]
//
// 10 state: up
//
// 11 before actions: [
//     {
//         "type": "xstate.stop",
//         "activity": "humming",
//         "data": {
//             "type": "humming"
//         }
//     },
//     {
//         "type": "buzz"
//     },
//     {
//         "type": "click"
//     },
//     {
//         "type": "ping"
//     }
// ]
//
// 12 action: {
//     "type": "xstate.stop",
//     "activity": "humming",
//     "data": {
//         "type": "humming"
//     }
// }
//
// 13 action: {
//     "type": "buzz"
// }
//
// 14 action: {
//     "type": "click"
// }
//
// 15 action: {
//     "type": "ping"
// }
//
// 16 after actions: [
//     {
//         "type": "xstate.stop",
//         "activity": "humming",
//         "data": {
//             "type": "humming"
//         }
//     },
//     {
//         "type": "buzz"
//     },
//     {
//         "type": "click"
//     },
//     {
//         "type": "ping"
//     }
// ]
//
// 17 state: down

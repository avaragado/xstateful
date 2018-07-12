# @avaragado/xstateful

> A wrapper for `xstate` that stores state, handles transitions, emits events for state changes and actions/activities, and includes an optional reducer framework for updating state and invoking side-effects

## Features

An `XStateful` instance:

-   Stores current machine state for an `xstate` instance
-   Stores current extended state
-   Includes a `transition` method for updating machine state based on events
-   Includes a `setExtState` method for updating extended state
-   Emits `change` events when machine state or extended state change
-   Emits `action` events when a new machine state includes actions or activities

The `createStatefulMachine` export adds a reducer framework for handling actions/activities:

-   Supports Redux-like reducer functions or a map of them indexed by action/activity type
-   Uses ReasonReact-like reducer return values to declare extended state updates, or side-effects, or both
-   Supports delayed events ("send event after N ms") and periodic events ("send event every N ms")

## Why?

[Statecharts](https://statecharts.github.io/) are a great way to model user interfaces and user interaction. We use them in projects implicitly and poorly without even noticing: often as multiple independent booleans, relying on randomly distributed business logic to constrain them to reality. This makes behaviour hard to model, visualise and test. [`xstate`](https://github.com/davidkpiano/xstate) lets us separate this behaviour from the nuts and bolts of the user interface itself.

`xstate` is designed to manage the statechart, offering a pure function per machine that returns the next machine state given the current machine state and an event. It doesn't remember that new machine state, or the additional non-machine state ("extended state") required in real-world usage. Neither does it trigger any actions or activities your statechart defines: it tells you what to do, and leaves the rest up to you. `xstateful` adds these features.

Other packages offer these features too, but closely coupled to specific libraries such as Redux or React. If your app needs both to connect `xstate` machines to Redux, and to use simpler machines in a React UI that don't need to use Redux, you might end up using multiple different approaches simultaneously: more cognitive load and bigger bundles. `xstateful` simply wraps `xstate` in an instance of an `XStateful` class that adds extended state and event emitting, and provides a clean way to update extended state and perform side-effects based on machine actions and activities.

(To use `xstateful` with React, see [`@avaragado/xstateful-react`](https://github.com/avaragado/xstateful-react).)

## Terminology

Most terminology is as used in `xstate`, often qualified to try to reduce ambiguity. These are terms like _action_, _activity_, _machine_, _(machine) event_, _(machine) state_, _extended state_ and _transition_.

The term _reducer_ is mildly abused, but the sense is very similar to Redux and influenced by [ReasonReact](https://reasonml.github.io/reason-react/docs/en/state-actions-reducer.html).

## Installation

```bash
$ yarn add xstate @avaragado/xstateful
$ # or
$ npm install xstate @avaragado/xstateful
```

## Getting started

In summary:

1.  Design and build an `xstate` machine, including any actions, activities and extended state requirements.
1.  Create an `xstateful` reducer to handle the actions and activities, updating extended state and defining side-effects.
1.  Call the `xstateful` function `createStatefulMachine`, passing the `xstate` machine, your initial extended state, and the reducer. This function returns an `XStateful` instance and ties its emitted actions/activities to your reducer.
1.  Add a `change` event listener to the `XStateful` instance to receive updates to machine state and extended state.
1.  Call the `XStateful` instance's `init` method to start the machine.
1.  Send events to the machine using the `XStateful` instance's `transition` method.
1.  Update extended state if necessary using the `XStateful` instance's `setExtState` method.

(You can use `xstateful` without the reducer extras: in this case, add `action` event listeners to process emitted actions and activities however you'd like.)

We'll introduce `xstateful`'s features using simple, working examples (we assume you're already familiar with `xstate`). You can run these examples online at https://codesandbox.io/s/mzwl9202q9.

### Example 1: up-down

This machine has no extended state, no actions, and no reducer.

```js
import { Machine } from 'xstate';
import { createStatefulMachine } from '@avaragado/xstateful';

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
```

-   `xstateful` supports any statechart that `xstate` supports: see the [xstate documentation](http://davidkpiano.github.io/xstate/docs/#/).
-   Pass `xstate` `StateNode` instances (returned by the `Machine` function), not configuration objects, to the `xstateful` function `createStatefulMachine`.
-   Call the `XStateful` instance's `init` method to start the machine. Its machine state is `null` before you call `init`.
-   Call the `init` method later to completely reset the machine.
-   Find the current machine state, according to `xstate`, in the `XStateful` instance's `state` field.
-   Call an `XStateful` instance's `transition` method to send an event to the `xstate` machine and store the resulting state. (The instance calls the `xstate` `transition` method under the hood.)
-   You can call `transition` with a string event name like `SWITCH`, or a more complex event object such as `{ type: 'DIGIT', char: '6' }`.

### Example 2: up-down-guard

Let's add some extended state, and use that in some transition guards.

```js
import { Machine } from 'xstate';
import { createStatefulMachine } from '@avaragado/xstateful';

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
```

-   Extended state is an object: it can contain anything.
-   Find the current extended state in the `XStateful` instance's `extstate` field.
-   An `XStateful` instance manages extended state and has a method `setExtState` to modify it.
-   Pass a sparse update object, _or_ a function from current extended state to a sparse update object, as the argument to `setExtState`.
-   A falsy update means the extended state isn't changed.
-   An `XStateful` instance automatically passes extended state to any guards in your statechart.

### Example 3: log-changes

We can subscribe to changes to machine state and extended state by adding handlers for the `change` event.

`XStateful` extends [`tiny-emitter`](https://github.com/scottcorgan/tiny-emitter) under the hood.

```js
import { Machine } from 'xstate';
import { createStatefulMachine } from '@avaragado/xstateful';

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
```

-   An `XStateful` instance has the `tiny-emitter` instance methods `on`, `once`, and `off` to manage event listeners.
-   The `XStateful` instance emits a `change` event whenever the machine state or extended state changes.
-   Machine state and extended state are immutable: there'll be a new object reference when they change.

### Example 4: actions-activities

Let's add actions and activities to our statechart (and remove the guards).

```js
import { Machine } from 'xstate';
import { createStatefulMachine } from '@avaragado/xstateful';

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
```

-   An `XStateful` instance fires `before-actions`, `action` and `after-actions` events while processing the actions and activities that `xstate` emits for a state transition.
-   Synchronously, an `XStateful` instance first fires `before-actions`, then one `action` event per action or activity start/stop, in order, then finally `after-actions`.
-   All actions and activities are described in object form, with a `type` property matching the string name of the action.
-   `xstate` emits separate "actions" for activity start and activity stop. These action objects have:
    -   A `type` property with a magic value indicating activity start or stop
    -   An `activity` property with a string value identifying the activity
    -   A `data` property containing the original activity in object form (so `data.type` will exist, and be the same as `activity`)
-   `xstateful` exports an object `ACTION_TYPE` with string properties `ACTIVITY_START` and `ACTIVITY_STOP` to test for magic activity `type` values. (I should probably export functions instead.)
-   `xstateful` calls `before-actions` and `after-actions` event handlers with the array of action objects it is about to process or has just processed.
-   `xstateful` calls `action` event handlers with an object containing these properties:
    -   `state` — The machine state at the time of the action (the target state of any transition).
    -   `extstate` — The extended state at the time of the action (possibly updated by previous actions).
    -   `event` — The event triggering the action, or null if none. If not null, this is always an object with a `type` property.
    -   `action` — The action details. This is always an object with a `type` property.

### Example 5: actions-extstate

Let's see how actions can modify extended state.

```js
import { Machine } from 'xstate';
import { createStatefulMachine } from '@avaragado/xstateful';

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
```

-   Machine configurations can specify actions as objects to pass arbitrary static data to the handler. The `XStateful` instance passes action objects unchanged to the handler.
-   An `action` handler can call the `XStateful` instance's `setExtState` method synchronously to modify extended state.
-   Any subsequent `action` handlers for the same event see the updated extended state.
-   The `XStateful` instance calls any `change` handler once, after _all_ `action` handlers, if extended state has changed.

### Example 6: actions-reducer

Now let's start using `xstateful`'s reducer functionality.

You may be familiar with _reducers_ from Redux and similar state management libraries. In Redux, a reducer is a pure function of both the current state and a Redux action, and it returns the next state. You compose Redux reducers to form a single root reducer that transforms your store's state immutably.

`xstateful` uses a similar but slightly different approach, more like [ReasonReact](https://reasonml.github.io/reason-react/docs/en/state-actions-reducer.html). The purpose of an `xstateful` reducer is to specify, given a statechart event, an emitted action, the current machine state, and the current extended state, both _how the extended state should change_ (if at all) and _any side effects to perform_ (if any). You can write reducers in various styles, ranging from "almost Redux" to "hardly any boilerplate".

**Aside: Naming things is hard** The closest equivalent to a Redux _action_ ("something happened in userland") is an `xstate` _event_, not an action. The `xstate` machine _emits_ actions and starts/stops activities, according to its configuration, and your reducers respond primarily to those actions and activities. Redux _state_ is most like `xstateful`'s _extended state_.

Let's modify example 5 to use a reducer.

```js
import { Machine } from 'xstate';
// extra import
import { createStatefulMachine, Reducer } from '@avaragado/xstateful';

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
```

-   Import `Reducer` from the `xstateful` package to start using reducers.
-   A reducer can be a function that takes `{ state, extstate, action, event }` (the same as an action handler) and returns the result of calling a static method on the `Reducer` object.
-   Include your reducer as the `reducer` key in the argument to `createStatefulMachine`.
-   Return `Reducer.noUpdate()` to indicate that extended state does not change.
-   Return `Reducer.update({ ... })` to declare a sparse update to extended state.
-   (Examples below describe how you declare side-effects, and how to reduce boilerplate)

### Example 7: actions-reducer-map

Example 6 shows a "traditional" Redux-like reducer: a single function that switches on action type. An alternative that avoids some of the switch/case boilerplate is a _reducer map_. Here's the same code, replacing the reducer function with a reducer map.

```js
import { Machine } from 'xstate';
import { createStatefulMachine, Reducer } from '@avaragado/xstateful';

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
```

-   Create a reducer by wrapping a reducer map object in a call to `Reducer.map`.
-   In a reducer map object, each key is either an action type, such as `inc`, or an activity type with a suffix `:start` or `:stop`, such as `whistle:start` or `whistle:stop`.
-   The values in a reducer map object are reducers themselves: either calls to `Reducer` static methods, or functions that return them. (You can't nest reducer maps.)

### Example 8: effects

In [ReasonReact](https://reasonml.github.io/reason-react/docs/en/state-actions-reducer.html), reducers can declare side-effects as well as updates to state. `xstateful` uses a similar approach. Code is code, so `xstateful` can't stop a reducer doing whatever it wants whenever it wants. But using a standard way to declare side-effects brings consistency and helps to make behaviour more predictable.

```js
import { Machine } from 'xstate';
import { createStatefulMachine, Reducer } from '@avaragado/xstateful';

// let's go async!
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const dtStart = new Date();
const stamp = () => Math.round((new Date() - dtStart) / 100) / 10;
const log = msg => console.log(`${stamp()}s  ${msg}`);

const machine = Machine({
    key: 'effects',
    initial: 'powerOff',
    states: {
        powerOff: {
            on: {
                SWITCH: 'powerOn',
            },
        },
        powerOn: {
            activities: ['log'],
            on: {
                SWITCH: 'powerOff',
            },
            initial: 'wheeze',
            states: {
                wheeze: {
                    // see comment before delayTick in the reducer about ordering
                    onEntry: ['delayTick', 'inc'],
                    on: {
                        TICK: 'groan',
                    },
                },
                groan: {
                    onEntry: 'delayTick',
                    on: {
                        TICK: 'wheeze',
                    },
                },
            },
        },
    },
});

const extstate = {
    count: 0,
};

const reducer = Reducer.map({
    // use effects for things that aren't synchronous updates to extended state,
    // such as logging, fetches, or delayed events
    'log:start': Reducer.effect(() => {
        log('POWER ON!');
    }),

    'log:stop': Reducer.effect(() => {
        log('POWER OFF!');
    }),

    inc: Reducer.update(({ extstate: xs }) => ({ count: xs.count + 1 })),

    // effects run after updates: even though delayTick appears before inc in
    // the onEntry value for powerOn.wheeze, the inc has already occurred when
    // the effect runs.
    delayTick: Reducer.effect(xsf => {
        // careful! this *always* fires, whichever state the machine is currently in
        setTimeout(() => xsf.transition('TICK'), 1000);
    }),
});

const xsf = createStatefulMachine({ machine, extstate, reducer });

const logState = ({ state, extstate: xs }) => {
    log(`state: ${state.toString()}, count: ${xs.count}`);
};

const run = async () => {
    xsf.on('change', logState);

    xsf.init();

    xsf.transition('SWITCH');

    await delay(5000);

    xsf.transition('SWITCH');

    xsf.off('change', logState);
};

run();

// output:
// 0s  state: powerOff, count: 0
// 0s  POWER ON!
// 0s  state: powerOn.wheeze, count: 1
// 1s  state: powerOn.groan, count: 1
// 2s  state: powerOn.wheeze, count: 2
// 3s  state: powerOn.groan, count: 2
// 4s  state: powerOn.wheeze, count: 3
// 5s  POWER OFF!
// 5s  state: powerOff, count: 3
```

-   Use side-effects for everything that isn't a synchronous update to extended state. Examples include logging, fetches and delayed events or updates.
-   Return `Reducer.effect(effect)` from a reducer to declare a side-effect.
-   Return `Reducer.updateWithEffect(update, effect)` from a reducer to declare both an update to extended state and a side-effect.
-   `xstateful` applies all extended state updates, in action order, before invoking all side-effects, in action order. Updates and side-effects are always applied/invoked synchronously.
    -   For example, if a machine emits actions `one`, `two`, `three` for a single transition, then any updates from `one` apply first, then updates from `two`, and finally updates from `three`. Then any declared side-effect functions are invoked: effects from `one`, then `two`, then `three`.
    -   The effects themselves can behave asynchronously. `xstateful` ignores any return value from an effect function, so it doesn't wait for any returned Promise to resolve.
-   For every side-effect, the `effect` function is called with two arguments: the `XStateful` instance, and `{ state, extstate, action, event }` (the same as an action handler). This function can do whatever it likes.
    -   Use the `XStateful` instance to access _current_ values for machine state and extended state, and to trigger any async transitions or async updates. (Because updates precede effects, the extended state value when an effect runs will incorporate the updates from _all_ actions.)
    -   Use the second argument to the `effect` function to access custom action data or event data needed for the side-effect. (The `state` and `extstate` properties of the second argument are the values as they were during the update pass through the actions. This data might occasionally be useful, but use with care.)
-   Side-effect functions can call the `XStateful` instance's `transition` and `setExtState` methods, synchronously or asynchronously. It's cleaner to use `Reducer.update` than to call `setExtState` synchronously from an effect.
-   No matter how many synchronous updates to extended state occur while `xstateful` processes actions, there's only one `change` event with the final values.

### Example 9: tick-tock

Some statecharts need automatic timed events: either a periodic event where the same event fires regularly, or a delayed event where an event is fired once after a certain period of time. In example 8, we used a `delayTick` action that fired `TICK` after a second using the standard JavaScript `setTimeout` function. This works, but there's a potential problem: using `setTimeout`, the event fires whether or not the machine is still in the same state. What if the new state responds to that event, and we don't want it to?

`xstateful` includes helpers for these scenarios, supporting periodic events and delayed events that fire only when the machine is in the correct state. They build on `xstate`'s support for activities, emitting start and stop actions when entering and leaving the state.

```js
import { Machine } from 'xstate';
import { createStatefulMachine, Reducer } from '@avaragado/xstateful';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const dtStart = new Date();
const stamp = () => Math.round((new Date() - dtStart) / 100) / 10;
const log = msg => console.log(`${stamp()}s  ${msg}`);

// use an interval activity to send an event periodically
// while in the same state.
const ticker = Reducer.util.intervalActivity({
    activity: 'tickEvery1s',
    ms: 1000,
    event: 'TICK',
});

// use a timeout activity to send a delayed event once
// while in the same state.
const autoOff = Reducer.util.timeoutActivity({
    activity: 'switchAfter5s',
    ms: 5000,
    event: 'SWITCH',
});

const machine = Machine({
    key: 'tick-tock',
    initial: 'powerOff',
    states: {
        powerOff: {
            on: {
                SWITCH: 'powerOn',
            },
        },
        powerOn: {
            // the activity property holds the name of the activity
            activities: ['log', ticker.activity, autoOff.activity],
            on: {
                SWITCH: 'powerOff',
            },
            initial: 'wheeze',
            states: {
                wheeze: {
                    activities: ['tick'],
                    on: {
                        TICK: 'groan',
                    },
                },
                groan: {
                    activities: ['tock'],
                    on: {
                        TICK: 'wheeze',
                    },
                },
            },
        },
    },
});

const reducer = Reducer.map({
    'log:start': Reducer.effect(() => {
        log('POWER ON!');
    }),

    'log:stop': Reducer.effect(() => {
        log('POWER OFF!');
    }),

    // spread the map property into the reducer map
    ...ticker.map,
    ...autoOff.map,
});

const xsf = createStatefulMachine({ machine, reducer });

const logChange = ({ state }) => {
    const tick = state.activities.tick ? 'TICK  <' : '       ';
    const tock = state.activities.tock ? '>  TOCK' : '       ';
    log(`${tick}----${tock}`);
};

const run = async () => {
    xsf.on('change', logChange);
    log('start');

    xsf.init();

    // powerOff -> powerOn.wheeze
    xsf.transition('SWITCH');

    await delay(7000);

    // as we wait, ticker fires TICK every second
    // but after 5 seconds, autoOff fires SWITCH.

    // manually restart
    xsf.transition('SWITCH');

    await delay(4000);

    // ticker and autoOff do their stuff again.
    // but before autoOff has time to fire, we manually power down.
    xsf.transition('SWITCH');

    // wait longer to prove that autoOff won't fire
    // (because it exited the state)
    await delay(5000);

    log('stop');
    xsf.off('change', logChange);
};

run();

// output:
// 0s  start
// 0s         ----
// 0s  POWER ON!
// 0s  TICK  <----
// 1s         ---->  TOCK
// 2s  TICK  <----
// 3s         ---->  TOCK
// 4s  TICK  <----
// 5s  POWER OFF!
// 5s         ----
// 7s  POWER ON!
// 7s  TICK  <----
// 8s         ---->  TOCK
// 9s  TICK  <----
// 10s         ---->  TOCK
// 11s  POWER OFF!
// 11s         ----
// 16s  stop
```

-   To use a delayed event or a periodic event:
    1.  Create an activity/map pair by calling `Reducer.util.timeoutActivity` or `Reducer.util.intervalActivity` with the name, the delay/period (in milliseconds) and the event (string or object) you want to fire. These methods return an object.
    1.  Use the object's `activity` property in the machine configuration, as an activity in the appropriate state. This is a string value (it's the name specified in the first step).
    1.  Spread the object's `map` property in the reducer map object. This adds `start` and `stop` reducers for the activity, to correctly create and cancel the events when entering and leaving the state.
-   Each activity has an internal handle for the timer. In the machine configuration, ensure the same activity never overlaps, or the handles will become overwritten.

## Reference

### Module exports

```js
import {
    createStatefulMachine,
    XStateful,
    Reducer,
    ACTION_TYPE,
} from '@avaragado/xstateful';
```

### `createStatefulMachine` function

#### `createStatefulMachine({ machine, reducer?, extstate? }) => XStateful`

Returns an `XStateful` instance for the `machine`, using the `reducer` for processing all actions the machine emits, and initialising with the extended state `extstate`.

-   `machine` is an `xstate` machine, as returned by the `Machine` function. (`xstate` type: `StateNode`)
-   `reducer` is a reducer function or value: see the `Reducer` section below. Defaults to no reducer.
-   `extstate` is an arbitrary object. Defaults to `{}`.

You don't need to call this function to use `xstateful`: you can create an instance of `XStateful` yourself and write your own event handlers for `xstate` actions. Using `createStatefulMachine` brings you the benefits of `xstateful`'s built-in handling for actions, activities and extended state.

### `XStateful` class

Instances of this class maintain the current machine state, plus the current extended state used for guards and other arbitrary machine-related data. This class inherits from `tiny-emitter` to provide event listener functionality (where "event" in this context is not the same as a state machine event).

Only the instance methods described here should be considered public.

#### `new XStateful({ machine, extstate })`

Creates an `XStateful` instance for the machine `machine`, with initial extended state `extstate`.

-   `machine` is an `xstate` machine, as returned by the `Machine` function. (`xstate` type: `StateNode`)
-   `extstate` is an arbitrary object. Specify `{}` if not using extended state.

#### `xsf.state`

Instance variable holding the current machine state, as described by `xstate`.

#### `xsf.extstate`

Instance variable holding the current extended state.

#### `xsf.on()`

Inherits from [`tiny-emitter`](https://github.com/scottcorgan/tiny-emitter).

#### `xsf.once()`

Inherits from [`tiny-emitter`](https://github.com/scottcorgan/tiny-emitter).

#### `xsf.off()`

Inherits from [`tiny-emitter`](https://github.com/scottcorgan/tiny-emitter).

#### `xsf.init()`

Places the machine in its initial state, and initialises extended state.

You must call `init` before calling the `transition` method. You may call `init` at any time to reset the machine state and extended state.

May fire `before-actions`, `action` and `after-actions` events (because the initial state may specify `onEntry` actions). Always fires a `change` event, after any action-related events (to notify the new machine and extended states).

#### `xsf.setExtState(updater)`

Modifies the extended state immutably. `updater` is:

-   _either_ a sparse object, which is merged immutably with the existing extended state
-   _or_ a function that's passed the current extended state, and returns a sparse object

If the sparse object supplied or returned is falsy, extended state does not change.

If extended state changes, the instance fires a `change` event.

#### `xsf.transition(event)`

Calls the underlying `xstate` machine's `transition` method, passing the instance's current state and extended state, and the `event`, and stores the resulting state.

`event` is _either_ a string event type (such as `SWITCH`), or an object with a string `type` property (such as `{ type: 'ALPHA', char: 'x' }`. Use the object form to send arbitrary data with the event. (This value is an `xstate` `Event` type.)

If the new state declares any actions or activities, the instance fires the appropriate `before-actions`, `action` and `after-actions` events. (If you're using `createStateMachine`, these are handled for you. If not, add listeners for these yourself to handle them.)

### `Reducer` class

The `Reducer` class contains static methods to help you build a reducer to supply to `createStateMachine`. The reducer is used for each action the statechart emits during a transition. You don't use `Reducer` if you make `XStateful` instances yourself.

Some descriptions mention a `ReducerArg` type. This is an object with these properties:

-   `state`: a machine state value
-   `extstate`: an extended state value
-   `event`: an event object
-   `action`: an action object

If the extended state has changed after the reducer has processed all actions the machine emits for a transition, then an `XStateful` instance fires a `change` event.

The reducer value you pass to `createStateMachine` is:

-   _either_ the result of calling `Reducer.map`,
-   _or_ the result of calling one of the `Reducer` static methods `noUpdate`, `update`, `effect` and `updateWithEffect`,
-   _or_ a function that returns one of those four static methods. The function is passed a `ReducerArg` value.

#### `Reducer.noUpdate()`

Declares a reducer return value that makes no changes to extended state and has no side-effects.

#### `Reducer.update(updater)`

Declares a reducer return value that updates extended state and has no side-effects. `updater` is:

-   _either_ a sparse object, which is merged immutably with the existing extended state
-   _or_ a function that's passed a `ReducerArg` value and returns a sparse object

If the sparse object supplied or returned is falsy, extended state does not change.

For an ordered list of actions emitted by a transition, `xstateful` applies all updates, in action order, before invoking all effects declared by those actions.

#### `Reducer.effect(effect)`

Declares a reducer return value that has a side-effect, and does not update extended state.

`effect` is a function `(XStateful, ReducerArg) => void | Promise<void>`.

The effect function can be synchronous or asynchronous, and can call methods on the `XStateful` instance passed to it. The effect function's return value is ignored.

The `ReducerArg` value represents the environment as it was during the update phase for this action: its `extstate` property incorporates all updates made by earlier actions in the list, and none by later actions.

For an ordered list of actions emitted by a transition, `xstateful` invokes all effects, in action order, after all updates by those actions.

#### `Reducer.updateWithEffect(updater, effect)`

Declares a reducer return value that both updates extended state and has side-effects. The `updater` and `effect` arguments are as for the `update` and `effect` static methods.

#### `Reducer.map(map)`

Returns a reducer that composes smaller, action-specific reducers. Helps you minimise the boilerplate often involved with reducers by automatically mapping the action type to an appropriate action-specfic reducer.

`map` is an object:

-   Each key is _either_ an action type string, _or_ an activity type string with the suffix `:start`: or `:stop`. The `:start` key applies when the machine enters a state with this activity, and the `:stop` key applies when the machine leaves that state.
-   Each value is _either_ the result of calling one of the `Reducer` static methods for declaring reducer results (`noUpdate`, `update`, `effect` or `updateWithEffect`), _or_ a function that returns such a result. That function is passed a `ReducerArg` value. You can't nest reducer maps.

#### `Reducer.util.timeoutActivity({ activity, ms, event }`)

Returns a helper object to let you declare delayed events easily. Use this method if you want to send a single delayed event to the machine, at a fixed period of time after entering a state.

-   `activity` is a string. This corresponds to an activity name, so make sure all your activity names are distinct.
-   `ms` is a period of time, in milliseconds.
-   `event` is an event type string, or an object with a `type` string (and other arbitrary data).

The object returned by this method has properties `activity` and `map`.

-   In your statechart, add the `activity` value to the `activities` array for a state. This ensures the machine starts and stops the activity when entering and leaving the state.
-   In your reducer map, spread the `map` value. This ensures the delay timer is created and cancelled.

Don't overlap timeout activities: don't specify an activity in a state if the same activity is already specified in an ancestor state.

#### `Reducer.util.intervalActivity({ activity, ms, event })`

Returns a helper object to let you declare periodic events easily. Use this method if you want to send an event to the machine repeatedly, at intervals of a fixed period of time, while in a certain machine state.

-   `activity` is a string. This corresponds to an activity name, so make sure all your activity names are distinct.
-   `ms` is a period of time, in milliseconds.
-   `event` is an event type string, or an object with a `type` string (and other arbitrary data).

The object returned by this method has properties `activity` and `map`.

-   In your statechart, add the `activity` value to the `activities` array for a state. This ensures the machine starts and stops the activity when entering and leaving the state.
-   In your reducer map, spread the `map` value. This ensures the interval timer is created and cancelled.

Don't overlap interval activities: don't specify an activity in a state if the same activity is already specified in an ancestor state.

### `ACTION_TYPE` object

This object contains two properties, for the magic action type strings used by `xstate` to represent the starting and stopping of an activity.

If you need to check for these magic action types, compare against `ACTION_TYPE.ACTIVITY_START` and/or `ACTION_TYPE.ACTIVITY_STOP`.

### Events fired

("Event" here = an event fired by the `xstateful` instance, not an event sent to the statechart in a transition.)

#### `before-actions`

Fired immediately before all `action` events for a transition. Not fired if a transition results in no actions.

Fired with one argument: the array of action objects associated with the transition.

#### `action`

Fired for a single action emitted as the result of a transition.

Fired with one argument: a `ReducerArg` (see the "`Reducer` class" section above). The `extstate` property incorporates all updates made by earlier actions in the list, and none by later actions.

#### `after-actions`

Fired immediately after all `action` events for a transition. Not fired if a transition results in no actions.

Fired with one argument: the array of action objects associated with the transition.

#### `change`

Fired when the machine state or extended state has changed. Fired at most once at initialisation time and for each transition, after all actions are processed.

Fired with one argument: `{ state, extstate }`.

## Meta

### Inspiration

-   [`xstate`](https://github.com/davidkpiano/xstate), by David Khourshid
-   [`react-finite-machine`](https://github.com/derek-duncan/react-finite-machine), by Derek Duncan

### Maintainer

David Smith (@avaragado)

### Contribute

Bug reports, feature requests and PRs are gratefully received. [Add an issue](https://github.com/avaragado/xstateful/issues/new) or submit a PR.

Please note that this project is released with a [Contributor Code of Conduct](code-of-conduct.md). By participating in this project you agree to abide by its terms.

### Developer notes

The `package.json` file contains all the usual scripts for linting, testing, building and releasing.

Buzzwords: prettier, eslint, flow, flow-typed, babel, jest, rollup.

#### Branches and merging

When merging to master **Squash and Merge**.

In the commit message, follow [conventional-changelog-standard conventions](https://github.com/bcoe/conventional-changelog-standard/blob/master/convention.md)

#### Releasing

When ready to release to npm:

1.  `git checkout master`
1.  `git pull origin master`
1.  `yarn release:dryrun`
1.  `yarn release`
1.  Engage pre-publication paranoia
1.  `git push --follow-tags origin master`
1.  `npm publish` - not yarn here as yarn doesn't seem to respect publishConfig

### Licence

[MIT](LICENSE.txt) © David Smith

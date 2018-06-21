// @flow

import Emitter from 'tiny-emitter';
import { StateNode, actions } from 'xstate';

import type { ExtState, State, Event, EventObject } from './types';

type Constructor = {|
    machine: StateNode,
    extstate: ExtState,
|};

class XStateful extends Emitter {
    machine: StateNode;

    state: State;
    extstate: ExtState;

    pvt: {
        ctChangeGuard: number,
        initialExtState: ExtState,
        initialState: State,
    };

    constructor({ machine, extstate }: Constructor) {
        super();

        this.machine = machine;
        this.extstate = extstate;
        this.state = null;

        this.pvt = {
            ctChangeGuard: 0,
            initialExtState: extstate,
            initialState: machine.initialState,
        };
    }

    init() {
        this.state = this.pvt.initialState;
        this.extstate = this.pvt.initialExtState;

        // need to handle any onEntry actions for the initial state.
        // these actions may modify extstate, causing a change notification.
        // as we want to ensure only one change notification, we add a guard.
        this.pvtGuardChangeNotification(() => {
            this.pvtInvokeActions(null);
        });
    }

    transition(event: Event) {
        const statePrevious = this.state;
        const stateNext = this.machine.transition(
            this.state,
            event,
            this.extstate,
        );

        if (stateNext === statePrevious) {
            return;
        }

        this.pvtGuardChangeNotification(() => {
            this.state = stateNext;
            this.pvtInvokeActions(actions.toEventObject(event)); // might call setExtState
        });
    }

    setExtState(updater: ?ExtState | ((xs: ExtState) => ?ExtState)) {
        const update =
            typeof updater === 'function' ? updater(this.extstate) : updater;

        if (!update) {
            return;
        }

        this.pvtGuardChangeNotification(() => {
            this.extstate = { ...this.extstate, ...update };
        });
    }

    // avoid multiple change notifications caused by recursive calls to setExtState via action events.
    pvtGuardChangeNotification(fn: () => void) {
        this.pvt.ctChangeGuard += 1;

        fn();

        this.pvt.ctChangeGuard -= 1;

        if (this.pvt.ctChangeGuard === 0) {
            this.emit('change', { state: this.state, extstate: this.extstate });
        }
    }

    pvtInvokeActions(event: EventObject) {
        if (this.state.actions.length === 0) {
            return;
        }

        const actionObjs = this.state.actions.map(action =>
            actions.toActionObject(action),
        );

        this.emit('before-actions', actionObjs.slice());

        actionObjs.map(action =>
            this.emit('action', {
                state: this.state,
                extstate: this.extstate,
                event,
                action: actions.toActionObject(action),
            }),
        );

        this.emit('after-actions', actionObjs.slice());
    }
}

export default XStateful;

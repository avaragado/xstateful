// @flow

import type { State as _State, StateNode } from 'xstate';

import typeof { TYPE_REDUCER_RESULT } from './constants';
import type XStateful from './XStateful';

// xstate

export type State = _State; // hacky way to re-export
export type EventType = string;
export type ActionType = string;

export type ActionObject = ?{
    type: ActionType,
    [key: string]: any,
};

export type EventObject = ?{
    type: EventType,
    [key: string]: any,
};

export type Event = EventType | EventObject;

// xstateful

export type ExtState = Object;

type ActionKey = string;
type ActivityKey = string;
type ActKey = ActionKey | ActivityKey;

export type ReducerArg = {
    state: State,
    extstate: ExtState,
    event: EventObject,
    action: ActionObject,
};

export type Effect = (XStateful, ReducerArg) => void | Promise<void>;
export type ClosedEffect = () => void | Promise<void>;

export type ReducerResult = {|
    type: TYPE_REDUCER_RESULT,
    update?: ExtState | (ReducerArg => ExtState),
    effect?: Effect,
|};

export type ReducerFn = (arg: ReducerArg) => ReducerResult;

export type ReducerMap = {
    [key: ActKey]: ReducerFn | ReducerResult,
};

export type ReducerSpec = ReducerFn | ReducerResult;

type CreatorSpec = {|
    machine: ?StateNode,
    reducer?: ReducerSpec,
    extstate?: ExtState,
|};

export type CreateStatefulMachine = CreatorSpec => XStateful;

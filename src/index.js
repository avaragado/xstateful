// @flow

import type {
    State,
    ExtState,
    Effect,
    ReducerArg,
    ReducerResult,
    ReducerFn,
    ReducerMap,
    ReducerSpec,
} from './types';

import { ACTION_TYPE } from './constants';
import createStatefulMachine from './createStatefulMachine';
import Reducer from './Reducer';
import XStateful from './XStateful';

export type {
    State,
    ExtState,
    Effect,
    ReducerArg,
    ReducerResult,
    ReducerFn,
    ReducerMap,
    ReducerSpec,
};

export { createStatefulMachine, XStateful, Reducer, ACTION_TYPE };

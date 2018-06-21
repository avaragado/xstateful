// @flow

import type { ReducerMap, ReducerFn } from './types';

import { REDUCER_RESULT, ACTION_TYPE } from './constants';

const invoke = (reducer, reducerarg) =>
    typeof reducer === 'function'
        ? reducer(reducerarg)
        : reducer || REDUCER_RESULT.NOUPDATE;

const getReducer = (reducer, actiontype) => {
    if (actiontype && reducer[actiontype]) {
        return reducer[actiontype];
    }

    return null;
};

const getActionType = action => {
    if (!action) {
        return null;
    }

    if (action.type === ACTION_TYPE.ACTIVITY_START) {
        return `${action.activity}:start`;
    }

    if (action.type === ACTION_TYPE.ACTIVITY_STOP) {
        return `${action.activity}:stop`;
    }

    return action.type;
};

const createReducerFromMap = (map: ReducerMap): ReducerFn => reducerarg =>
    invoke(getReducer(map, getActionType(reducerarg.action)), reducerarg);

export default createReducerFromMap;

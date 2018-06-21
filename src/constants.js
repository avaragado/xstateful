// @flow

import type { ReducerResult } from './types';

const TYPE_REDUCER_RESULT = 'xstateful.reducer-result';

const ACTION_TYPE = {
    ACTIVITY_START: 'xstate.start',
    ACTIVITY_STOP: 'xstate.stop',
};

const REDUCER_RESULT: { [key: string]: ReducerResult } = {
    NOUPDATE: { type: TYPE_REDUCER_RESULT },
};

export { TYPE_REDUCER_RESULT, ACTION_TYPE, REDUCER_RESULT };

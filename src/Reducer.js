// @flow

import type { ReducerArg, ReducerMap, ExtState, Effect, Event } from './types';

import { TYPE_REDUCER_RESULT as type, REDUCER_RESULT } from './constants';
import createReducerFromMap from './createReducerFromMap';

type TimerActivityIn = {|
    activity: string,
    ms: number,
    event: Event,
|};
type TimerActivityOut = {
    activity: string,
    map: ReducerMap,
};

const Reducer = {
    map: createReducerFromMap,

    noUpdate: () => REDUCER_RESULT.NOUPDATE,

    update: (update: ExtState | (ReducerArg => ExtState)) => ({ type, update }),

    effect: (effect: Effect) => ({ type, effect }),

    updateWithEffect: (update: ExtState, effect: Effect) => ({
        type,
        update,
        effect,
    }),

    util: {
        timeoutActivity: ({
            activity,
            ms,
            event,
        }: TimerActivityIn): TimerActivityOut => {
            let handle = null;

            const clear = () => {
                if (handle) {
                    clearTimeout(handle);
                }
            };

            const start = xsf => {
                clear();
                handle = setTimeout(() => xsf.transition(event), ms);
            };

            const stop = () => {
                clear();
                handle = null;
            };

            return {
                activity,
                map: {
                    [`${activity}:start`]: Reducer.effect(start),
                    [`${activity}:stop`]: Reducer.effect(stop),
                },
            };
        },

        intervalActivity: ({
            activity,
            ms,
            event,
        }: TimerActivityIn): TimerActivityOut => {
            let handle = null;

            const clear = () => {
                if (handle) {
                    clearInterval(handle);
                }
            };

            const start = xsf => {
                clear();
                handle = setInterval(() => xsf.transition(event), ms);
            };

            const stop = () => {
                clear();
                handle = null;
            };

            return {
                activity,
                map: {
                    [`${activity}:start`]: Reducer.effect(start),
                    [`${activity}:stop`]: Reducer.effect(stop),
                },
            };
        },
    },
};

export default Reducer;

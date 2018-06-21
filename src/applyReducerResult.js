// @flow

import type { ClosedEffect, ReducerArg, ReducerResult } from './types';
import type XStateful from './XStateful';

type Apply = ({
    xsf: XStateful,
    reducerarg: ReducerArg,
    reducerresult: ReducerResult,
}) => ?ClosedEffect;

const applyReducerResult: Apply = ({ xsf, reducerarg, reducerresult }) => {
    if (reducerresult.update) {
        const update =
            typeof reducerresult.update === 'function'
                ? reducerresult.update(reducerarg)
                : reducerresult.update;

        xsf.setExtState(update);
    }

    if (reducerresult.effect) {
        // destructure effect to keep flow happy
        const { effect } = reducerresult;

        // We pass the XStateful instance to an effect so it has easy access to
        // current values of state, extstate, and the transition method.
        // reducerarg contains values AT THE MOMENT OF THE ACTION, so the effect
        // can access the event, action, state, extstate values at that point.
        return () => effect(xsf, reducerarg);
    }

    return null;
};

export default applyReducerResult;

// @flow

import type { CreateStatefulMachine } from './types';

import XStateful from './XStateful';
import Reducer from './Reducer';
import getReducerResult from './getReducerResult';
import applyReducerResult from './applyReducerResult';

const argDefault = {
    machine: null,
    reducer: Reducer.map({}),
    extstate: {},
};

const createStatefulMachine: CreateStatefulMachine = arg => {
    const { machine, reducer, extstate } = {
        ...argDefault,
        ...arg,
    };

    if (
        !machine ||
        !machine.transition ||
        typeof machine.transition !== 'function'
    ) {
        throw new Error(
            'You must pass an instantiated xstate machine to createStatefulMachine',
        );
    }

    const xsf = new XStateful({ machine, extstate });
    let effects = [];

    xsf.on('before-actions', () => {
        effects = [];
    });

    xsf.on('action', reducerarg => {
        const effect = applyReducerResult({
            xsf,
            reducerarg,
            reducerresult: getReducerResult({ reducerarg, reducer }),
        });

        if (effect) {
            effects.push(effect);
        }
    });

    xsf.on('after-actions', () => {
        effects.forEach(eff => eff());
    });

    return xsf;
};

export default createStatefulMachine;

// @flow

import type { ReducerSpec, ReducerArg, ReducerResult } from './types';

import Reducer from './Reducer';
import { TYPE_REDUCER_RESULT } from './constants';

type Fn = ({
    reducerarg: ReducerArg,
    reducer: ReducerSpec,
}) => ReducerResult;

const ensureReducerResult = redres =>
    redres && redres.type === TYPE_REDUCER_RESULT ? redres : Reducer.noUpdate();

const invoke = (reducer, reducerarg) =>
    typeof reducer === 'function' ? reducer(reducerarg) : reducer;

const getReducerResult: Fn = ({ reducer, reducerarg }) =>
    ensureReducerResult(invoke(reducer, reducerarg));

export default getReducerResult;

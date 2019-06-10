import * as api from '..';
export type OperationHandler = (context: api.Context) => PromiseLike<api.Result> | api.Result;

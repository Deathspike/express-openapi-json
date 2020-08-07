import * as app from '.';
import * as apx from './internal';

export function content<T>(content: T, statusCode = 200, headers?: {[key: string]: string}) {
  return new app.Result(content, statusCode, headers);
}

export function createCore(openapi: app.IOpenApi) {
  return new app.Core(openapi);
}

export function createOperation(operationId: string) {
  return (controller: any, actionName: string) => apx.Metadata.for(controller).create(actionName, operationId);
}

export function status<T>(statusCode = 200, headers?: {[key: string]: string}) {
  return new app.Result<T>(undefined, statusCode, headers);
}

import * as app from '../..';

export class Operations {
  private readonly _openapi: app.IOpenApi;
  private readonly _operations: {[operationId: string]: {method: string, path: string, operation: app.IOpenApiOperation}};

  constructor(openapi: app.IOpenApi) {
    this._openapi = openapi;
    this._operations = {};
    this._init();
  }

  get(operationId: string) {
    if (this._operations[operationId]) {
      return this._operations[operationId];
    } else {
      throw new Error(`Unknown operation identifier: ${operationId}`);
    }
  }

  private _init() {
    for (const path in this._openapi.paths) {
      for (const method in this._openapi.paths[path]) {
        const operation = this._openapi.paths[path][method];
        if (operation.operationId) {
          if (this._operations[operation.operationId]) throw new Error(`Duplicate operation identifier: ${operation.operationId}`);
          this._operations[operation.operationId] = {path, method, operation};
        }
      }
    }
  }
}

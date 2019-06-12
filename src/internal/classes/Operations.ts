import * as api from '..';

export class Operations {
  private readonly _openapi: api.IOpenApi;
  private readonly _operations: {[operationId: string]: {method: string, path: string, operation: api.IOpenApiOperation}};
  private _isLoaded: boolean;

  constructor(openapi: api.IOpenApi) {
    this._isLoaded = false;
    this._openapi = openapi;
    this._operations = {};
  }

  get(operationId: string) {
    if (!this._isLoaded) {
      this._init();
      this._isLoaded = true;
    }
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

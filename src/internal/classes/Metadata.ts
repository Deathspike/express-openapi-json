import * as express from 'express';
const accessKey = '__api';

export class Metadata {
  private readonly _operations: {actionName: string, operationId: string, requestHandlers: express.RequestHandler[]}[];

  private constructor() {
    this._operations = [];
  }

  static for(controller: any): Metadata {
    return controller[accessKey] || (controller[accessKey] = new Metadata());
  }

  create(actionName: string, operationId: string, requestHandlers: express.RequestHandler[]) {
    this._operations.push({actionName, operationId, requestHandlers});
  }

  getAll() {
    return this._operations;
  }
}

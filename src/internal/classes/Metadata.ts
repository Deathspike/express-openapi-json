import * as api from '..';
import * as express from 'express';
const accessKey = '__api';

export class Metadata {
  private readonly _controller: any;
  private readonly _operations: {operationId: string, operationHandler: api.IOperationHandler, requestHandlers: express.RequestHandler[]}[];

  private constructor(controller: any) {
    this._controller = controller;
    this._operations = [];
  }

  static for(controller: any): Metadata {
    return controller[accessKey] || (controller[accessKey] = new Metadata(controller));
  }

  create(actionName: string, operationId: string, requestHandlers: express.RequestHandler[]) {
    const operationHandler = this._controller[actionName].bind(this._controller);
    this._operations.push({operationId, operationHandler, requestHandlers});
  }

  getAll() {
    return this._operations;
  }
}

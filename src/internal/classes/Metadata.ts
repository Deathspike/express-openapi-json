const accessKey = '__api';

export class Metadata {
  private readonly _operations: {actionName: string, operationId: string}[];

  private constructor() {
    this._operations = [];
  }

  static for(controller: any): Metadata {
    return controller[accessKey] || (controller[accessKey] = new Metadata());
  }

  create(actionName: string, operationId: string) {
    this._operations.push({actionName, operationId});
  }

  getAll() {
    return this._operations;
  }
}

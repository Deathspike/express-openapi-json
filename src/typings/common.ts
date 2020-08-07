import * as app from '..';

export interface IOperationHandler {
  (context: app.Context): PromiseLike<app.Result<any>> | app.Result<any>;
}

export interface IValidationContext {
  components: app.IOpenApiComponentList;
  requests: app.IOpenApiSchemaList;
  responses: app.IOpenApiSchemaList;
}

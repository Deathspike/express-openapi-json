import * as api from '..';

export interface IOperationHandler {
  (context: api.Context): PromiseLike<api.Result<any>> | api.Result<any>;
}

export interface IValidationContext {
  components: api.IOpenApiComponentList;
  requests: api.IOpenApiSchemaList;
  responses: api.IOpenApiSchemaList;
}

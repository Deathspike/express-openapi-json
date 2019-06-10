export interface IOpenApi {
  paths: IOpenApiPathList;
  components?: IOpenApiComponentList;
}

export interface IOpenApiComponentList {
  schemas?: IOpenApiSchemaList;
}

export interface IOpenApiOperation {
  operationId?: string;
  parameters?: IOpenApiOperationParameter[];
  requestBody?: IOpenApiOperationRequestBody;
  responses: IOpenApiOperationResponseList;
}

export interface IOpenApiOperationContent {
  schema?: IOpenApiSchema;
}

export interface IOpenApiOperationContentList {
  [contentType: string]: IOpenApiOperationContent;
}

export interface IOpenApiOperationParameter {
  in: string;
  name: string;
  required?: boolean;
  schema?: IOpenApiSchema;
}

export interface IOpenApiOperationRequestBody {
  required: boolean;
  content: IOpenApiOperationContentList;
}

export interface IOpenApiOperationResponse {
  $ref?: string;
  content?: IOpenApiOperationContentList;
}

export interface IOpenApiOperationResponseList {
  [responseKey: string]: IOpenApiOperationResponse;
}

export interface IOpenApiPathList {
  [path: string]: IOpenApiPathMethodList;
}

export interface IOpenApiPathMethodList {
  [method: string]: IOpenApiOperation;
}

export interface IOpenApiSchema extends IOpenApiSchemaCore {
  $ref?: string;
  type?: string;
}

export interface IOpenApiSchemaCore {
  properties?: {[propertyName: string]: IOpenApiSchema};
  required?: string[];
}

export interface IOpenApiSchemaList {
  [schemaName: string]: IOpenApiSchemaCore;
}

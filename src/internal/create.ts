import * as api from '.';

export function createSchemas(ajv: api.Ajv, openapi: api.IOpenApi) {
  for (const path in openapi.paths) {
    for (const method in openapi.paths[path]) {
      const operation = ajv.resolve(openapi.paths[path][method]);
      createOperationRequestSchema(ajv, openapi, operation);
      createOperationResponseSchemas(ajv, openapi, operation);
    }
  }
}

function createOperationRequestSchema(ajv: api.Ajv, openapi: api.IOpenApi, operation: api.IOpenApiOperation) {
  if (operation.operationId && (operation.parameters || operation.requestBody)) {
    const requestSchemaName = ajv.nameRequest(operation);
    const requestSchema: api.IOpenApiSchema = {};
    registerSchema(openapi, requestSchemaName, requestSchema);
    if (operation.parameters) {
      const parameters = ajv.resolve(operation.parameters);
      for (const unresolvedParameter of parameters) {
        const parameter = ajv.resolve(unresolvedParameter);
        const parameterSchema = ajv.resolve(parameter.schema);
        const containerName = parameter.in;
        registerSchemaParameter(containerName, requestSchema, parameter.name, parameter.required, parameterSchema);
      }
    }
    if (operation.requestBody) {
      const requestBody = ajv.resolve(operation.requestBody);
      const content = ajv.resolve(requestBody.content);
      const contentJson = ajv.resolve(content['application/json']);
      if (contentJson && contentJson.schema) {
        const containerName = 'requestBody';
        const containerSchema = ajv.resolve(contentJson.schema);
        registerSchemaContainer(containerName, requestBody.required, requestSchema);
        requestSchema.properties![containerName] = containerSchema;
      } else {
        throw new Error(`Invalid request body: ${operation.operationId}`);
      }
    }
  }
}

function createOperationResponseSchemas(ajv: api.Ajv, openapi: api.IOpenApi, operation: api.IOpenApiOperation) {
  if (operation.operationId) {
    for (const responseKey in operation.responses) {
      let response = ajv.resolve(operation.responses[responseKey]);
      if (response.content) {
        const content = ajv.resolve(response.content);
        const contentJson = content['application/json'];
        if (contentJson && contentJson.schema) {
          const responseSchemaName = ajv.nameResponse(operation, responseKey);
          const responseSchema = ajv.resolve(contentJson.schema);
          registerSchema(openapi, responseSchemaName, responseSchema);
        } else {
          throw new Error(`Invalid response content: ${operation.operationId} -> ${responseKey}`);
        }
      }
    }
  }
}

function registerSchema(openapi: api.IOpenApi, schemaName: string, schema: api.IOpenApiSchemaCore) {
  if (!openapi.components) openapi.components = {};
  if (!openapi.components.schemas) openapi.components.schemas = {};
  openapi.components.schemas[schemaName] = schema;
}

function registerSchemaContainer(containerName: string, containerRequired: boolean, requestSchema: api.IOpenApiSchema) {
  if (!requestSchema.required) requestSchema.required = [];
  if (!requestSchema.required.includes(containerName) && containerRequired) requestSchema.required.push(containerName);
  if (!requestSchema.properties) requestSchema.properties = {};
  if (!requestSchema.properties[containerName]) requestSchema.properties[containerName] = {required: [], properties: {}, type: 'object'};
}

function registerSchemaParameter(containerName: string, requestSchema: api.IOpenApiSchema, parameterName: string, parameterRequired?: boolean, parameterSchema?: api.IOpenApiSchema) {
  if (!parameterSchema) throw new Error(`Unspecified schema: ${parameterName}`);
  if (!parameterSchema.type) throw new Error(`Unspecified schema type: ${parameterName}`);
  if (!api.isPrimitive(parameterSchema.type)) throw new Error(`Invalid schema type: ${parameterName}`);
  registerSchemaContainer(containerName, true, requestSchema);
  requestSchema.properties![containerName]!.properties![parameterName] = parameterSchema;
  if (parameterRequired) requestSchema.properties![containerName]!.required!.push(parameterName);
}

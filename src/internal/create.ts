import * as api from '.';

export function createValidationContext(openapi: api.IOpenApi) {
  const validationContext: api.IValidationContext = {components: {}, requests: {}, responses: {}};
  const ajv = new api.Ajv(validationContext);
  validationContext.components.schemas = openapi.components && openapi.components.schemas;
  parse(ajv, openapi, validationContext);
  return validationContext;
}

function parse(ajv: api.Ajv, openapi: api.IOpenApi, validationContext: api.IValidationContext) {
  for (const path in openapi.paths) {
    for (const method in openapi.paths[path]) {
      const operation = ajv.resolve(openapi.paths[path][method]);
      parseOperationRequestSchema(ajv, operation, validationContext);
      parseOperationResponseSchemas(ajv, operation, validationContext);
    }
  }
}

function parseOperationRequestSchema(ajv: api.Ajv, operation: api.IOpenApiOperation, validationContext: api.IValidationContext) {
  if (operation.operationId && (operation.parameters || operation.requestBody)) {
    const requestSchemaName = ajv.nameRequest(operation);
    const requestSchema: api.IOpenApiSchema = {};
    validationContext.requests[requestSchemaName] = requestSchema;
    if (operation.parameters) {
      const parameters = ajv.resolve(operation.parameters);
      for (const unresolvedParameter of parameters) {
        const parameter = ajv.resolve(unresolvedParameter);
        const parameterSchema = ajv.resolve(parameter.schema);
        validateParameterConstraints(parameter.name, parameterSchema);
        registerSchemaContainer(parameter.in, true, requestSchema);
        requestSchema.properties![parameter.in]!.properties![parameter.name] = parameter.schema!; // Unresolved
        if (parameter.required) requestSchema.properties![parameter.in]!.required!.push(parameter.name);
      }
    }
    if (operation.requestBody) {
      const requestBody = ajv.resolve(operation.requestBody);
      const content = ajv.resolve(requestBody.content);
      const contentJson = ajv.resolve(content['application/json']);
      if (contentJson && contentJson.schema) {
        const required = requestBody.required || false;
        registerSchemaContainer('requestBody', required, requestSchema);
        requestSchema.properties!['requestBody'] = contentJson.schema; // Unresolved
      } else {
        throw new Error(`Invalid request body: ${operation.operationId}`);
      }
    }
  }
}

function parseOperationResponseSchemas(ajv: api.Ajv, operation: api.IOpenApiOperation, validationContext: api.IValidationContext) {
  if (operation.operationId) {
    for (const responseKey in operation.responses) {
      let response = ajv.resolve(operation.responses[responseKey]);
      if (response.content) {
        const content = ajv.resolve(response.content);
        const contentJson = content['application/json'];
        if (contentJson && contentJson.schema) {
          const responseSchemaName = ajv.nameResponse(operation, responseKey);
          const responseSchema = contentJson.schema; // Unresolved
          validationContext.responses[responseSchemaName] = responseSchema;
        } else {
          throw new Error(`Invalid response content: ${operation.operationId} -> ${responseKey}`);
        }
      }
    }
  }
}

function registerSchemaContainer(name: string, required: boolean, schema: api.IOpenApiSchema) {
  if (!schema.required) schema.required = [];
  if (!schema.required.includes(name) && required) schema.required.push(name);
  if (!schema.properties) schema.properties = {};
  if (!schema.properties[name]) schema.properties[name] = {type: 'object', required: [], properties: {}};
}

function validateParameterConstraints(name: string, schema: api.IOpenApiSchema | undefined) {
  if (!schema) throw new Error(`Unspecified schema: ${name}`);
  if (!schema.type) throw new Error(`Unspecified schema type: ${name}`);
  if (!api.isPrimitive(schema.type)) throw new Error(`Invalid schema type: ${name}`);  
}

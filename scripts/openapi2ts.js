const api = require('../dist');
const fs = require('fs');
const json2ts = require('json-schema-to-typescript');

const contents = fs.readFileSync(process.argv[2], 'utf8');
const definitions = {};
const properties = {};
const redirects = [];
const validationContext = api.createValidationContext(JSON.parse(contents));

[validationContext.components.schemas, validationContext.requests, validationContext.responses].forEach((values) => {
  for (const propertyName in values) {
    const newPropertyName = `I${propertyName}`;
    if (definitions[newPropertyName]) throw new Error(`Duplicate definition: ${newPropertyName}`);
    definitions[newPropertyName] = values[propertyName];
    properties[newPropertyName] = {$ref: `#/definitions/${newPropertyName}`};
    update(newPropertyName, definitions[newPropertyName]);
  }
});

function update(root, schema) {
  if (schema.$ref) {
    const match =  schema.$ref.match(/^#\/components\/schemas\/(.*)$/);
    const reference = match && match[1] ? `I${match[1]}` : undefined;
    if (reference) schema.$ref = `#/definitions/${reference}`;
    if (reference && root) redirects.push({root, reference});
  } else if (Array.isArray(schema)) {
    schema.forEach(update);
  } else if (typeof schema === 'object') {
    Object.keys(schema).forEach(x => update(null, schema[x]));
    if (root || typeof schema.type === 'string') schema.additionalProperties = false;
  }
}

json2ts.compile({properties, definitions}, '').then((result) => {
  console.log(result);
  redirects.forEach((redirect) => console.log(`export type ${redirect.root} = ${redirect.reference};`));
});

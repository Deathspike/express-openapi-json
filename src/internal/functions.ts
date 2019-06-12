const methods = ['delete', 'head', 'get', 'options', 'patch', 'post', 'put', 'trace'];
const primitives = ['boolean', 'integer', 'number', 'string'];

export function isPrimitive(type: string) {
  return primitives.includes(type);
}

export function isValidMethod(method: string) {
  return methods.includes(method);
}

export function isValidPath(path: string) {
  return !/[-[\]()*+?.,\\^$|#\s]/.test(path);
}

export function pascalCase(value: string) {
  return value.charAt(0).toUpperCase() + value.substr(1);
}

export function unsafe(value: any) {
  return value;
}

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

export function unsafe(item: any) {
  return item;
}

export function isFunction(fn){
  return typeof fn === 'function'
}

export function isObject(data){
  return typeof data === 'object' && data !== null
}
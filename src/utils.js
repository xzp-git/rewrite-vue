export function isFunction(fn){
  return typeof fn === 'function'
}

export function isObject(data){
  return typeof data === 'object' && data !== null
}

export function isReservedTag(tag){
 let str = 'a,div,span,p,img,button,ul,li,h6'
 return str.includes(tag)
}

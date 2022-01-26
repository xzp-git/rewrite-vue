class Observe{
  constructor(data){
    this.walk(data)
  }

  walk(data){
    Object.keys(data).forEach(key => defineReactive(data, key, data[key]))
  }
}


export function defineReactive(target, key, value) {
  Object.defineProperty(target, key, {
    get(){
      console.log('劫持用户的取值操作，get');
      return value
    },
    set(newValue){
      if (newValue !== value) {
      console.log('劫持用户的设置操作，set');
        value = newValue
      }
    }
  })
}







export function observe(data) {
  if (typeof data !== 'object' || data === null) {
    return
  }
  return new Observe(data)
}
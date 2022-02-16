class Observe{
  constructor(data){
    if (Array.isArray(data)) {
      
    }else{
      this.walk(data)
    }
  }

  walk(data){
    Object.keys(data).forEach(key => defineReactive(data, key, data[key]))
  }
}


export function defineReactive(target, key, value) {
  observe(value)
  Object.defineProperty(target, key, {
    get(){
      console.log('劫持用户的取值操作，get');
      return value
    },
    set(newValue){
      if (newValue !== value) {
      console.log('劫持用户的设置操作，set');
      observe(newValue)
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
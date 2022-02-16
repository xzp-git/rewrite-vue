import {newArrayProto} from './array'
class Observe{
  constructor(data){
    if (Array.isArray(data)) {

      //这里我们可以重写数组中的方法， 7个编译方法，是可以修改数组本身的
      data.__proto__ = newArrayProto

    }else{
      this.walk(data)
    }
  }

  walk(data){
    Object.keys(data).forEach(key => defineReactive(data, key, data[key]))
  }
  observeArray(data){ //观测数组的值
    data.forEach(item => observe(item))
  }
}


export function defineReactive(target, key, value) {
  observe(value)
  Object.defineProperty(target, key, {
    get(){
      console.log('劫持用户的取值操作，get',key);
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
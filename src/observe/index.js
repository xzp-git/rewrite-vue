import {newArrayProto} from './array'
class Observe{
  constructor(data){

    Object.defineProperty(data, '__ob__', {
      value:this,
      enumerable:false //将__ob__变成不可枚举（循环的时候无法获取到）
    })
    //给数据增加了一个标识 如果数据上有__ob__则说明这个属性被观测过了
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
  if (data.__ob__ instanceof Observe) {
    return data.__ob__
  }
  return new Observe(data)
}
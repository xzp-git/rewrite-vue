import {newArrayProto} from './array'
import Dep from './dep'
class Observe{
  constructor(data){
    //给每个对象都增加收集功能
    this.dep = new Dep()
    Object.defineProperty(data, '__ob__', {
      value:this,
      enumerable:false //将__ob__变成不可枚举（循环的时候无法获取到）
    })
    //给数据增加了一个标识 如果数据上有__ob__则说明这个属性被观测过了
    if (Array.isArray(data)) {

      //这里我们可以重写数组中的方法， 7个编译方法，是可以修改数组本身的
      data.__proto__ = newArrayProto
      this.observeArray(data) //如果是
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

function dependArray(value) {
  for(let i = 0; i < value.length; i++){
    let current = value[i]
    current.__ob__ && current.__ob__.dep.depend()
    if (Array.isArray(current)) {
      dependArray(current)
    }
  }
}

export function defineReactive(target, key, value) {
  let childOb = observe(value)
  let dep = new Dep()
  Object.defineProperty(target, key, {
    get(){
      if (Dep.target) {
        dep.depend() //让这个属性的收集器记住当前的watcher
        if (childOb) {
          childOb.dep.depend() //让数组和对象本身也实现依赖
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      return value
    },
    set(newValue){
      if (newValue !== value) {
        observe(newValue)
        value = newValue
        dep.notify()
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
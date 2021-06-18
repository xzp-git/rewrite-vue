import { isObject } from '../utils'
import { arrayMethods } from  './array'
import Dep from './dep'

class Observer{
  constructor(data){
    
    Object.defineProperty(data,'__ob__', {
      value:this,
      enumerabel:false
    })
    
    if(Array.isArray(data)){
      // 数组劫持的逻辑
      // 对数组原来的方法进行改写，切片编程，高阶函数
      data.__proto__ = arrayMethods
      this.observeArray(data)
    }else{
      this.walk(data)
    }
  }

  observeArray(data){
    data.forEach(item => observe(item))
  }

  walk(data){
    Object.keys(data).forEach(key => {
      defineReactive(data, key, data[key])
    })
  }
  
}


function defineReactive(data, key, value){
  
  observe(value)
  let dep = new Dep()
  Object.defineProperty(data, key, {
    get(){
      console.log(dep)
      if(Dep.target){
        dep.depend()
      }
      return value
    },
    set(newValue){
      if(newValue !== value){
        observe(newValue)
        value = newValue
        dep.notify()
      }
    }
  })
}













export function observe (data) {
  if(!isObject(data)){
    return
  }
  if(data.__ob__){
    return data.__ob__
  }
  return new Observer(data)
}
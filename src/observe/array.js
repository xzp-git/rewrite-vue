//我们希望重写数组中的部分方法

let oldArrayProto = Array.prototype //获取数组的原型

//newArrayProto.__proto__ = oldArrayProto
export let newArrayProto = Object.create(oldArrayProto)

let methods = [ //找到所有的变异方法
  'push',
  'pop',
  'unshift',
  'shift',
  'sort',
  'reverse',
  'splice'
]

methods.forEach(method => {
  newArrayProto[method] = function (...args) { //这里重写了数组的方法
    const result = oldArrayProto[method].apply(this, args)

    console.log('method', method);
    return result
  }
})
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
    const result = oldArrayProto[method].apply(this, args) //内部调用原来的方法，函数的劫持

    //我们需要对新增的 数据再次进行劫持
    let inserted
    let ob = this.__ob__
    switch (method) {
      case 'push':
      case 'unshift': //arr.push(1, 2, 3)
        inserted = args
        break;
      case 'splice': //arr.splice(0, 1, {a:1},{b:2})
        inserted = args.slice(2)
      default:
        break;
    }
    if (inserted) {
      //对新增的内容再次进行观测
      ob.observeArray(inserted)
    }    
    return result
  }
})
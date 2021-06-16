
let oldArrayPrototype = Array.prototype
export let arrayMethods = Object.create(Array.prototype)

let methods = [
  'push',
  'pop',
  'unshift',
  'shift',
  'reverse',
  'sort',
  'splice'
]

methods.forEach(method => {
  arrayMethods[method] = function(...args){
    oldArrayPrototype[method].call(this,...args)

    let inserted = null

    switch(method){
      case 'push':
      case 'unshift':
        inserted = args;
        break;
      case 'splice':
        inserted = args.slice(2)
      default:
        break;
    }
    
  }
})

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

  function _typeof(obj) {
    "@babel/helpers - typeof";

    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
      return typeof obj;
    } : function (obj) {
      return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    }, _typeof(obj);
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }

  //我们希望重写数组中的部分方法
  var oldArrayProto = Array.prototype; //获取数组的原型
  //newArrayProto.__proto__ = oldArrayProto

  var newArrayProto = Object.create(oldArrayProto);
  var methods = [//找到所有的变异方法
  'push', 'pop', 'unshift', 'shift', 'sort', 'reverse', 'splice'];
  methods.forEach(function (method) {
    newArrayProto[method] = function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      //这里重写了数组的方法
      var result = oldArrayProto[method].apply(this, args);
      console.log('method', method);
      return result;
    };
  });

  var Observe = /*#__PURE__*/function () {
    function Observe(data) {
      _classCallCheck(this, Observe);

      if (Array.isArray(data)) {
        //这里我们可以重写数组中的方法， 7个编译方法，是可以修改数组本身的
        data.__proto__ = newArrayProto;
      } else {
        this.walk(data);
      }
    }

    _createClass(Observe, [{
      key: "walk",
      value: function walk(data) {
        Object.keys(data).forEach(function (key) {
          return defineReactive(data, key, data[key]);
        });
      }
    }, {
      key: "observeArray",
      value: function observeArray(data) {
        //观测数组的值
        data.forEach(function (item) {
          return observe(item);
        });
      }
    }]);

    return Observe;
  }();

  function defineReactive(target, key, value) {
    Object.defineProperty(target, key, {
      get: function get() {
        console.log('劫持用户的取值操作，get', key);
        return value;
      },
      set: function set(newValue) {
        if (newValue !== value) {
          console.log('劫持用户的设置操作，set');
          value = newValue;
        }
      }
    });
  }
  function observe(data) {
    if (_typeof(data) !== 'object' || data === null) {
      return;
    }

    return new Observe(data);
  }

  function initState(vm) {
    var opts = vm.$options; // if (opts.props) {
    //   initProps(opts.props)
    // }

    if (opts.data) {
      initData(vm);
    }
  }

  function initData(vm) {
    var data = vm.$options.data;
    data = typeof data === 'function' ? data.call(vm) : data;
    vm._data = data;
    observe(data);
  }

  function initMixin(Vue) {
    Vue.prototype._init = function (options) {
      var vm = this;
      vm.$options = options; // 将用户的选项存在实例上

      initState(vm);
    };
  }

  function Vue(options) {
    this._init(options);
  }

  initMixin(Vue);

  return Vue;

}));
//# sourceMappingURL=vue.js.map

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

  var ncname = "[a-zA-Z_][\\-\\.0-9_a-zA-Z]*"; // 标签名 

  var qnameCapture = "((?:".concat(ncname, "\\:)?").concat(ncname, ")"); //  用来获取的标签名的 match后的索引为1的

  var startTagOpen = new RegExp("^<".concat(qnameCapture)); // 匹配开始标签的 <div

  var endTag = new RegExp("^<\\/".concat(qnameCapture, "[^>]*>")); // 匹配闭合标签的
  //           aa  =   "  xxx "  | '  xxxx '  | xxx

  var attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // a=b  a="b"  a='b'

  var startTagClose = /^\s*(\/?)>/; //   <div>  <img / >   
  //对模板进行编译处理

  function parseHTML(html) {
    //对html最开始肯定是一个 </div>
    var ELEMENT_TYPE = 1;
    var TEXT_TYPE = 3;
    var stack = []; //用于存放元素

    var currentParent; //指向的是栈中的最后一个

    var root; //最终需要转换成一颗抽象语法树

    function createASTElement(tag, attrs) {
      return {
        tag: tag,
        type: ELEMENT_TYPE,
        children: [],
        attrs: attrs,
        parent: null
      };
    }

    function start(tag, attrs) {
      var node = createASTElement(tag, attrs); //创造一个ast节点

      if (!root) {
        root = node;
      }

      if (currentParent) {
        node.parent = currentParent;
        currentParent.children.push(node);
      }

      stack.push(node);
      currentParent = node;
    }

    function chars(text) {
      //文本直接放到当前指向的节点中
      text = text.replace(/\s/g, '');

      if (text) {
        currentParent.children.push({
          type: TEXT_TYPE,
          text: text,
          parent: currentParent
        });
      }
    }

    function end(tag) {
      stack.pop(); //弹出最后一个，校验标签是否合法

      currentParent = stack[stack.length - 1];
    }

    function advance(n) {
      html = html.substring(n);
    }

    function parseStartTag() {
      var start = html.match(startTagOpen);

      if (start) {
        var match = {
          tagName: start[1],
          attrs: []
        };
        advance(start[0].length);

        var attr, _end;

        while (!(_end = html.match(startTagClose)) && (attr = html.match(attribute))) {
          advance(attr[0].length);
          match.attrs.push({
            name: attr[1],
            value: attr[3] || attr[4] || attr[5]
          });
        }

        if (_end) {
          advance(_end[0].length);
        }

        return match;
      }

      return false;
    }

    while (html) {
      //如果textEnd 为0 说明是一个开始标签或者结束标签
      //如果textEnd > 0 说明就是文本的结束位置 
      var textEnd = html.indexOf('<');

      if (textEnd === 0) {
        var startTagMatch = parseStartTag(); //开始标签的匹配结果

        if (startTagMatch) {
          // 解析到的开始标签
          start(startTagMatch.tagName, startTagMatch.attrs);
        }

        var endTagMatch = html.match(endTag);

        if (endTagMatch) {
          end(endTagMatch[1]);
          advance(endTagMatch[0].length);
        }
      }

      if (textEnd > 0) {
        var text = html.substring(0, textEnd); //文本内容

        if (text) {
          chars(text);
          advance(text.length);
        }
      }
    }

    return root;
  }

  var defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // {{aaaaa}}

  function genProps(attrs) {
    var str = '';

    for (var i = 0; i < attrs.length; i++) {
      var attr = attrs[i];

      if (attr.name === 'style') {
        (function () {
          var styleObj = {};
          attr.value.replace(/([^:;]+):([^:;]+)/g, function () {
            for (var _len = arguments.length, res = new Array(_len), _key = 0; _key < _len; _key++) {
              res[_key] = arguments[_key];
            }

            styleObj[res[1]] = res[2];
          });
          attr.value = styleObj;
        })();
      }

      str += "".concat(attr.name, ":").concat(JSON.stringify(attr.value), ",");
    }

    return "{".concat(str.slice(0, -1), "}");
  }

  function gen(node) {
    if (node.type === 1) {
      return codegen(node);
    } else {
      //文本
      var text = node.text;

      if (!defaultTagRE.test(text)) {
        return "_v(".concat(JSON.stringify(text), ")");
      } else {
        var tokens = [];
        var match;
        defaultTagRE.lastIndex = 0;
        var lastIndex = 0;

        while (match = defaultTagRE.exec(text)) {
          var index = match.index; //匹配到的位置

          if (index > lastIndex) {
            tokens.push(JSON.stringify(text.slice(lastIndex, index)));
          }

          tokens.push("_s(".concat(match[1].trim(), ")"));
          lastIndex = index + match[0].length;
        }

        if (lastIndex < text.length) {
          tokens.push(JSON.stringify(text.slice(lastIndex)));
        }

        return "_v(".concat(tokens.join('+'), ")");
      }
    }
  }

  function genChildren(ast) {
    return ast.children.map(function (child) {
      return gen(child);
    }).join(',');
  }

  function codegen(ast) {
    var children = genChildren(ast);
    var code = "_c('".concat(ast.tag, "',").concat(ast.attrs.length > 0 ? genProps(ast.attrs) : 'null').concat(ast.children.length ? ",".concat(children) : '', ")");
    return code;
  } //对模板进行编译处理


  function compileToFunction(template) {
    //1.就是将template 转化成ast语法树
    var ast = parseHTML(template); //2.生成render方法（render方法 执行后的 返回的结果就是 虚拟DOM）

    var code = codegen(ast);
    code = "with(this){return ".concat(code, "}");
    var render = new Function(code);
    return render;
  }

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

  function createElementVNode(vm, tag) {
    var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    if (!data) {
      data = {};
    }

    var key = data.key;

    if (key) {
      delete data.key;
    }

    for (var _len = arguments.length, children = new Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
      children[_key - 3] = arguments[_key];
    }

    return vnode(vm, tag, key, data, children);
  }
  function createTextVNode(vm, text) {
    return vnode(vm, undefined, undefined, undefined, undefined, text);
  }

  function vnode(vm, tag, key, data, children, text) {
    return {
      vm: vm,
      tag: tag,
      key: key,
      data: data,
      children: children,
      text: text
    };
  }

  function createElm(vnode) {
    var tag = vnode.tag,
        data = vnode.data,
        children = vnode.children,
        text = vnode.text;

    if (typeof tag === 'string') {
      vnode.el = document.createElement(tag);
      patchProps(vnode.el, data);
      children.forEach(function (child) {
        vnode.el.appendChild(createElm(child));
      });
    } else {
      vnode.el = document.createTextNode(text);
    }

    return vnode.el;
  }

  function patchProps(el, props) {
    for (var key in props) {
      if (key === 'style') {
        for (var styleName in props.style) {
          el.style[styleName] = props.style[styleName];
        }
      } else {
        el.setAttribute(key, props[key]);
      }
    }
  }

  function patch(oldVnode, vnode) {
    //写的是初渲染流程
    var isRealElement = oldVnode.nodeType;

    if (isRealElement) {
      var elm = oldVnode;
      var parentElm = elm.parentNode; //拿到父元素

      var newElm = createElm(vnode);
      parentElm.insertBefore(newElm, elm.nextSibiling);
      parentElm.removeChild(elm);
    }
  }

  function initLifeCycle(Vue) {
    Vue.prototype._update = function (vnode) {
      var vm = this;
      var el = vm.$el;
      console.log(el, vnode); //patch既有初始化的功能 又有更新的公共

      patch(el, vnode);
    };

    Vue.prototype._c = function () {
      return createElementVNode.apply(void 0, [this].concat(Array.prototype.slice.call(arguments)));
    };

    Vue.prototype._v = function () {
      return createTextVNode.apply(void 0, [this].concat(Array.prototype.slice.call(arguments)));
    };

    Vue.prototype._s = function (value) {
      if (_typeof(value) === 'object') return JSON.stringify(value);
      return value;
    };

    Vue.prototype._render = function () {
      var vm = this;
      return vm.$options.render.call(vm);
    };
  }
  function mountComponent(vm, el) {
    vm.$el = el; //1.调用render方法产生虚拟节点 虚拟Dom

    vm._update(vm._render()); //2.根据虚拟DOM产生真实DOM
    //3.插入到el元素中

  } //vue核心流程

  /**
   * 1. 创造了响应式数据 
   * 2. 模板转换成ast语法树
   * 3. 将ast语法树转换成了render函数
   * 4. 后续每次数据更新可以只执行render函数（无需再次执行ast转换的过程）
   * 5. render函数会生成虚拟DOm
   * 6. 根据生成的虚拟节点创造真实的DOM
   */

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
      var result = oldArrayProto[method].apply(this, args); //内部调用原来的方法，函数的劫持
      //我们需要对新增的 数据再次进行劫持

      var inserted;
      var ob = this.__ob__;

      switch (method) {
        case 'push':
        case 'unshift':
          //arr.push(1, 2, 3)
          inserted = args;
          break;

        case 'splice':
          //arr.splice(0, 1, {a:1},{b:2})
          inserted = args.slice(2);
      }

      if (inserted) {
        //对新增的内容再次进行观测
        ob.observeArray(inserted);
      }

      return result;
    };
  });

  var Observe = /*#__PURE__*/function () {
    function Observe(data) {
      _classCallCheck(this, Observe);

      Object.defineProperty(data, '__ob__', {
        value: this,
        enumerable: false //将__ob__变成不可枚举（循环的时候无法获取到）

      }); //给数据增加了一个标识 如果数据上有__ob__则说明这个属性被观测过了

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
    observe(value);
    Object.defineProperty(target, key, {
      get: function get() {
        console.log('劫持用户的取值操作，get', key);
        return value;
      },
      set: function set(newValue) {
        if (newValue !== value) {
          console.log('劫持用户的设置操作，set');
          observe(newValue);
          value = newValue;
        }
      }
    });
  }
  function observe(data) {
    if (_typeof(data) !== 'object' || data === null) {
      return;
    }

    if (data.__ob__ instanceof Observe) {
      return data.__ob__;
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
    proxy(vm, '_data');
    observe(data);
  }

  function proxy(vm, target) {
    var _loop = function _loop(key) {
      Object.defineProperty(vm, key, {
        get: function get() {
          return vm[target][key];
        },
        set: function set(newValue) {
          vm[target][key] = newValue;
        }
      });
    };

    for (var key in vm[target]) {
      _loop(key);
    }
  }

  function initMixin(Vue) {
    Vue.prototype._init = function (options) {
      var vm = this;
      vm.$options = options; // 将用户的选项存在实例上

      initState(vm);

      if (options.el) {
        vm.$mount(options.el);
      }
    };

    Vue.prototype.$mount = function (el) {
      var vm = this;
      el = document.querySelector(el);
      var ops = vm.$options;

      if (!ops.render) {
        var template;

        if (!ops.template && el) {
          template = el.outerHTML;
        } else {
          if (ops.template) {
            template = ops.template;
          }
        }

        if (template) {
          var render = compileToFunction(template);
          ops.render = render;
        }
      }

      console.log(ops.render.toString());
      mountComponent(vm, el); //组件挂载
    };
  }

  function Vue(options) {
    this._init(options);
  }

  initMixin(Vue);
  initLifeCycle(Vue);

  return Vue;

}));
//# sourceMappingURL=vue.js.map

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

  function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);

    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(object);
      enumerableOnly && (symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      })), keys.push.apply(keys, symbols);
    }

    return keys;
  }

  function _objectSpread2(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = null != arguments[i] ? arguments[i] : {};
      i % 2 ? ownKeys(Object(source), !0).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }

    return target;
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

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  var strats = {};
  var LIFECYCLE = ['beforeCreate', 'created'];
  LIFECYCLE.forEach(function (hook) {
    strats[hook] = function (p, c) {
      if (c) {
        if (p) {
          return p.concat(c);
        } else {
          return [c];
        }
      } else {
        return p;
      }
    };
  });
  function mergeOptions(parent, child) {
    var options = {};

    for (var key in parent) {
      mergeField(key);
    }

    for (var _key in child) {
      if (!parent.hasOwnProperty(_key)) {
        mergeField(_key);
      }
    }

    function mergeField(key) {
      if (strats[key]) {
        options[key] = strats[key](parent[key], child[key]);
      } else {
        options[key] = child[key] || parent[key];
      }
    }

    return options;
  }
  var callbacks = [];
  var waiting = false;

  function flushCallbacks() {
    var cbs = callbacks.slice(0);
    waiting = false;
    callbacks = [];
    cbs.forEach(function (cb) {
      return cb();
    });
  }

  var timerFunc;

  if (Promise) {
    timerFunc = function timerFunc() {
      Promise.resolve().then(flushCallbacks);
    };
  } else if (MutationObserver) {
    var observer = new MutationObserver(flushCallbacks);
    var textNode = document.createTextNode(1);
    observer.observe(textNode, {
      characterData: true
    });

    timerFunc = function timerFunc() {
      textNode.textContent = 2;
    };
  } else if (setImmediate) {
    timerFunc = function timerFunc() {
      setImmediate(flushCallbacks);
    };
  } else {
    setTimeout(flushCallbacks);
  }

  function nextTick(cb) {
    callbacks.push(cb);

    if (!waiting) {
      timerFunc();
      waiting = true;
    }
  }

  var id$1 = 0;

  var Dep = /*#__PURE__*/function () {
    function Dep() {
      _classCallCheck(this, Dep);

      this.id = id$1++;
      this.subs = [];
    }

    _createClass(Dep, [{
      key: "depend",
      value: function depend() {
        Dep.target.addDep(this);
      }
    }, {
      key: "addSub",
      value: function addSub(watcher) {
        this.subs.push(watcher);
      }
    }, {
      key: "notify",
      value: function notify() {
        this.subs.forEach(function (watcher) {
          return watcher.update();
        });
      }
    }]);

    return Dep;
  }();

  Dep.target = null;
  var stack = [];
  function pushTarget(watcher) {
    stack.push(watcher);
    Dep.target = watcher;
  }
  function popTarget() {
    stack.pop();
    Dep.target = stack[stack.length - 1];
  }

  var id = 0;

  var Watcher = /*#__PURE__*/function () {
    function Watcher(vm, exprOrFn, options, cb) {
      _classCallCheck(this, Watcher);

      this.vm = vm;
      this.id = id++;
      this.renderWatcher = options;
      this.getter = typeof exprOrFn === 'string' ? function () {
        return vm[exprOrFn];
      } : exprOrFn; //getter意味着调用这个函数可以发生取值操作

      this.deps = [];
      this.depsId = new Set();
      this.lazy = options.lazy;
      this.dirty = this.lazy;
      this.cb = cb;
      this.immediate = options.immediate;
      this.user = options.user;
      this.value = this.lazy ? undefined : this.get();
      this.immediate ? this.cb(this.value, undefined) : undefined;
    }

    _createClass(Watcher, [{
      key: "addDep",
      value: function addDep(dep) {
        var id = dep.id;

        if (!this.depsId.has(id)) {
          this.depsId.add(id);
          this.deps.push(dep);
          dep.addSub(this);
        }
      }
    }, {
      key: "depend",
      value: function depend() {
        var i = this.deps.length;

        while (i--) {
          this.deps[i].depend();
        }
      }
    }, {
      key: "evaluate",
      value: function evaluate() {
        this.value = this.get(); //获取到用户函数的返回值 并且还要标识为脏

        this.dirty = false;
      }
    }, {
      key: "get",
      value: function get() {
        pushTarget(this);
        var value = this.getter.call(this.vm);
        popTarget();
        return value;
      }
    }, {
      key: "update",
      value: function update() {
        if (this.lazy) {
          //如果是计算属性 依赖的值变化了 就标识计算属性是脏值了
          this.dirty = true;
        } else {
          queueWatcher(this);
        }
      }
    }, {
      key: "run",
      value: function run() {
        var oldValue = this.value;
        var newValue = this.get();

        if (this.user) {
          this.cb.call(this.vm, newValue, oldValue);
        }
      }
    }]);

    return Watcher;
  }();

  var queue = [];
  var has = {};
  var pending = false;

  function flushSchedulerQueue() {
    var flushQueue = queue.slice(0);
    queue = [];
    has = {};
    pending = false;
    flushQueue.forEach(function (q) {
      return q.run();
    });
  }

  function queueWatcher(watcher) {
    var id = watcher.id;

    if (!has[id]) {
      queue.push(watcher);
      has[id] = true;

      if (!pending) {
        pending = true;
        nextTick(flushSchedulerQueue);
      }
    }
  }

  function initGlobalAPI(Vue) {
    Vue.options = {};

    Vue.mixin = function (mixin) {
      this.options = mergeOptions(this.options, mixin);
      return this;
    };

    Vue.prototype.$nextTick = nextTick;

    Vue.prototype.$watch = function (exprOrFn, cb) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      new Watcher(this, exprOrFn, _objectSpread2({
        user: true
      }, options), cb);
    };
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

  function isSameVnode(vnode1, vnode2) {
    return vnode1.tag === vnode2.tag && vnode1.key === vnode2.key;
  }

  function createElm(vnode) {
    var tag = vnode.tag,
        data = vnode.data,
        children = vnode.children,
        text = vnode.text;

    if (typeof tag === "string") {
      vnode.el = document.createElement(tag);
      patchProps(vnode.el, {}, data);
      children.forEach(function (child) {
        vnode.el.appendChild(createElm(child));
      });
    } else {
      vnode.el = document.createTextNode(text);
    }

    return vnode.el;
  }
  function patchProps(el) {
    var oldProps = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var props = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    //老的属性中有 新的没有 要删除老的
    var oldStyle = oldProps.style || {};
    var newStyle = props.style || {};

    for (var key in oldStyle) {
      if (!newStyle[key]) {
        el.style[key] = "";
      }
    }

    for (var _key in oldProps) {
      if (!props[_key]) {
        el.removeAttribute(_key);
      }
    }

    for (var _key2 in props) {
      if (_key2 === "style") {
        for (var styleName in props.style) {
          el.style[styleName] = props.style[styleName];
        }
      } else {
        el.setAttribute(_key2, props[_key2]);
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
      return newElm;
    } else {
      //1 两个节点不是同一个节点 直接删除老的换上新的
      //2 两个节点是同一个节点 （判断节点 的tag 和 节点的key）比较 两个节点的属性是否有差异
      //3 节点比较完毕后就需要比较两个人的儿子
      return patchVnode(oldVnode, vnode);
    }
  }

  function patchVnode(oldVnode, vnode) {
    if (!isSameVnode(oldVnode, vnode)) {
      var _el = createElm(vnode);

      oldVnode.el.parentNode.replaceChild(_el, oldVnode.el);
      return _el;
    } //文本的情况 文本我们期望比较一下文本的内容


    var el = vnode.el = oldVnode.el;

    if (!oldVnode.tag) {
      //不存在tag 则是文本
      if (oldVnode.text !== vnode.text) {
        el.textContent = vnode.text;
      }
    }
    /**
     * 如果是标签 我们需要更新属性
     */


    patchProps(el, oldVnode.data, vnode.data);
    /**
     * 比较完自身节点后，比较儿子的节点
     * 比较的时候 一方有儿子 一方没有儿子
     *           两方都有儿子
     */

    var oldChildren = oldVnode.children || [];
    var newChildren = vnode.children || [];

    if (oldChildren.length > 0 && newChildren.length > 0) {
      //完整的diff算法 需要比较两个人的儿子
      updateChildren(el, oldChildren, newChildren);
    } else if (newChildren.length > 0) {
      //老的没有 新的有
      mountChildren(el, newChildren);
    } else if (oldChildren.length > 0) {
      //新的没有 老的有
      unMountChildren(el, oldChildren);
    }

    return el;
  }

  function updateChildren(el, oldChildren, newChildren) {
    /**
     * 为了比较两个儿子的时候，提高性能，我们会有一些优化手段
     * 我们操作列表 经常会有 push shift pop unshift reverse sort 这些方法 针对这些情况做一些优化
     * vue2中采用双指针的方式 来比较两个节点
     */
    var oldStartIndex = 0;
    var newStartIndex = 0;
    var oldEndIndex = oldChildren.length - 1;
    var newEndIndex = newChildren.length - 1;
    var oldStartVnode = oldChildren[0];
    var newStartVnode = newChildren[0];
    var oldEndVnode = oldChildren[oldEndIndex];
    var newEndVnode = newChildren[newEndIndex]; //双方有一方头指针大于尾指针则停止循环

    while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
      if (isSameVnode(oldStartVnode, newStartVnode)) {
        patchVnode(oldStartVnode, newStartVnode); //如果是相同的节点  则递归比较子节点

        oldStartVnode = oldChildren[++oldStartIndex];
        newStartVnode = newChildren[++newStartIndex];
      } else if (isSameVnode(oldEndVnode, newEndVnode)) {
        patchVnode(oldEndVnode, newEndVnode);
        oldEndVnode = oldChildren[--oldEndIndex];
        newEndVnode = newChildren[--newEndIndex];
      } else if (isSameVnode(oldStartVnode, newEndVnode)) {
        patchVnode(oldStartVnode, newEndVnode);
        el.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibiling);
        oldStartVnode = oldChildren[++oldStartIndex];
        newEndVnode = newChildren[--newEndIndex];
      } else if (isSameVnode(oldEndVnode, newStartVnode)) {
        patchVnode(oldEndVnode, newStartVnode);
        el.insertBefore(oldEndVnode.el, oldStartVnode.el);
        oldEndVnode = oldChildren[--oldEndIndex];
        newStartVnode = newChildren[++newStartIndex];
      }
    }

    if (newStartIndex <= newEndIndex) {
      //多余的就创建插入进去即可
      for (var i = newStartIndex; i <= newEndIndex; i++) {
        var childEl = createElm(newChildren[i]); //这里可能是向后追加 也有可能是向前追加
        //参照物

        var anchor = newChildren[newEndIndex + 1] ? newChildren[newEndIndex + 1].el : null;
        el.insertBefore(childEl, anchor); //anchor 为null则为向后追加
      }
    }

    if (oldStartIndex <= oldEndIndex) {
      for (var _i = oldStartIndex; _i <= oldEndIndex; _i++) {
        var _childEl = oldChildren[_i].el;
        el.removeChild(_childEl);
      }
    }
  }

  function mountChildren(el, newChildren) {
    for (var i = 0; i < newChildren.length; i++) {
      var child = newChildren[i];
      el.appendChild(createElm(child));
    }
  }

  function unMountChildren(el, oldChildren) {
    for (var i = 0; i < oldChildren.length; i++) {
      var child = oldChildren[i].el;
      el.removeChild(child);
    }
  }

  function initLifeCycle(Vue) {
    Vue.prototype._update = function (vnode) {
      var vm = this;
      var el = vm.$el; //patch既有初始化的功能 又有更新的公共

      var newEl = patch(el, vnode);
      vm.$el = newEl;
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

    var updateComponent = function updateComponent() {
      vm._update(vm._render());
    };

    new Watcher(vm, updateComponent, true); //2.根据虚拟DOM产生真实DOM
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

  function callHook(vm, hook) {
    var handlers = vm.$options[hook];

    if (handlers) {
      handlers.forEach(function (handler) {
        return handler.call(vm);
      });
    }
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

      ob.dep.notify(); //数组变化了，通知对应的watcher 实现更新逻辑

      return result;
    };
  });

  var Observe = /*#__PURE__*/function () {
    function Observe(data) {
      _classCallCheck(this, Observe);

      //给每个对象都增加收集功能
      this.dep = new Dep();
      Object.defineProperty(data, '__ob__', {
        value: this,
        enumerable: false //将__ob__变成不可枚举（循环的时候无法获取到）

      }); //给数据增加了一个标识 如果数据上有__ob__则说明这个属性被观测过了

      if (Array.isArray(data)) {
        //这里我们可以重写数组中的方法， 7个编译方法，是可以修改数组本身的
        data.__proto__ = newArrayProto;
        this.observeArray(data); //如果是
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

  function dependArray(value) {
    for (var i = 0; i < value.length; i++) {
      var current = value[i];
      current.__ob__ && current.__ob__.dep.depend();

      if (Array.isArray(current)) {
        dependArray(current);
      }
    }
  }

  function defineReactive(target, key, value) {
    var childOb = observe(value);
    var dep = new Dep();
    Object.defineProperty(target, key, {
      get: function get() {
        if (Dep.target) {
          dep.depend(); //让这个属性的收集器记住当前的watcher

          if (childOb) {
            childOb.dep.depend(); //让数组和对象本身也实现依赖

            if (Array.isArray(value)) {
              dependArray(value);
            }
          }
        }

        return value;
      },
      set: function set(newValue) {
        if (newValue !== value) {
          observe(newValue);
          value = newValue;
          dep.notify();
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

    if (opts.computed) {
      initComputed(vm);
    }

    if (opts.watch) {
      initWatch(vm);
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

  function initComputed(vm) {
    var computed = vm.$options.computed;
    var watchers = vm._computedWatchers = {}; //计算属性watcher保存到vm上

    for (var key in computed) {
      var userDef = computed[key];
      var fn = typeof userDef === 'function' ? userDef : userDef.get; //如果直接new Watcher 默认就会执行fn

      watchers[key] = new Watcher(vm, fn, {
        lazy: true
      });
      defineComputed(vm, key, userDef);
    }
  }

  function defineComputed(target, key, userDef) {
    //  const getter = typeof userDef === 'function' ? userDef : userDef.get
    var setter = userDef.set || function () {};

    Object.defineProperty(target, key, {
      get: createComputedGetter(key),
      set: setter
    });
  }

  function createComputedGetter(key) {
    //我们需要检测是否要执行这个getter
    return function () {
      var watcher = this._computedWatchers[key];

      if (watcher.dirty) {
        watcher.evaluate();
      }

      if (Dep.target) {
        watcher.depend();
      }

      return watcher.value; //最后返回的wather上面的值
    };
  }

  function initWatch(vm) {
    var watch = vm.$options.watch;

    for (var key in watch) {
      var handler = watch[key];

      if (Array.isArray(handler)) {
        for (var i = 0; i < handler.length; i++) {
          createWatcher(vm, key, handler[i]);
        }
      } else if (_typeof(handler) === 'object') {
        var hanlderFn = handler.handler;
        delete handler.handler;
        createWatcher(vm, key, hanlderFn, handler);
      } else {
        createWatcher(vm, key, handler);
      }
    }
  }

  function createWatcher(vm, key, handler) {
    var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

    if (typeof handler === 'string') {
      handler = vm[handler];
    }

    return vm.$watch(key, handler, options);
  }

  function initMixin(Vue) {
    Vue.prototype._init = function (options) {
      var vm = this;
      vm.$options = mergeOptions(vm.constructor.options, options); // 将用户的选项存在实例上

      callHook(vm, 'beforeCreate');
      initState(vm);
      callHook(vm, 'created');

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

      mountComponent(vm, el); //组件挂载
    };
  }

  function Vue(options) {
    this._init(options);
  }

  initMixin(Vue);
  initLifeCycle(Vue);
  initGlobalAPI(Vue); //-------------------------------为了方便观察前后的虚拟节点----------------------------------------------

  var render1 = compileToFunction("<ul>\n<li key=\"d\" style=\"color:red\" >d</li>\n<li key=\"a\" style=\"color:red\" >a</li>\n<li key=\"b\" style=\"color:red\" >b</li>\n<li key=\"c\" style=\"color:red\" >c</li>\n</ul>");
  var vm1 = new Vue({
    data: {
      name: "www"
    }
  });
  var prevVnode = render1.call(vm1);
  var el = createElm(prevVnode);
  document.body.appendChild(el);
  var render2 = compileToFunction("<ul>\n<li key=\"a\" style=\"color:pink\" >a</li>\n<li key=\"b\" style=\"color:pink\" >b</li>\n<li key=\"c\" style=\"color:pink\" >c</li>\n<li key=\"d\" style=\"color:pink\" >d</li>\n</ul>");
  var vm2 = new Vue({
    data: {
      name: "fff"
    }
  });
  var nextVnode = render2.call(vm2);
  setTimeout(function () {
    patch(prevVnode, nextVnode);
  }, 1000);

  return Vue;

}));
//# sourceMappingURL=vue.js.map

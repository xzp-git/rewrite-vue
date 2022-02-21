
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`; // 标签名 
const qnameCapture = `((?:${ncname}\\:)?${ncname})`; //  用来获取的标签名的 match后的索引为1的
const startTagOpen = new RegExp(`^<${qnameCapture}`); // 匹配开始标签的 <div
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配闭合标签的
//           aa  =   "  xxx "  | '  xxxx '  | xxx
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // a=b  a="b"  a='b'
const startTagClose = /^\s*(\/?)>/; //   <div>  <img / >   


//对模板进行编译处理
export function parseHTML(html) { //对html最开始肯定是一个 </div>
  
  const ELEMENT_TYPE = 1
  const TEXT_TYPE = 3
  const stack = [] //用于存放元素
  let currentParent //指向的是栈中的最后一个
  let root

  //最终需要转换成一颗抽象语法树
  function createASTElement(tag, attrs) {
    return {
      tag, 
      type:ELEMENT_TYPE,
      children:[],
      attrs,
      parent:null
    }
  }

  function start(tag, attrs) {
    let node = createASTElement(tag, attrs) //创造一个ast节点
    if (!root) {
      root = node
    }
    if(currentParent){
      node.parent = currentParent
      currentParent.children.push(node)
    }

    stack.push(node)
    currentParent = node
  }
  
  function chars(text) { //文本直接放到当前指向的节点中
    text = text.replace(/\s/g, '')
    if (text) {
      currentParent.children.push({
        type:TEXT_TYPE,
        text,
        parent:currentParent
      })
    }
  }

  function end(tag) {
    let node = stack.pop() //弹出最后一个，校验标签是否合法
    currentParent = stack[stack.length - 1]
  }
  
  function advance(n) {
    html = html.substring(n)
  }
  function parseStartTag() {
    const start = html.match(startTagOpen)
    if (start) {
      const match = {
        tagName:start[1],
        attrs:[]
      }
      advance(start[0].length)

      let attr, end
      while (! (end = html.match(startTagClose)) && (attr = html.match(attribute))) {
        advance(attr[0].length)
        match.attrs.push({name:attr[1], value: attr[3] || attr[4] || attr[5]})
      }
      if (end) {
        advance(end[0].length)
      }
      return match
    }
    return false
  }
  while (html) {
    //如果textEnd 为0 说明是一个开始标签或者结束标签
    //如果textEnd > 0 说明就是文本的结束位置 
    let textEnd = html.indexOf('<')
    if (textEnd === 0) {
       const startTagMatch =  parseStartTag() //开始标签的匹配结果
      if (startTagMatch) { // 解析到的开始标签
        start(startTagMatch.tagName, startTagMatch.attrs)
      }
      let endTagMatch = html.match(endTag)
      if (endTagMatch) {
        end(endTagMatch[1])
        advance(endTagMatch[0].length)
      }
    }
    if (textEnd > 0) {
      let text = html.substring(0, textEnd)//文本内容
      if (text) {
        chars(text)
        advance(text.length)
      }
    }
  }
  return root
}
import { parseHTML } from "./parse"
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // {{aaaaa}}
function genProps(attrs) {
  let str = ''
  for (let i = 0; i < attrs.length; i++) {
    let attr = attrs[i]
    if (attr.name === 'style') {
      let styleObj = {}
      attr.value.replace(/([^:;]+):([^:;]+)/g, function (...res) {
        styleObj[res[1]] = res[2]      
      })
      attr.value = styleObj
    }
    str += `${attr.name}:${JSON.stringify(attr.value)},`   
  }
  return `{${str.slice(0, -1)}}`  
}

function gen(node) {
  if (node.type === 1) {
    return codegen(node)
  }else{
    //文本
    let text = node.text
    if (!defaultTagRE.test(text)) {
      return `_v(${JSON.stringify(text)})`
    }else{
      let tokens = []
      let match
      defaultTagRE.lastIndex = 0
      let lastIndex = 0
      while (match = defaultTagRE.exec(text)) {
        let index = match.index //匹配到的位置
        if (index > lastIndex) {
          tokens.push(JSON.stringify(text.slice(lastIndex, index)))
        }
        tokens.push(`_s(${match[1].trim()})`)
        lastIndex = index + match[0].length
      }
      if (lastIndex < text.length) {
        tokens.push(JSON.stringify(text.slice(lastIndex)))
      }
      return `_v(${tokens.join('+')})`
    }
  }
}

function genChildren(ast) {
  return ast.children.map(child => gen(child)).join(',')
}

function codegen(ast) {
  let children = genChildren(ast)
  let code = `_c('${ast.tag}',${ast.attrs.length > 0? genProps(ast.attrs) : 'null'}${ast.children.length? `,${children}`:''})`

  return code
}


//对模板进行编译处理
export function compileToFunction(template){ 
  
  //1.就是将template 转化成ast语法树
  let ast = parseHTML(template)
  //2.生成render方法（render方法 执行后的 返回的结果就是 虚拟DOM）
  let code = codegen(ast)
  code = `with(this){return ${code}}`
  let render = new Function(code)

  return render
}
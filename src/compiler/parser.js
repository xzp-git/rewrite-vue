const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`; // 标签名 
const qnameCapture = `((?:${ncname}\\:)?${ncname})`; //  用来获取的标签名的 match后的索引为1的
const startTagOpen = new RegExp(`^<${qnameCapture}`); // 匹配开始标签的 
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配闭合标签的
//           aa  =   "  xxx "  | '  xxxx '  | xxx
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // a=b  a="b"  a='b'
const startTagClose = /^\s*(\/?)>/; //   >  />   <div/>
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // {{aaaaa}}

export function parserHTML(html){
 let root = null 
 let stack = []
 function createAstElement(tagName, attrs){
  return {
    tag:tagName,
    type:1,
    children:[],
    parent:null,
    attrs
  }
 }
 function advance(len){
  html = html.substring(len)
 }
 function parseStartTag(){
   const start = html.match(startTagOpen)
   if(start){
     const match = {
       tagName:start[1],
       attrs:[]
     }
     advance(start[0].length)
     let end

     let attr //如果没遇到开始标签的闭合标签就不听的解析
     while(!(end = html.match(startTagClose)) && (attr = html.match(attribute))){
       match.attrs.push({name:attr[1],value:attr[3]||attr[4]||attr[5]})
       advance(attr[0].length)
     }
     if(end){
      advance(end[0].length)
     }
     return match
   }
   return false
 }



 function start(tagName, attributes){
  let parent = null
  if(stack.length){
    parent = stack[stack.length - 1]
  }
  let element = createAstElement(tagName, attributes)
  if(!root){
    root = element
  }
  if(parent){
    element.parent = parent
    parent.children.push(element)
  }
  stack.push(element)
 }

 function end(tagName){
   let last = stack.pop()
   if(last.tag !== tagName){
    throw new Error('标签有误')
   }
 }

 function chars(text){
   text = text.replace(/\s/g,"")
   let parent = stack[stack.length - 1]
   if(text){
    parent.children.push({
      type:3,
      text
    })
   }
 }
 while(html){
   let textEnd = html.indexOf('<')
   if(textEnd === 0){
     const startTagMatch = parseStartTag()
     if(startTagMatch){
       start(startTagMatch.tagName, startTagMatch.attrs)
       continue
     }

     const endTagMatch = html.match(endTag)
     
     if(endTagMatch){
       end(endTagMatch[1])
       advance(endTagMatch[0].length)
       continue
     }
   }

   let text
   if(textEnd > 0){
    text = html.substring(0,textEnd)
   }
   if(text){
     chars(text)
     advance(text.length)
   }

 }






 return root
}
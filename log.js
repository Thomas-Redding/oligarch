
function log(s) {
  if (log.enable === undefined) log.enable = false;
  if (!log.enable) return false;
  let stack = get_stack();
  let top = stack[0];
  console.log(timeString(), top.methodSig + "()", ...arguments);
}

function timeString() {
  let date = new Date();
  let m = date.getMinutes() + "";
  let s = date.getSeconds() + "";
  let ms = new Date().getMilliseconds() + "";
  m = m.padStart(2, "0");
  s = s.padStart(2, "0");
  ms = ms.padStart(3, "0");
  return m + ":" + s + "." + ms;
}

function get_method_name() {
  let stack = get_stack();
  for (let i in stack) {
    if (stack[i].startsWith("    at log (") == 0) {
      return stack;
    }
  }
}

function get_stack() {
  try {
    var a = {};
    a.debug();
  } catch(e) {
    let stack1 = e.stack.split("\n");
    let stack2 = null;
    for (let i = 0; i < stack1.length; ++i) {
      if (stack1[i].search(/^\s+at log \(.*oligarch\/log\.js/) == 0) {
        stack2 = stack1.slice(i+1);
        break;
      }
    }
    if (stack2 === null) return null;
    return stack2.map(x => {
      x = x.substr(x.indexOf(" at ")+4);
      let front = x.substr(0, x.indexOf(" (")); // "ab.cd" OR "new ab"
      let back = x.substr(front.length+1);
      back = back.substr(1, back.length - 2); // strip paranthese
      let [filePath, lineNum, charNum] = back.split(":");
      return {
        methodSig: front,
        filePath: filePath,
        lineNum: lineNum,
        charNum: charNum};
    });
  }
}

module.exports = log


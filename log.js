
function log(s) {
  if (log.enable === undefined) log.enable = false;
  if (!log.enable) return false;
   console.log(get_stack());
  console.log(time(), "".padStart(get_stack().length, "-") , ...arguments);
}

function time() {
  let date = new Date();
  let m = date.getMinutes() + "";
  let s = date.getSeconds() + "";
  let ms = new Date().getMilliseconds() + "";
  m = m.padStart(2, "0");
  s = s.padStart(2, "0");
  ms = ms.padStart(3, "0");
  return m + ":" + s + "." + ms;
}

function get_stack() {
  try {
    var a = {};
    a.debug();
  } catch(e) {
    let stack1 = e.stack.split("\n").slice(2);
    let stack2 = [];
    for (let s1 of stack1) {
      let s2 = s1.substr(7);
      let methodName = s2.substr(0, s2.indexOf(" "));
      if (methodName.startsWith("WebSocket")) break;
      if (methodName.startsWith("tryOnTimeout")) break;
      stack2.push(methodName);
    }
    return stack2.slice(1); // remove log()
  }
}

module.exports = log


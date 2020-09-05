
/*
 svg(width, height)
 g()
 rect(x, y, width, height)
 circle(cx, cy, r)
 ellipse(cx, cy, rx, ry)
 polygon(xs, ys)
 line(x1, y1, x2, y2)
 path()
   moveTo(x, y)
   lineTo(x, y)
   curveTo(x1, y1, x2, y2, x3, y3)
   smoothCurveTo(x1, y1, x2, y2)
   quadraticTo(x1, y1, x2, y2)
   smoothQuadraticTo(x, y)
   arcTo(rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y)
   close()
 polyline(xs, ys)
 linearGradien()
   addStop(offset, color, opacity=1)
 radientGradien()
   addStop(offset, color, opacity=1)
 text(str, x, y, fontString=null)
 arrow(x1, y1, x2, y2, attrs={}, fillHead=true, size=6, angle=Math.PI/3)
 */

let svg = {
  svg: (width, height, attrs={}) => {
    let rtn = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    rtn.setAttribute("viewBox", "0 0 " + width + " " + height);
    // rtn.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    for (key in attrs) rtn.setAttribute(key, attrs[key]);
    return rtn;
  },
  g: (attrs={}) => {
    let rtn = document.createElementNS("http://www.w3.org/2000/svg", "g");
    for (key in attrs) rtn.setAttribute(key, attrs[key]);
    return rtn;
  },

  // Shapes
  rect: (x, y, width, height, attrs={}) => {
    let rtn = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rtn.setAttribute("x", x);
    rtn.setAttribute("y", y);
    rtn.setAttribute("width", width);
    rtn.setAttribute("height", height);
    for (key in attrs) rtn.setAttribute(key, attrs[key]);
    return rtn;
  },
  circle: (cx, cy, r, attrs={}) => {
    let rtn = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    rtn.setAttribute("cx", cx);
    rtn.setAttribute("cy", cy);
    rtn.setAttribute("r", r);
    for (key in attrs) rtn.setAttribute(key, attrs[key]);
    return rtn;
  },
  ellipse: (cx, cy, rx, ry, attrs={}) => {
    let rtn = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    rtn.setAttribute("cx", cx);
    rtn.setAttribute("cy", cy);
    rtn.setAttribute("rx", rx);
    rtn.setAttribute("ry", ry);
    for (key in attrs) rtn.setAttribute(key, attrs[key]);
    return rtn;
  },
  polygon: (xs, ys, attrs={}) => {
    if (xs.length != ys.length) return undefined;
    let rtn = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    let pointString = "";
    for (let i = 0; i < xs.length; ++i) {
      if (i != 0) pointString += " ";
      pointString += xs[i] + "," + ys[i];
    }
    rtn.setAttribute("points", pointString);
    for (key in attrs) rtn.setAttribute(key, attrs[key]);
    return rtn;
  },

  // Paths
  line: (x1, y1, x2, y2, attrs={}) => {
    let rtn = document.createElementNS("http://www.w3.org/2000/svg", "line");
    rtn.setAttribute("x1", x1);
    rtn.setAttribute("y1", y1);
    rtn.setAttribute("x2", x2);
    rtn.setAttribute("y2", y2);
    for (key in attrs) rtn.setAttribute(key, attrs[key]);
    return rtn;
  },
  path: (attrs={}) => {
    let rtn = document.createElementNS("http://www.w3.org/2000/svg", "path");
    let _append = (pathElement, moveType, newValues=undefined) => {
      let value = pathElement.getAttribute("d");
      if (value) {
        value += " "
      } else {
        value = "";
      }
      value += moveType;
      if (newValues) {
        value += " ";
        value += newValues.join(",");
      }
      rtn.setAttribute("d", value);
    }
    rtn.moveTo = (x, y) => {                                                _append(rtn, "M", [x, y]);                                                 };
    rtn.lineTo = (x, y) => {                                                _append(rtn, "L", [x, y]);                                                 };
    rtn.curveTo = (x1, y1, x2, y2, x3, y4) => {                             _append(rtn, "L", [x1, y1, x2, y2, x3, y3]);                               };
    rtn.smoothCurveTo = (x1, y1, x2, y2) => {                               _append(rtn, "S", [x1, y1, x2, y2]);                                       };
    rtn.quadraticTo = (x1, y1, x2, y2) => {                                 _append(rtn, "Q", [x1, y1, x2, y2]);                                       };
    rtn.smoothQuadraticTo = (x, y) => {                                     _append(rtn, "T", [x, y]);                                                 };
    rtn.arcTo = (rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y) => { _append(rtn, "A", [rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y]); };
    rtn.close = () => {                                                     _append(rtn, "Z");                                                         };
    rtn.setAttribute("fill", "none");
    for (key in attrs) rtn.setAttribute(key, attrs[key]);
    return rtn;
  },
  polyline: (xs, ys, attrs={}) => {
    if (xs.length != ys.length) return undefined;
    let rtn = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    let pointString = "";
    for (let i = 0; i < xs.length; ++i) {
      if (i != 0) pointString += " ";
      pointString += xs[i] + "," + ys[i];
    }
    rtn.setAttribute("points", pointString);
    for (key in attrs) rtn.setAttribute(key, attrs[key]);
    return rtn;
  },

  // Other
  linearGradient: (attrs={}) => {
    let rtn = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    rtn.addStop = (offset, color, opacity=1, attrs={}) => {
      let rtn = document.createElementNS("http://www.w3.org/2000/svg", "stop");
      rtn.setAttribute("offset", offset);
      rtn.setAttribute("color", color);
      rtn.setAttribute("opacity", opacity);
      for (key in attrs) rtn.setAttribute(key, attrs[key]);
      return rtn;
    };
    for (key in attrs) rtn.setAttribute(key, attrs[key]);
    return rtn;
  },
  radientGradient: (attrs={}) => {
    let rtn = document.createElementNS("http://www.w3.org/2000/svg", "radientGradient");
    rtn.addStop = (offset, color, opacity=1, attrs={}) => {
      let rtn = document.createElementNS("http://www.w3.org/2000/svg", "stop");
      rtn.setAttribute("offset", offset);
      rtn.setAttribute("color", color);
      rtn.setAttribute("opacity", opacity);
      for (key in attrs) rtn.setAttribute(key, attrs[key]);
      return rtn;
    };
    for (key in attrs) rtn.setAttribute(key, attrs[key]);
    return rtn;
  },
  text: (str, x, y, attrs={}) => {
    // Useful Attributes:
    //   text-anchor = "start", "middle", "end"
    let rtn = document.createElementNS("http://www.w3.org/2000/svg", "text");
    rtn.setAttribute("x", x);
    rtn.setAttribute("y", y);
    rtn.innerHTML = str;
    for (key in attrs) rtn.setAttribute(key, attrs[key]);
    return rtn;
  },
};

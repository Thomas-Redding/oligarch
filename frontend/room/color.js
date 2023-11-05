function lpad(t, n, c) {
  c = (c ? c : ' ');
  return new Array(Math.max(n - t.length, 0)).fill(c).join(' ') + t;
}

class Color {
  constructor(r, g, b) {
    this.r = r;
    this.g = (g === undefined ? r : g);
    this.b = (b === undefined ? r : b);
  }
  hex() {
    let r = lpad(Math.max(0, Math.min(255, Math.round(this.r))).toString(16), 2, '0');
    let g = lpad(Math.max(0, Math.min(255, Math.round(this.g))).toString(16), 2, '0');
    let b = lpad(Math.max(0, Math.min(255, Math.round(this.b))).toString(16), 2, '0');
    return '#' + r + g + b;
  }
  plus(c) {
    return new Color(this.r + c.r, this.g + c.g, this.b + c.b);
  }
  scale(s) {
    return new Color(this.r * s, this.g * s, this.b * s);
  }
  toString() {
    return `rgb(${this.r},${this.g},${this.b})`;
  }
  static random() {
    return new Color(
      Math.random() * 255 | 0,
      Math.random() * 255 | 0,
      Math.random() * 255 | 0
    );
  }
}

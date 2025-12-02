export function quatMultiply(a, b) {
  const [w1, x1, y1, z1] = a;
  const [w2, x2, y2, z2] = b;

  return [
    w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2,
    w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2,
    w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2,
    w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2,
  ];
}

export function quatNormalize(q) {
  const len = Math.hypot(...q);
  return len < 1e-8 ? [1, 0, 0, 0] : q.map((v) => v / len);
}

export function axisAngleToQuat(axis, deg) {
  const rad = (deg * Math.PI) / 180;
  const s = Math.sin(rad / 2);
  const c = Math.cos(rad / 2);

  if (axis === "x") return [c, s, 0, 0];
  if (axis === "y") return [c, 0, -s, 0];
  if (axis === "z") return [c, 0, 0, s];
  return [1, 0, 0, 0];
}

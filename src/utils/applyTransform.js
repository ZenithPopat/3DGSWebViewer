import * as BABYLON from "@babylonjs/core";

export function applyTransformToSplat(s, T) {
  const pos = new BABYLON.Vector3(s.px, s.py, s.pz);

  pos.multiplyInPlace(T.scale);
  pos.applyRotationQuaternionInPlace(T.rotation);
  pos.addInPlace(T.position);

  s.px = pos.x;
  s.py = pos.y;
  s.pz = pos.z;

  // rotate orientation
  const q = new BABYLON.Quaternion(s.q1, s.q2, s.q3, s.q0);
  const qr = T.rotation.multiply(q).normalize();

  s.q0 = qr.w;
  s.q1 = qr.x;
  s.q2 = qr.y;
  s.q3 = qr.z;
}

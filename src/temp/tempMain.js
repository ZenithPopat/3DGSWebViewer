import * as BABYLON from "@babylonjs/core";
import { registerBuiltInLoaders } from "@babylonjs/loaders/dynamic";
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);
registerBuiltInLoaders();
const createScene = function () {
  const scene = new BABYLON.Scene(engine);

  // scene.createDefaultCameraOrLight(true, false, true);

  const arcCamera = new BABYLON.ArcRotateCamera(
    "arcCamera",
    0,
    0,
    10,
    new BABYLON.Vector3(0, 0, 0),
    scene
  );

  //Allowing user input
  // camera.attachControl();
  arcCamera.attachControl();

  const light = new BABYLON.DirectionalLight(
    "directionalLight",
    new BABYLON.Vector3(-2, -3, 0),
    scene
  );

  //Raw file data
  // fetch("./gs_Skull.splat")
  //   .then((response) => response.arrayBuffer()) // or .text() if it's text-based
  //   .then((buffer) => {
  //     console.log("Raw file data:", buffer);

  //     // If it's text (JSON-like):
  //     // console.log("Text:", new TextDecoder().decode(buffer));
  //   })
  //   .catch((err) => console.error("Error loading file:", err));

  // fetch("./gs_Skull.splat")
  //   .then((res) => res.arrayBuffer())
  //   .then((buffer) => {
  //     // Interpret as 32-bit floats
  //     const floats = new Float32Array(buffer);
  //     console.log("As floats:", floats);

  //     // Example: first splat
  //     const x = floats[0];
  //     const y = floats[1];
  //     const z = floats[2];
  //     console.log("First splat position:", x, y, z);

  //     const sx = floats[3];
  //     const sy = floats[4];
  //     const sz = floats[5];
  //     console.log("First splat scale:", sx, sy, sz);

  //     const qx = floats[6];
  //     const qy = floats[7];
  //     const qz = floats[8];
  //     const qw = floats[9];
  //     console.log("First splat rotation quaternion:", qx, qy, qz, qw);

  //     const rgba = new Uint32Array(buffer, 10 * 4, 1)[0];
  //     console.log("First splat RGBA (packed int):", rgba.toString(16));
  //   });

  //   const camera = new BABYLON.ArcRotateCamera(
  //     "camera",
  //     Math.PI / 2,
  //     Math.PI / 4,
  //     10,
  //     BABYLON.Vector3.Zero(),
  //     scene
  // );
  // camera.attachControl(canvas, true);

  // const camera = new BABYLON.UniversalCamera(
  //   "camera",
  //   new BABYLON.Vector3(0, 1, -10),
  //   scene
  // );
  // camera.setTarget(BABYLON.Vector3.Zero());
  // camera.attachControl(canvas, true);

  // new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);

  //  const box =  new BABYLON.MeshBuilder.CreateBox("box", {size: 0.2}, scene);

  // BABYLON.ImportMeshAsync("/Goat skull.ply" ,scene, ).then((result) =>{
  //   const gaussianSplattingMesh = result.meshes[0];
  //   gaussianSplattingMesh.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
  // });

  // const box = new BABYLON.MeshBuilder.CreateBox("myBox", {
  //   size: 2,
  //   // width: 2,
  //   // height: 0.05,
  //   // depth: 0.5,
  //   // faceColors: [
  //   //   new BABYLON.Color4(0,1,0,0.5),
  //   //   BABYLON.Color3.Green()
  //   // ]
  //   //Applying unique texture to each face
  //   // faceUV: [
  //   //   new BABYLON.Vector4(0, 0, 1 / 6, 1),
  //   //   new BABYLON.Vector4(1 / 6, 0, 2 / 6, 1),
  //   //   new BABYLON.Vector4(2 / 6, 0, 3 / 6, 1),
  //   //   new BABYLON.Vector4(3 / 6, 0, 4 / 6, 1),
  //   //   new BABYLON.Vector4(4 / 6, 0, 5 / 6, 1),
  //   //   new BABYLON.Vector4(5 / 6, 0, 1, 1),
  //   // ],
  //   wrap: true,
  // });

  // const boxTexture = new BABYLON.StandardMaterial();
  // box.position = new BABYLON.Vector3(2, 5.5, -5); //All 3-axes together

  // const box2 = new BABYLON.MeshBuilder.CreateBox("myBox", {
  //   size: 2,
  //   // width: 2,
  //   // height: 0.05,
  //   // depth: 0.5,
  //   // faceColors: [
  //   //   new BABYLON.Color4(0,1,0,0.5),
  //   //   BABYLON.Color3.Green()
  //   // ]
  //   //Applying unique texture to each face
  //   // faceUV: [
  //   //   new BABYLON.Vector4(0, 0, 1 / 6, 1),
  //   //   new BABYLON.Vector4(1 / 6, 0, 2 / 6, 1),
  //   //   new BABYLON.Vector4(2 / 6, 0, 3 / 6, 1),
  //   //   new BABYLON.Vector4(3 / 6, 0, 4 / 6, 1),
  //   //   new BABYLON.Vector4(4 / 6, 0, 5 / 6, 1),
  //   //   new BABYLON.Vector4(5 / 6, 0, 1, 1),
  //   // ],
  //   wrap: true,
  // });

  // const boxTexture2 = new BABYLON.StandardMaterial();
  // box2.position = new BABYLON.Vector3(2, 5.5, -7); //All 3-axes together

  //Garden Scene
  // BABYLON.ImportMeshAsync("./garden.ply", scene).then((result) => {
  //   const gaussianSplattingMesh = result.meshes[0];
  //   gaussianSplattingMesh.rotate(BABYLON.Axis.X, Math.PI);
  // });

  //Garden Scene converted splat
  // BABYLON.ImportMeshAsync("../tree_bench/splats/garden.splat", scene).then(
  //   (result) => {
  //     const gaussianSplattingMesh = result.meshes[0];
  //     // gaussianSplattingMesh.rotate(BABYLON.Axis.X, Math.PI);
  //   }
  // );

  // BABYLON.ImportMeshAsync("./gs_Skull.splat", scene).then((result) => {
  //   const gaussianSplattingMesh = result.meshes[0];
  //   // gaussianSplattingMesh.scaling = new BABYLON.Vector3(2, 2, 2);
  //   console.log("Meshes:", result.meshes);
  //   console.log("Geometries:", result.geometries);
  //   console.log("Particle Data:", result.meshes[0]);

  //   // Dump full mesh object
  //   console.dir(result.meshes[0]);
  // });

  //3DGS - TreeBench
  // BABYLON.ImportMeshAsync("../tree_bench/001_3DGS.ply", scene).then(
  //   (result) => {
  //     const gaussianSplattingMesh = result.meshes[0];
  //     gaussianSplattingMesh.rotate(BABYLON.Axis.X, Math.PI);
  //   }
  // );

  // BABYLON.ImportMeshAsync("../tree_bench/002_3DGS.ply", scene).then(
  //   (result) => {
  //     const gaussianSplattingMesh = result.meshes[0];
  //     gaussianSplattingMesh.rotate(BABYLON.Axis.X, Math.PI);
  //   }
  // );

  //SplatFiles
  const splatFiles = [
    "../tree_bench/splats/001_3DGS.splat",
    "../tree_bench/splats/002_3DGS.splat",
    // "../tree_bench/splats/001_3DGS.splat",
    // "../tree_bench/splats/002_3DGS.splat",
    // "../tree_bench/splats/001_3DGS.splat",
    // "../tree_bench/splats/002_3DGS.splat",
    // "../tree_bench/splats/001_3DGS.splat",
    // "../tree_bench/splats/002_3DGS.splat",
  ];

  Promise.all(
    splatFiles.map((file) =>
      BABYLON.ImportMeshAsync(file, scene).then((result) => {
        const mesh = result.meshes[0];
        mesh.name = file;
        return mesh;
      })
    )
  ).then((meshes) => {
    console.log("All meshes loaded: ", meshes);
    // meshes[0].position.y += 2;
    // meshes[1].position.x += 3;

    const parent = new BABYLON.TransformNode("splatParent", scene);
    meshes.forEach((m) => (m.parent = parent));
  });

  //3DGS - TreeBench Converted Splat
  // BABYLON.ImportMeshAsync("../tree_bench/splats/001_3DGS.splat", scene).then(
  //   (result) => {
  //     const gaussianSplattingMesh = result.meshes[0];
  //     // gaussianSplattingMesh.rotate(BABYLON.Axis.X, Math.PI);
  //   }
  // );

  // BABYLON.ImportMeshAsync("../tree_bench/splats/002_3DGS.splat", scene).then(
  //   (result) => {
  //     const gaussianSplattingMesh = result.meshes[0];
  //     // gaussianSplattingMesh.rotate(BABYLON.Axis.X, Math.PI);
  //   }
  // );

  //2DGS - TreeBench Converted Splat
  // BABYLON.ImportMeshAsync("../tree_bench/splats/001.splat", scene).then(
  //   (result) => {
  //     const gaussianSplattingMesh = result.meshes[0];
  //     // gaussianSplattingMesh.rotate(BABYLON.Axis.X, Math.PI);
  //   }
  // );

  // BABYLON.ImportMeshAsync("../tree_bench/splats/002.splat", scene).then(
  //   (result) => {
  //     const gaussianSplattingMesh = result.meshes[0];
  //     // gaussianSplattingMesh.rotate(BABYLON.Axis.X, Math.PI);
  //   }
  // );

  //2DGS - TreeBench
  // BABYLON.ImportMeshAsync("../tree_bench/001.ply", scene).then((result) => {
  //   const gaussianSplattingMesh = result.meshes[0];
  //   // gaussianSplattingMesh.rotate(BABYLON.Axis.X, Math.PI);
  // });

  // BABYLON.ImportMeshAsync("../tree_bench/002.ply", scene).then((result) => {
  //   const gaussianSplattingMesh = result.meshes[0];
  // });

  //2DGS - pointcloud
  // BABYLON.ImportMeshAsync("../tree_bench/point_cloud.ply", scene).then(
  //   (result) => {
  //     const gaussianSplattingMesh = result.meshes[0];
  //     // gaussianSplattingMesh.rotate(BABYLON.Axis.X, Math.PI);
  //   }
  // );

  //2DGS - pointcloud converted to Splat
  // BABYLON.ImportMeshAsync("../tree_bench/splats/point_cloud.splat", scene).then(
  //   (result) => {
  //     const gaussianSplattingMesh = result.meshes[0];
  //     // gaussianSplattingMesh.rotate(BABYLON.Axis.X, Math.PI);
  //   }
  // );

  // //3DGS - pointcould
  // BABYLON.ImportMeshAsync("../tree_bench/point_cloud_3DGS.ply", scene).then(
  //   (result) => {
  //     const gaussianSplattingMesh = result.meshes[0];
  //     // gaussianSplattingMesh.rotate(BABYLON.Axis.X, Math.PI);
  //   }
  // );

  //3DGS - pointcould
  // BABYLON.ImportMeshAsync(
  //   "../tree_bench/splats/point_cloud_3DGS.splat",
  //   scene
  // ).then((result) => {
  //   const gaussianSplattingMesh = result.meshes[0];
  //   // gaussianSplattingMesh.rotate(BABYLON.Axis.X, Math.PI);
  //   console.log("Meshes:", result.meshes);
  //   console.log("Geometries:", result.geometries);
  //   console.log("Particle Data:", result.meshes[0]);

  //   // Dump full mesh object
  //   console.dir("Full Mesh:", result.meshes[0]);
  // });

  //2DGS StMatrinsPlatz
  // BABYLON.ImportMeshAsync(
  //   "../2DGS/zenith/2D_Gaussian_Splatting/StMartinsPlatz/point_cloud.ply",
  //   scene
  // ).then((result) => {
  //   const gaussianSplattingMesh = result.meshes[0];
  //   // gaussianSplattingMesh.rotate(BABYLON.Axis.X, Math.PI);
  // });

  //2DGS StMatrinsPlatz
  // BABYLON.ImportMeshAsync(
  //   "../tree_bench/splats/StMartinsPlatz.splat",
  //   scene
  // ).then((result) => {
  //   const gaussianSplattingMesh = result.meshes[0];
  //   // gaussianSplattingMesh.rotate(BABYLON.Axis.X, Math.PI);
  // });

  // const shadowGenerator = new BABYLON.ShadowGenerator(1024, light); //(QualityOfShadow[lower = more pixelate], light)

  //Specify which objects can cast a shadow
  // shadowGenerator.addShadowCaster(box);

  // gs.receiveShadows = true;

  // var camera = new BABYLON.ArcRotateCamera("camera1", -1,1,10,new BABYLON.Vector3(0, 0, 0), scene);

  //   // This attaches the camera to the canvas
  //   camera.attachControl(canvas, true);

  //   // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
  //   var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

  //   // Default intensity is 1. Let's dim the light a small amount
  //   light.intensity = 0.7;

  //   // Our built-in 'sphere' shape.
  //   var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 1, segments: 32}, scene);

  //   // Move the sphere upward 1/2 its height
  //   sphere.position.y = 0.5;
  //   sphere.position.z = -1;

  //   // Our built-in 'ground' shape.
  //   var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 6, height: 6}, scene);

  //   // Gaussian Splatting
  //   BABYLON.SceneLoader.ImportMeshAsync(null, "https://raw.githubusercontent.com/CedricGuillemet/dump/master/", "Halo_Believe.splat", scene).then((result) =>{
  //       result.meshes[0].position.y = 1.7;
  //   });
  scene.debugLayer.show();
  return scene;
};

const scene = createScene();

engine.runRenderLoop(function () {
  scene.render();
});

window.addEventListener("resize", function () {
  engine.resize();
});

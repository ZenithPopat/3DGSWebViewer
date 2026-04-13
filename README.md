# Interactive Scene Editor for Gaussian Splatting-based 3D Models

## Author

Zenith Popat

## Description

This project implements a web-based interactive editor for Gaussian splatting-based 3D scenes.
The application allows users to load, visualize, and manipulate multiple Gaussian splat datasets within a unified 3D environment directly in the browser.

The system extends Gaussian splatting from a visualization-focused approach to an interactive editing framework by introducing object-level interaction, region-based editing, and a unified rendering strategy.

---

## Features

* Multi-file loading (.splat and .ply)
* Unified scene representation for multiple datasets
* Object-level selection and transformation
* Region-based splat selection (spherical and cubical)
* Editing operations (deletion and modification)
* Baking mechanism for deferred updates
* Adjustable rendering settings (quality vs performance)
* Export of modified scenes or individual objects

---

## Live Demo

The application is deployed and accessible at:
[3DGS_Editor](https://3dgseditor.vercel.app/)

---

## Setup Instructions

### Prerequisites

* Node.js (if using a development server)
* Modern web browser (Chrome, Edge, Firefox)

### Installation

```
npm install
```

### Run Development Server

```
npm run dev
```

Alternatively, the project can be opened directly in a browser if no build step is required.

---

## Technologies Used

* JavaScript
* HTML / CSS
* Babylon.js
* WebGL

---

## Notes

* All processing is performed client-side in the browser.
* Performance depends on the available GPU and system resources.
* Large datasets may reduce frame rate on lower-end devices.

---

## Thesis Context

This project was developed as part of a Master's thesis titled:

**"Interactive Scene Editor for Gaussian Splatting-based 3D Models"**

The focus of the work is on enabling interactive editing, efficient rendering, and scalable handling of Gaussian splatting datasets in a web-based environment.

---

## License

This project is intended for academic and research purposes.

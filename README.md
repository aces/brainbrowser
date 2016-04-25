![LOGO](https://brainbrowser.cbrain.mcgill.ca/img/bb-logo-white-mini-cropped.png)

[![Build Status](https://travis-ci.org/aces/brainbrowser.svg?branch=master)](https://travis-ci.org/aces/brainbrowser)


BrainBrowser is a JavaScript library allowing for web-based, 2D and 3D visualization of neurological data. It consists of the **Surface Viewer**, a real-time 3D rendering tool for visualizing surface data, and the **Volume Viewer**, a slice-by-slice volumetric data analysis tool.

BrainBrowser uses open web-standard technologies such as HTML5, CSS, JavaScript and WebGL. The Surface Viewer uses [three.js](http://threejs.org/) for 3D rendering.

Demonstrations of available functionality can be found at the [BrainBrowser website](https://brainbrowser.cbrain.mcgill.ca/).

Getting Started
---------------

To try out some BrainBrowser sample applications, simply clone this git repo, and make the **examples** directory available over HTTP. This can be done using [nano-server](https://www.npmjs.org/package/nano-server):

```Shell
  $ git clone https://github.com/aces/brainbrowser.git
  $ npm install -g nano-server
  $ nano-server 5000 brainbrowser/examples
```

Note that [nano-server](https://www.npmjs.org/package/nano-server) is recommended because it can send **gzip** compressed versions of requested files. If a server without this functionality is used, files in **brainbrowser/examples/models/** and **brainbrowser/examples/color-maps/** will have to be **gunzipped**.

Once the server is running, navigate to to appropriate address (localhost:5000 in the above example) in your browser and select either of the **Surface Viewer** or **Volume Viewer** sample applications.

Surface Viewer
--------------

The BrainBrowser Surface Viewer allows users to display and manipulate 3D surface data. The Surface Viewer is invoked by calling **BrainBrowser.SurfaceViewer.start()** with the id of the HTML element into which the viewer will be inserted, and a callback function to which a [viewer object](https://brainbrowser.cbrain.mcgill.ca/documentation/brainbrowser/surface-viewer/viewer) will be passed:

```JavaScript
  BrainBrowser.SurfaceViewer.start("viewer-div", function(viewer) {
    // Manipulate viewer object here.
  });
```

Full documentation of the Surface Viewer API can be found [here](https://brainbrowser.cbrain.mcgill.ca/documentation/brainbrowser/surface-viewer/index).

Volume Viewer
--------------

The BrainBrowser Volume Viewer allows users to display and manipulate volumetric data in a slice-by-slice manner. The Volume Viewer is invoked by calling **BrainBrowser.VolumeViewer.start()** with the id of the HTML element into which the viewer will be inserted, and a callback function to which a [viewer object](https://brainbrowser.cbrain.mcgill.ca/documentation/brainbrowser/volume-viewer/viewer) will be passed:

```JavaScript
  BrainBrowser.VolumeViewer.start("viewer-div", function(viewer) {
    // Manipulate viewer object here.
  });
```

Full documentation of the Volume Viewer API can be found [here](https://brainbrowser.cbrain.mcgill.ca/documentation/brainbrowser/volume-viewer/index).

Contributing
------------

Please see the [Contribution Guidelines](https://github.com/aces/brainbrowser/blob/master/CONTRIBUTING.md).

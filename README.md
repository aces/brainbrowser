BrainBrowser
============

BrainBrowser is a JavaScript library allowing for web-based, 2D and 3D visualization of neurological data. It consists of the **Surface Viewer**, a real-time 3D rendering tool for visualizing surface data, and the **Volume Viewer**, a slice-by-slice volumetric data analysis tool.

BrainBrowser uses open web-standard technologies such as HTML5, CSS, JavaScript and WebGL. The Surface Viewer uses [three.js](http://threejs.org/) for 3D rendering.

Demonstrations of available functionality can be found at the [BrainBrowser web site](https://brainbrowser.cbrain.mcgill.ca/).

Getting Started
---------------

To try out some BrainBrowser sample applications, simply make the **examples** directory available through a server and navigate to it. The following is an example that uses the [mongoose](https://code.google.com/p/mongoose/) server to accomplish this:

```Shell
  $ git clone https://github.com/aces/brainbrowser.git
  $ cd brainbrowser/examples
  $ mongoose
```

Once the server is running, navigate to localhost:8080 in your browser and open either **surface-viewer-demo.html** or **volume-viewer-demo.html**.

**Note:** If the server you're using doesn't support serving gzipped content, you'll have to unzip the contents of the directories **examples/color_maps** and **examples/models**. Git will ignore the unzipped files, and you can checkout the **examples** directory to restore the compressed files.

```Shell
  $ cd brainbrowser/examples
  $ gunzip color_maps/*.gz models/*.gz
  $ git checkout .
```

Surface Viewer
--------------

The BrainBrowser Surface Viewer allows users to display and manipulate 3D surface data. The Surface Viewer is invoked by calling **BrainBrowser.SurfaceViewer.start()** with the id of the HTML element into which the viewer will be inserted, and a callback function to which a [viewer object](https://brainbrowser.cbrain.mcgill.ca/documentation/brainbrowser/surface-viewer/viewer) will be passed:

```JavaScript
  BrainBrowser.SurfaceViewer.start("viewer_div", function(viewer) {
    // Manipulate viewer object here.
  });
```

Full documentation of the Surface Viewer API can be found [here](https://brainbrowser.cbrain.mcgill.ca/documentation/brainbrowser/surface-viewer).

Note that the BrainBrowser Surface Viewer requires [three.js](http://threejs.org/).

Volume Viewer
--------------

The BrainBrowser Volume Viewer allows users to display and manipulate volumetric data in a slice-by-slice manner. The Volume Viewer is invoked by calling **BrainBrowser.VolumeViewer.start()** with the id of the HTML element into which the viewer will be inserted, and a callback function to which a [viewer object](https://brainbrowser.cbrain.mcgill.ca/documentation/brainbrowser/volume-viewer/viewer) will be passed:

```JavaScript
  BrainBrowser.VolumeViewer.start("viewer_div", function(viewer) {
    // Manipulate viewer object here.
  });
```

Full documentation of the Volume Viewer API can be found [here](https://brainbrowser.cbrain.mcgill.ca/documentation/brainbrowser/volume-viewer).

Contributing
------------

Please see the [Contribution Guidelines](https://github.com/aces/brainbrowser/blob/master/CONTRIBUTING.md).

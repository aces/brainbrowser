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
  $ npm install --legacy-peer-deps
  $ npm install -g grunt-cli
  $ grunt compile
  $ npm install -g nano-server
  $ nano-server 5000 examples
```

### Windows Users

Windows users must use **WSL (Windows Subsystem for Linux)** because the project uses a Unix symlink (`examples/js/brainbrowser → src/brainbrowser`) that does not work natively on Windows. When git clones the repository on Windows, this symlink is checked out as a plain 23-byte text file instead of an actual directory link. This causes both viewers to show a blank black screen with 404 errors in the browser console because none of the JS files can be found.

To set up WSL:

1. Open PowerShell as Administrator and run:
```Shell
   $ wsl --install
```

2. After completing all the installtaions restart your computer.

3. Open **Ubuntu** from the Start menu and set up your username and password.

4. Install Node.js inside WSL (WSL has its own separate environment and does not use your Windows Node.js installation):
```Shell
   $ curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   $ sudo apt-get install -y nodejs
```

5. Navigate to your project inside WSL (Windows drives are mounted under `/mnt/`):
```Shell
   $ cd /mnt/path/to/brainbrowser
```

6. Fix the Unix symlink. When git clones on Windows, the symlink `examples/js/brainbrowser` is saved as a plain text file containing the path `../../src/brainbrowser` instead of acting as a real directory link. This must be manually recreated as a proper Linux symlink inside WSL:
```Shell
   $ rm examples/js/brainbrowser

   $ ln -s ../../src/brainbrowser examples/js/brainbrowser
```

7. Now run all these commands in the WSL terminal:
```Shell
  $ git clone https://github.com/aces/brainbrowser.git
  $ npm install --legacy-peer-deps
  $ npm install -g grunt-cli
  $ grunt compile
  $ npm install -g nano-server
  $ nano-server 5000 examples
```


Note that [nano-server](https://www.npmjs.org/package/nano-server) is recommended because it can send **gzip** compressed versions of requested files. If a server without this functionality is used, files in **brainbrowser/examples/models/** and **brainbrowser/examples/color-maps/** will have to be **gunzipped**.

Once the server is running, navigate to appropriate address (localhost:5000 in the above example) in your browser and select either of the **Surface Viewer** or **Volume Viewer** sample applications.

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

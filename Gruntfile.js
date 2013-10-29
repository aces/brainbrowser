module.exports = function(grunt) {
  "use strict";
  
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    dev_js: "public/development/js",
    prod_js: "public/production/js",
    license: grunt.file.read("license_header.txt"),
    concat: {
      options: {
        separator: ";"
      },
      surface: {
        src: [
          "<%= dev_js %>/lib/brainbrowser.utils.js",
          "<%= dev_js %>/surface-viewer/brainbrowser.surface-viewer.js",
          "<%= dev_js %>/surface-viewer/modules/*",
          "<%= dev_js %>/surface-viewer/data/*",
          "<%= dev_js %>/surface-viewer/filetypes/*",

        ],
        dest: "tmp/brainbrowser.surface-viewer.js"
      },
      macacc: {
        src: [
          "<%= dev_js %>/macacc/macacc.js",
          "<%= dev_js %>/macacc-viewer.js"
        ],
        dest: "tmp/macacc-viewer-combined.js"
      },
      volume: {
        src: [
          "<%= dev_js %>/lib/brainbrowser.utils.js",
          "<%= dev_js %>/volume-viewer/brainbrowser.volume-viewer.js",
          "<%= dev_js %>/volume-viewer/modules/*",
          "<%= dev_js %>/volume-viewer/volumes/*"
        ],
        dest: "tmp/brainbrowser.volume-viewer.js"
      }
    },
    uglify: {
      options: {
        report: "min",
        banner: "<%= license %>\n/* <%= pkg.name %> v<%= pkg.version %> */\n"
      },
      surface: {
        files: {
          "build/brainbrowser.surface-viewer-<%= pkg.version %>.min.js": "<%= concat.surface.dest %>"
        }
      },
      surface_ui: {
        files: {
          "<%= prod_js %>/brainbrowser.surface-viewer.ui.min.js": "<%= dev_js %>/surface-viewer/ui/brainbrowser.surface-viewer.ui.js"
        }
      },
      surface_demo: {
        files: {
          "<%= prod_js %>/surface-viewer-demo.js": "<%= dev_js %>/surface-viewer-demo.js"
        }
      },
      macacc: {
        files: {
          "<%= prod_js %>/macacc-viewer-combined.min.js": "<%= concat.macacc.dest %>"
        }
      },
      volume: {
        files: {
          "build/brainbrowser.volume-viewer-<%= pkg.version %>.min.js": "<%= concat.volume.dest %>"
        }
      },
      volume_ui: {
        files: {
          "build/brainbrowser.volume-viewer.ui-controls-<%= pkg.version %>.min.js": "<%= dev_js %>/volume-viewer/ui/brainbrowser.volume-viewer.ui-controls.js"
        }
      },
      volume_demo: {
        files: {
          "<%= prod_js %>/volume-viewer-demo.js": "<%= dev_js %>/volume-viewer-demo.js"
        }
      },
      fmri: {
        files: {
          "<%= prod_js %>/fmri-viewer.js": "<%= dev_js %>/fmri-viewer.js"
        }
      },
      libs : {
        files: {
          "<%= prod_js %>/layout.js": "<%= dev_js %>/layout.js",
          "<%= prod_js %>/lib/ui.js": "<%= dev_js %>/lib/ui.js",
          "<%= prod_js %>/lib/brainbrowser.utils.js": "<%= dev_js %>/lib/brainbrowser.utils.js"
        }
      },
      workers: {
        files: {
          "<%= prod_js %>/workers/mniobj.worker.js": "<%= dev_js %>/workers/mniobj.worker.js",
          "<%= prod_js %>/workers/wavefront_obj.worker.js": "<%= dev_js %>/workers/wavefront_obj.worker.js",
          "<%= prod_js %>/workers/freesurfer_asc.worker.js": "<%= dev_js %>/workers/freesurfer_asc.worker.js",
          "<%= prod_js %>/workers/data.worker.js": "<%= dev_js %>/workers/data.worker.js"
        }
      }
    },
    jshint: {
      options: {
        eqeqeq: true,
        undef: true,
        unused: true,
        strict: true,
        indent: 2,
        immed: true,
        latedef: true,
        newcap: true,
        nonew: true,
        trailing: true
      },
      grunt: {
        src: "Gruntfile.js",
        options: {
          node: true
        }
      },
      server: {
        src: ["brainbrowser.js", "lib/minc-server.js", "routes/routes.js"],
        options: {
          node: true
        }
      },
      brainbrowser: {
        options: {
          browser: true,
          jquery: true,
          globals: {
            THREE: true,
            BrainBrowser: true,
            MACACC: true,
            utils: true,
            alert: true
          }
        },
        src: [
          "<%= dev_js %>/layout.js",
          "<%= dev_js %>/lib/ui.js",
          "<%= concat.surface.src %>",
          "<%= dev_js %>/surface-viewer.js",
          "<%= dev_js %>/macacc/macacc.js",
          "<%= dev_js %>/macacc-viewer.js",
          "<%= concat.volume.src %>",
          "<%= dev_js %>/fmri-viewer.js"
        ]
      },
      workers: {
        options: {
          worker: true
        },
        src: ["<%= dev_js %>/workers/*.js"]
      },
      loris: {
        options: {
          browser: true,
          jquery: true,
          globals: {
            BrainCanvas: true,
          }
        },
        src: ["public/development/loris/js/braincanvas.loris_ui_controls.js"]
      }
    },
    clean: {
      build :[
        "<%= prod_js %>/brainbrowser.surface-viewer.min.js",
        "<%= prod_js %>/brainbrowser.volume-viewer.min.js",
        "<%= prod_js %>/brainbrowser.volume-viewer.ui-controls.min.js",
        "build/*.min.js"
      ],
      tmp: "tmp/*.js"
    },
    symlink: {
      explicit: {
        options: {
          overwrite: true
        },
        files: {
          "<%= prod_js %>/brainbrowser.surface-viewer.min.js": "build/brainbrowser.surface-viewer-<%= pkg.version %>.min.js",
          "<%= prod_js %>/brainbrowser.volume-viewer.min.js": "build/brainbrowser.volume-viewer-<%= pkg.version %>.min.js",
          "<%= prod_js %>/brainbrowser.volume-viewer.ui-controls.min.js": "build/brainbrowser.volume-viewer.ui-controls-<%= pkg.version %>.min.js"
        }
      }
    },
    watch: {
      grunt : {
        files: ["<%= jshint.grunt.src %>"],
        tasks: ["jshint:grunt"]
      },
      brainbrowser : {
        files: ["<%= jshint.brainbrowser.src %>"],
        tasks: ["jshint:brainbrowser"]
      },
      workers : {
        files: ["<%= jshint.workers.src %>"],
        tasks: ["jshint:workers"]
      },
      loris : {
        files: ["<%= jshint.loris.src %>"],
        tasks: ["jshint:loris"]
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-symlink');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask("compile", ["clean", "concat", "uglify", "symlink"]);

  grunt.registerTask("default", [
    "jshint",
    "compile"
  ]);
};

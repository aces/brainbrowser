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
          "<%= dev_js %>/lib/array.js",
          "<%= dev_js %>/brainbrowser/**/*.js",
          "<%= dev_js %>/lib/utils.js",
          "<%= dev_js %>/surface-viewer.js"
        ],
        dest: "tmp/surfview-combined.js"
      },
      macacc: {
        src: [
          "<%= dev_js %>/lib/array.js",
          "<%= dev_js %>/brainbrowser/**/*.js",
          "<%= dev_js %>/macacc/macacc.js",
          "<%= dev_js %>/lib/utils.js",
          "<%= dev_js %>/macacc-viewer.js"
        ],
        dest: "tmp/macacc-viewer-combined.js"
      },
      volume: {
        src: [
          "<%= dev_js %>/volume-viewer.js",
          "<%= dev_js %>/braincanvas/**/*.js"
        ],
        dest: "tmp/volume-viewer-combined.js"
      }
    },
    uglify: {
      options: {
        report: "min",
        banner: "<%= license %>\n/* <%= pkg.name %> v<%= pkg.version %> */\n"
      },
      surface: {
        files: {
          "<%= prod_js %>/surface-viewer-combined.min.js": ["<%= concat.surface.dest %>"]
        }
      },
      macacc: {
        files: {
          "<%= prod_js %>/macacc-viewer-combined.min.js": ["<%= concat.macacc.dest %>"]
        }
      },
      volume: {
        files: {
          "<%= prod_js %>/volume-viewer-combined.min.js": ["<%= concat.volume.dest %>"]
        }
      },
      libs : {
        files: {
          "<%= prod_js %>/layout.js": "<%= dev_js %>/layout.js",
          "<%= prod_js %>/lib/ui.js": "<%= dev_js %>/lib/ui.js",
          "<%= prod_js %>/lib/utils.js": "<%= dev_js %>/lib/utils.js"
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
          "<%= dev_js %>/macacc/macacc.js",
          "<%= dev_js %>/macacc-viewer.js"
        ]
      },
      workers: {
        options: {
          worker: true
        },
        src: ["<%= dev_js %>/workers/*.js"]
      },
      volume: {
        options: {
          browser: true,
          jquery: true,
          globals: {
            BrainCanvas: true,
            oFactory: true
          }
        },
        src: ["<%= concat.volume.src %>"]
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
      volume : {
        files: ["<%= jshint.volume.src %>"],
        tasks: ["jshint:braincanvas"]
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

  grunt.registerTask("compile", ["concat", "uglify"]);

  grunt.registerTask("default", [
    "jshint",
    "concat",
    "uglify"
  ]);
};

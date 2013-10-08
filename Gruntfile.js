module.exports = function(grunt) {
  "use strict";
  
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    dev_js: "development/public/js",
    prod_js: "production/public/js",
    license: grunt.file.read("license_header.txt"),
    concat: {
      options: {
        separator: ";"
      },
      surfview: {
        src: [
          "<%= dev_js %>/lib/utils.js",
          "<%= dev_js %>/brainbrowser/**/*.js",
          "<%= dev_js %>/surfview.js"
        ],
        dest: "tmp/surfview-combined.js"
      },
      macacc: {
        src: [
          "<%= dev_js %>/lib/utils.js",
          "<%= dev_js %>/brainbrowser/**/*.js",
          "<%= dev_js %>/macacc/macacc.js",
          "<%= dev_js %>/macaccview.js"
        ],
        dest: "tmp/macaccview-combined.js"
      },
      braincanvas: {
        src: [
          "<%= dev_js %>/braincanvas.js",
          "<%= dev_js %>/braincanvas/*"
        ],
        dest: "tmp/html5-minc-viewer.js"
      }
    },
    uglify: {
      options: {
        report: "min",
        banner: "<%= license %>\n/* <%= pkg.name %> v<%= pkg.version %> */\n"
      },
      surfview: {
        files: {
          "<%= prod_js %>/surfview-combined.min.js": ["<%= concat.surfview.dest %>"]
        }
      },
      macacc: {
        files: {
          "<%= prod_js %>/macaccview-combined.min.js": ["<%= concat.macacc.dest %>"]
        }
      },
      braincanvas: {
        files: {
          "<%= prod_js %>/html5-minc-viewer.min.js": ["<%= concat.braincanvas.dest %>"]
        }
      },
      libs : {
        files: {
          "<%= prod_js %>/layout.js": "<%= dev_js %>/layout.js",
          "<%= prod_js %>/lib/ui.js": "<%= dev_js %>/lib/ui.js",
          "<%= prod_js %>/lib/brainbrowser.utils.js": "<%= dev_js %>/brainbrowser/modules/brainbrowser.utils.js"
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
      brainbrowser: {
        options: {
          browser: true,
          jquery: true,
          globals: {
            THREE: true,
            BrainBrowser: true,
            MACACC: true,
            alert: true
          }
        },
        src: [
          "<%= dev_js %>/layout.js",
          "<%= dev_js %>/lib/ui.js",
          "<%= concat.surfview.src %>",
          "<%= dev_js %>/macacc/macacc.js",
          "<%= dev_js %>/macaccview.js"
        ]
      },
      workers: {
        options: {
          worker: true,
        },
        src: ["<%= dev_js %>/workers/*.js"]
      },
      braincanvas: {
        options: {
          browser: true,
          jquery: true,
          globals: {
            BrainCanvas: true,
            oFactory: true
          }
        },
        src: ["<%= concat.braincanvas.src %>"]
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
      braincanvas : {
        files: ["<%= jshint.braincanvas.src %>"],
        tasks: ["jshint:braincanvas"]
      },
    }
  });

  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask("compile", ["concat", "uglify"]);

  grunt.registerTask("default", ["jshint", "concat", "uglify"]);
};

/*
* BrainBrowser: Web-based Neurological Visualization Tools
* (https://brainbrowser.cbrain.mcgill.ca)
*
* Copyright (C) 2011 
* The Royal Institution for the Advancement of Learning
* McGill University
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*
* Author: Tarek Sherif  <tsherif@gmail.com> (http://tareksherif.ca/)
*/

module.exports = function(grunt) {
  "use strict";
  
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    BRAINBROWSER_VERSION: "<%= pkg.version %>",
    build_dir: "build/brainbrowser-<%= BRAINBROWSER_VERSION %>",
    release_dir: "public/common/release",
    license: grunt.file.read("license-header.txt"),
    concat: {
      options: {
        separator: ";",
        process: true
      },
      surface: {
        src: [
          "src/brainbrowser/brainbrowser.js",
          "src/brainbrowser/core/*.js",
          "src/brainbrowser/lib/*.js",
          "src/brainbrowser/surface-viewer.js",
          "src/brainbrowser/surface-viewer/**/*.js"
        ],
        dest: "tmp/brainbrowser.surface-viewer.js"
      },
      volume: {
        src: [
          "src/brainbrowser/brainbrowser.js",
          "src/brainbrowser/core/*.js",
          "src/brainbrowser/lib/*.js",
          "src/brainbrowser/volume-viewer.js",
          "src/brainbrowser/volume-viewer/**/*.js"
        ],
        dest: "tmp/brainbrowser.volume-viewer.js"
      }
    },
    uglify: {
      options: {
        report: "min",
        banner: "<%= license %>\n" +
                "/*\n" +
                "* BrainBrowser v<%= pkg.version %>\n" +
                "*\n" +
                "* Author: Tarek Sherif  <tsherif@gmail.com> (http://tareksherif.ca/)\n" +
                "* Author: Nicolas Kassis\n" +
                "* Author: Paul Mougel\n" +
                "*\n" +
                "* three.js (c) 2010-2014 three.js authors, used under the MIT license\n" +
                "*/\n"
      },
      surface: {
        files: {
          "<%= build_dir %>/brainbrowser.surface-viewer.min.js": "<%= concat.surface.dest %>"
        }
      },
      volume: {
        files: {
          "<%= build_dir %>/brainbrowser.volume-viewer.min.js": "<%= concat.volume.dest %>"
        }
      },
      workers: {
        files: {
          "<%= build_dir %>/workers/mniobj.worker.js": "src/brainbrowser/workers/mniobj.worker.js",
          "<%= build_dir %>/workers/json.worker.js": "src/brainbrowser/workers/json.worker.js",
          "<%= build_dir %>/workers/wavefrontobj.worker.js": "src/brainbrowser/workers/wavefrontobj.worker.js",
          "<%= build_dir %>/workers/freesurferbin.worker.js": "src/brainbrowser/workers/freesurferbin.worker.js",
          "<%= build_dir %>/workers/freesurferasc.worker.js": "src/brainbrowser/workers/freesurferasc.worker.js",
          "<%= build_dir %>/workers/text.intensity.worker.js": "src/brainbrowser/workers/text.intensity.worker.js",
          "<%= build_dir %>/workers/freesurferbin.intensity.worker.js": "src/brainbrowser/workers/freesurferbin.intensity.worker.js",
          "<%= build_dir %>/workers/freesurferasc.intensity.worker.js": "src/brainbrowser/workers/freesurferasc.intensity.worker.js",
          "<%= build_dir %>/workers/deindex.worker.js": "src/brainbrowser/workers/deindex.worker.js",
          "<%= build_dir %>/workers/wireframe.worker.js": "src/brainbrowser/workers/wireframe.worker.js"
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
          globals: {
            THREE: true,
            BrainBrowser: true,
            alert: true,
            console: true
          }
        },
        src: [
          "<%= concat.surface.src %>",
          "<%= concat.volume.src %>",
          "!src/brainbrowser/surface-viewer/lib/three.js"
        ]
      },
      workers: {
        options: {
          worker: true,
          globals: {
            Float32Array: true,
            Uint32Array: true,
            DataView: true
          }
        },
        src: ["src/brainbrowser/workers/*.js"]
      },
      examples: {
        options: {
          browser: true,
          jquery: true,
          globals: {
            BrainBrowser: true,
            THREE: true
          }
        },
        src: [
          "examples/surface-viewer-demo.js",
          "examples/volume-viewer-demo.js",
          "examples/surface-viewer-demo.config.js",
          "examples/volume-viewer-demo.config.js"
        ]
      },
      scripts: {
        options: {
          node: true
        },
        src: [
          "scripts/minc2volume-viewer.js"
        ]
      }
    },
    clean: {
      tmp: "tmp/*.js",
      docs: ["docs/docular/.htaccess", "docs/docular/favicon.ico", "docs/docular/configs", "docs/docular/controller", "docs/docular/php"]
    },
    compress: {
      release: {
        options: {
          archive: "release/brainbrowser-<%= BRAINBROWSER_VERSION %>.tar.gz"
        },
        expand: true,
        cwd: "build/",
        src: "brainbrowser-<%= BRAINBROWSER_VERSION %>/**"
      }
    },
    qunit: {
      all: ["test/*.html"]
    },
    docular: {
      docular_webapp_target: "docs/docular",
      docular_partial_home: "docs/docular_brainbrowser_home.html",
      groups: [
        {
          groupTitle: "BrainBrowser v<%= pkg.version %>",
          groupId: "brainbrowser",
          showSource: false,
          sections: [
            {
              title: "BrainBrowser",
              id: "brainbrowser",
              scripts: ["src/brainbrowser/brainbrowser.js", "src/brainbrowser/core", "src/brainbrowser/lib"]
            },
            {
              title: "Surface Viewer",
              id: "surface-viewer",
              scripts: ["src/brainbrowser/surface-viewer.js", "src/brainbrowser/surface-viewer"]
            },
            {
              title: "Volume Viewer",
              id: "volume-viewer",
              scripts: ["src/brainbrowser/volume-viewer.js", "src/brainbrowser/volume-viewer"]
            }
          ]
        }
      ]
    }
  });

  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-compress");
  grunt.loadNpmTasks("grunt-contrib-qunit");
  grunt.loadNpmTasks("grunt-docular");

  grunt.registerTask("compile", ["clean", "concat", "uglify"]);
  grunt.registerTask("build", ["test", "compile", "compress"]);
  grunt.registerTask("test", ["jshint", "qunit"]);
  grunt.registerTask("docs", ["docular", "clean:docs"]);
  grunt.registerTask("default", "test");
};

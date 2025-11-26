/*
* Custom Grunt task for JavaScript obfuscation
* Uses javascript-obfuscator with medium-level settings
* Balances code protection with performance
*/

module.exports = function(grunt) {
  'use strict';

  grunt.registerMultiTask('obfuscate', 'Obfuscate JavaScript files', function() {
    var JavaScriptObfuscator = require('javascript-obfuscator');
    var fs = require('fs');
    var path = require('path');

    var options = this.options({
      compact: true,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 0.5,
      deadCodeInjection: true,
      deadCodeInjectionThreshold: 0.2,
      debugProtection: false, // Set to true for production
      debugProtectionInterval: false,
      disableConsoleOutput: false,
      identifierNamesGenerator: 'hexadecimal',
      log: false,
      numbersToExpressions: true,
      renameGlobals: false, // Don't rename BrainBrowser global
      rotateStringArray: true,
      selfDefending: false, // Can break in some browsers
      shuffleStringArray: true,
      simplify: true,
      splitStrings: true,
      splitStringsChunkLength: 10,
      stringArray: true,
      stringArrayEncoding: ['base64'],
      stringArrayIndexShift: true,
      stringArrayWrappersCount: 2,
      stringArrayWrappersChainedCalls: true,
      stringArrayWrappersParametersMaxCount: 4,
      stringArrayWrappersType: 'function',
      stringArrayThreshold: 0.75,
      transformObjectKeys: true,
      unicodeEscapeSequence: false
    });

    this.files.forEach(function(file) {
      file.src.forEach(function(srcPath) {
        if (!grunt.file.exists(srcPath)) {
          grunt.log.warn('Source file "' + srcPath + '" not found.');
          return;
        }

        var code = grunt.file.read(srcPath);

        grunt.log.writeln('Obfuscating ' + srcPath + '...');

        try {
          var obfuscationResult = JavaScriptObfuscator.obfuscate(code, options);
          var obfuscatedCode = obfuscationResult.getObfuscatedCode();

          grunt.file.write(file.dest, obfuscatedCode);
          grunt.log.ok('File "' + file.dest + '" created.');

          // Report size difference
          var originalSize = code.length;
          var obfuscatedSize = obfuscatedCode.length;
          var increase = ((obfuscatedSize - originalSize) / originalSize * 100).toFixed(2);

          grunt.log.writeln('Size change: ' + increase + '% (' +
                           originalSize + ' -> ' + obfuscatedSize + ' bytes)');

        } catch (e) {
          grunt.log.error('Obfuscation failed for ' + srcPath);
          grunt.log.error(e);
        }
      });
    });
  });
};

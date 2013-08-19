/* 
 * Copyright (C) 2011 McGill University
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

function Loader() {
  var that = this;
  
  function loadFromUrl(url,sync,callback) {
    jQuery.ajax({ type: 'GET',
      url: url ,
      dataType: 'text',
      success: function(data) {
        callback(data);
      },
      error: function(request,textStatus,e) {
      //alert("Failure: " + "load data");
  
      },
      data: {},
      async: sync,
      timeout: 100000
    });

  }

  function loadFromTextFile(file_input,callback) {
    var reader = new FileReader();
    var files = file_input.files;
    reader.file = files[0];

    reader.onloadend = function(e) {
      callback(e.target.result);
    };

    reader.readAsText(files[0]);

  }


  that.loadObjFromUrl = function(url) {
    loadFromUrl(url, false,function(data) {
      that.createBrain(new MNIObject(data));
    });
  };


  that.loadObjFromFile = function(file_input) {
    loadFromTextFile(file_input, function(result) {
           that.createBrain(new MNIObject(result));
         });
  };

  that.loadSpectrumFromUrl  = function(url) {
    var spectrum = [];
    //get the spectrum of colors
    loadFromUrl(url,false,function (data) {
        spectrum = new Spectrum(data)

        if(that.afterLoadSpectrum != null) {
          that.afterLoadSpectrum(spectrum);
        }
    });
    return spectrum;
  };


  that.loadSpectrumFromFile = function(file_input){
    loadFromTextFile(file_input,function (data) {
      var spectrum = new Spectrum(data);
      that.spectrum = spectrum;


      if(that.afterLoadSpectrum != null) {
        that.afterLoadSpectrum(spectrum);
      }
      if(that.data) {
        that.updateColors(that.data, that.rangeMin, that.rangeMax, that.spectrum);
      }
    });
  };
};

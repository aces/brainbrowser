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

// WARNING: PROBABLY DOESN'T WORK!
// BrainBrowser module for series data. Untested. Probably doesn't work.
// Haven't been able to find any documentation on what series data actually
// is.
BrainBrowser.modules.series = function(bb) {
  
 
  // Load a series of data files to be viewed with a slider. 
  bb.loadSeriesDataFromFile = function(file_input) {
    var numberFiles = file_input.files.length;
    var files = file_input.files;
    var reader;
    var i;
    
    bb.seriesData = new Array(numberFiles);
    bb.seriesData.numberFiles = numberFiles;
    
    for(i = 0; i < numberFiles; i++) {
      reader = new FileReader();
      reader.file = files[i];
      /*
      * Using a closure to keep the value of i around to put the 
      * data in an array in order. 
      */
      reader.onloadend = (function(file, num) {
        return function(e) {
          console.log(e.target.result.length);
          console.log(num);
          
          BrainBrowser.data(e.target.result, function(data) {
            bb.seriesData[num] = data;
            bb.seriesData[num].fileName = file.name; 
          });  
        };
      })(reader.file, i);
      
      reader.readAsText(files[i]);
    }
    bb.setupSeries();
  };

  //Setup for series data, creates a slider to switch between files. 
  bb.setupSeries = function() {
    var model_data = bb.model_data;
    var seriesData = bb.seriesData;
    var positionArray = bb.model_data.positionArray;
    var interpolatedData;
    
    $("<div id=\"series\">Series: </div>").appendTo("#surface_choice");
    var div = $("#series");
    $("<span id=\"series-value\">0</span>").appendTo(div);
    $("<div id=\"series-slider\" width=\"100px\" + height=\"10\"></div>")
      .slider({
        value: 0,
        min: 0,
        max: seriesData.numberFiles-1,         
        step: 0.1,
        slide: function(event, ui) {
          if (seriesData[0].fileName.match("mt.*")) {
            $("#age_series").html("Age: " + (ui.value*3+5).toFixed(1));
          
          } else if (seriesData[0].fileName.match("pval.*")) {
            $("#age_series").html("Age: " + (ui.value*1+10));
          }
        },
        stop: function(event, ui) {
          loading_div.show();
          $(div).children("#series-value").html(ui.value);
          
          if (ui.value -  Math.floor(ui.value) < 0.01) { //is it at an integer? then just return the array      
              model_data.data = seriesData[ui.value];
              updateSeries(model_data.data);                           
          } else { //interpolate
            //////////////////////////////////////////////////////////////////////
            //TODO: NOT SURE IF THIS PART WORKS WITH WEB WORKERS. NEED TEST DATA!
            //////////////////////////////////////////////////////////////////////
            interpolatedData = interpolateDataArray(seriesData[Math.floor(ui.value)], seriesData[Math.floor(ui.value)+1], ui.value -  Math.floor(ui.value));
            BrainBrowser.data(interpolatedData, updateSeries);
          }
        }
     }).appendTo(div);
  
  };
  
  function updateSeries(data) {
    if (data.values.length < positionArray.length/4) {
      console.log("Number of numbers in datafile lower than number of vertices Vertices" 
      + positionArray.length/3 + " data values:" 
      + data.values.length );
      return -1;
    }
    //bb.initRange(model_data.data.min, model_data.data.max);
    
    if (bb.afterLoadData != null) {
      bb.afterLoadData(data.rangeMin, data.rangeMax, data);
    }
    
    bb.updateColors(data, data.rangeMin, data.rangeMax, bb.spectrum, bb.flip, bb.clamped, { 
      afterUpdate: function () { loading_div.hide(); } 
    });
  }

    // Interpolate data 
  function interpolateDataArray(first, second, percentage) {
    console.log(first.values.length);
    var i;
    var count = first.values.length;  
    var new_array = new Array(count);
    console.log("Percentage: " + percentage);
    
    
    for (i = 0; i < count; i++) {
      new_array[i] = (first.values[i]*(100-percentage*100)+second.values[i]*(percentage*100))/100;            
    }
    console.log(new_array.length);
    return new_array;
  }
};
  


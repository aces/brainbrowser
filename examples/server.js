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
*/

/*
* Author: Tarek Sherif <tsherif@gmail.com> (http://tareksherif.ca/)
*/

var http = require('http');
var fs = require('fs');
var port = process.argv[2] || 5000;

http.createServer(function (req, res) {

  var path = "./" + (req.url.replace(/^\/+/, "") || "index.html");
  fs.exists(path, function(exists) {
    if (exists) {
      fs.readFile(path, function(err, content) {
        res.end(content);
      });
    } else {
      res.writeHead(404);
      res.end("File " + req.url + " not found.");
    }
  })
}).listen(port, function() {
  console.log("BrainBrowser example server started on port " + port + ".");
  console.log("Navigate to http://localhost:" + port + "/surface-viewer-demo.html to view the Surface Viewer demo.");
  console.log("Navigate to http://localhost:" + port + "/volume-viewer-demo.html to view the Volume Viewer demo.");  
});


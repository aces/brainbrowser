/*
* BrainBrowser: Web-based Neurological Visualization Tools
* (https://brainbrowser.cbrain.mcgill.ca)
*
* Copyright (C) 2011-2025
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
* Author: Natacha Beck
*
* Loads DICOM volume(s) for the volume viewer.
* Using the daikon library:
*   - https://github.com/rii-mango/Daikon
*   - https://github.com/rii-mango/Daikon/blob/master/LICENSE
*
* For details on the DICOM standard see:
*   - https://www.dicomstandard.org/current
*   - https://dicom.nema.org/medical/dicom/current/output/html/part03.html#sect_10.27.1
*/

(function() {
  "use strict";

  var VolumeViewer = BrainBrowser.VolumeViewer;

  VolumeViewer.volume_loaders.dicom = function(description, callback) {
    var error_message;

    if (description.dicom_url) {
      // First check if it's a directory
      // to list and load all DICOM files in it
      VolumeViewer.utils.isDirectory(description.dicom_url).then(function(isDir) {
        if (isDir) {
          VolumeViewer.utils.listFilesInDirectoryWithExtensions(description.dicom_url, [".dcm", ".dicom"]).then(function(files) {
            // dicom_data will store all images in the series
            var dicom_data   = new daikon.Series();

            var loadPromises = files.map(function(file) {
              var file_name  = file.split('/').pop();
              return fetch(description.dicom_url + '/' + file_name)
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => {
                  try {
                    var image = daikon.Series.parseImage(new DataView(arrayBuffer));
                    if (image && image.hasPixelData()) {
                      if (dicom_data.images.length === 0 || image.getSeriesId() === dicom_data.images[0].getSeriesId()) {
                        dicom_data.addImage(image);
                      }
                    }
                  } catch (error) {
                    console.error("Error processing DICOM file:", file_name, error);
                  }
                });
            });

            Promise.all(loadPromises).then(function() {
              // Perform checks on loaded images
              if (!dicom_data.images || dicom_data.images.length === 0) {
                error_message = "No valid DICOM images found in directory";

                BrainBrowser.events.triggerEvent("error", { message: error_message });
                throw new Error(error_message);
              }

              // Use daikon to build the series and set images
              dicom_data.buildSeries();
              const seriesList = dicom_data.series || [];
              if (seriesList.length > 0 && seriesList[0].images) {
                dicom_data.images = seriesList[0].images;
              }

              // Finally parse header and create volume
              VolumeViewer.utils.parseDicomHeader(dicom_data, function(header) {
                VolumeViewer.utils.createNormalizedDicomVolume(header, dicom_data, callback);
              });
            }).catch(function(error) {
              error_message = "Error processing DICOM files: " + error.message;

              BrainBrowser.events.triggerEvent("error", { message: error_message });
              throw new Error(error_message);
            });
          }).catch(function(error) {
            error_message = "Error listing directory: " + error.message;

            BrainBrowser.events.triggerEvent("error", { message: error_message });
            throw new Error(error_message);
          });
        } else {
          // Single DICOM file case
          fetch(description.dicom_url)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => {
              var dicom_data = new daikon.Series();
              var image      = daikon.Series.parseImage(new DataView(arrayBuffer));

              if (image && image.hasPixelData()) {
                // Use daikon to build the series and set images
                dicom_data.addImage(image);
                dicom_data.buildSeries();
                const seriesList = dicom_data.series || [];
                if (seriesList.length > 0 && seriesList[0].images) {
                  dicom_data.images = seriesList[0].images;
                }

                // Finally parse header and create volume
                VolumeViewer.utils.parseDicomHeader(dicom_data, function(header) {
                  VolumeViewer.utils.createNormalizedDicomVolume(header, dicom_data, callback);
                });
              } else {
                error_message = "Invalid DICOM file: " + description.dicom_url;

                BrainBrowser.events.triggerEvent("error", { message: error_message });
                throw new Error(error_message);
              }
            })
            .catch(function(error) {
              error_message = "Error loading DICOM file: " + error.message;

              BrainBrowser.events.triggerEvent("error", { message: error_message });
              throw new Error(error_message);
            });
        }
      }).catch(function(error) {
        error_message = "Error checking URL: " + error.message;

        BrainBrowser.events.triggerEvent("error", { message: error_message });
        throw new Error(error_message);
      });

    } else if (description.dicom_file) {
      const files = description.dicom_file instanceof FileList
        ? Array.from(description.dicom_file)
        : Array.isArray(description.dicom_file)
          ? description.dicom_file
          : [description.dicom_file];

      if (!files.length) {
        error_message = "No DICOM files provided";

        BrainBrowser.events.triggerEvent("error", { message: error_message });
        throw new Error(error_message);
      }

      var dicom_data   = new daikon.Series();
      var loadPromises = Array.from(files).map(function(file) {
        return new Promise(function(resolve) {
          // Create a temporary file input to simulate DOM input
          var tempFileInput = {
            files: [file],
            value: file.name || "fake.dcm"
          };

          BrainBrowser.loader.loadFromFile(tempFileInput, function(arrayBuffer) {
            try {
              var image = daikon.Series.parseImage(new DataView(arrayBuffer));
              if (image && image.hasPixelData()) {
                if (dicom_data.images.length === 0 ||
                    image.getSeriesId() === dicom_data.images[0].getSeriesId()) {
                  dicom_data.addImage(image);
                }
              }
            } catch (error) {
              error_message = "Error processing DICOM file: " + file.name + " - " + error.message;

              BrainBrowser.events.triggerEvent("error", { message: error_message });
              throw new Error(error_message);
            } finally {
              resolve();
            }
          }, { result_type: "arraybuffer" });
        });
      });

      Promise.all(loadPromises).then(function() {
        if (!dicom_data.images || dicom_data.images.length === 0) {
          error_message = "No valid DICOM images found in provided files";

          BrainBrowser.events.triggerEvent("error", { message: error_message });
          throw new Error(error_message);
        }
        // Use daikon to build the series and set images
        dicom_data.buildSeries();
        const seriesList = dicom_data.series || [];
        if (seriesList.length > 0 && seriesList[0].images) {
          dicom_data.images = seriesList[0].images;
        }

        // Finally parse header and create volume
        VolumeViewer.utils.parseDicomHeader(dicom_data, function(header) {
          VolumeViewer.utils.createNormalizedDicomVolume(header, dicom_data, callback);
        });
      }).catch(function(error) {
        error_message = "Error processing DICOM files: " + error.message;

        BrainBrowser.events.triggerEvent("error", { message: error_message });
        throw new Error(error_message);
      });

    } else if (description.dicom_source) {
      // Finally parse header and create volume
      VolumeViewer.utils.parseDicomHeader(description.dicom_source, function(header) {
        VolumeViewer.utils.createNormalizedDicomVolume(header, description.dicom_source, callback);
      });
    } else {
      error_message = "Invalid volume description.\n" +
        "Description must contain the property 'dicom_url' or 'dicom_file' or 'dicom_source'.";

      BrainBrowser.events.triggerEvent("error", { message: error_message });
      throw new Error(error_message);
    }
  };

  /**
    * Checks if the given URL is a directory.
    * @param {string} url - The URL to check.
    *
    * @returns {boolean}  - True if the URL is a directory, false otherwise.
    */
  VolumeViewer.utils.isDirectory = async function(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (!response.ok) {
        BrainBrowser.events.triggerEvent("error", { message: "Error checking if URL is a directory, status: " + response.status });
        throw new Error("Error checking if URL is a directory, status: " + response.status);
      }
      const contentType = response.headers.get('Content-Type');
      return contentType && contentType.includes('text/html');
    } catch (error) {
      BrainBrowser.events.triggerEvent("error", { message: "Error checking if URL is a directory: " + error.message });
      throw new Error("Error checking if URL is a directory: " + error.message);
    }
  }

  /**
    * List all files in a directory URL.
    * @param {string} url - The directory URL.
    * @param {Array<string>} extensions - Array of accepted extensions e.g: '.dcm', '.dicom' to filter.
    *
    * @returns {Promise<Array<string>>} - A promise that resolves to an array of filenames with the specified extensions.
    */
  VolumeViewer.utils.listFilesInDirectoryWithExtensions = async function(url, extensions) {
    const response = await fetch(url);
    if (!response.ok) {
      BrainBrowser.events.triggerEvent("error", { message: "Error listing files in directory, status: " + response.status });
      throw new Error("Error listing files in directory, status: " + response.status);
    }
    const text            = await response.text();
    // look for <a href="...">
    const matches         = [...text.matchAll(/href="([^"]+)"/g)];
    const filteredMatches = matches.filter(m => m[1].includes('.'));
    return filteredMatches.map(m => m[1]).filter(file => extensions.some(ext => file.endsWith(ext)));
  }

  /**
   * Parses the DICOM header from a DICOM series.
   * @param {Object} dicom_series - The DICOM series object from daikon.
   * @param {Function} callback - The callback function to call with the parsed header.
   *
   * @returns {void}
   */
  VolumeViewer.utils.parseDicomHeader = function(dicom_series, callback) {
    // Initialize header structure
    var header = {
      xspace: {},
      yspace: {},
      zspace: {}
    };

    if (!dicom_series || !dicom_series.images || dicom_series.images.length === 0) {
      var error_message = "Invalid DICOM series data";

      BrainBrowser.events.triggerEvent("error", { message: error_message });
      throw new Error(error_message);
    }

    // Extract the first image to get metadata
    var firstImage = dicom_series.images[0];

    // E.g: "XYZ--+"
    // Explanation:
    //   Rows:    X- (Right to Left)
    //   Columns: Y- (Anterior to Posterior)
    //   Slices:  Z+ (Inferior to Superior)
    var orientation             = firstImage.getOrientation()

    // An array of 6 values representing the direction cosines:
    // E.g: [Xx, Xy, Xz, Yx, Yy, Yz]
    var imageOrientationPatient = firstImage.getImageDirections();

    // Determine the correct axis order based on orientation
    header.order = VolumeViewer.utils.determineAxisOrder(orientation, imageOrientationPatient);

    // Fill in the header information
    VolumeViewer.utils.setHeaderSpace(header, firstImage, dicom_series);
    VolumeViewer.utils.setSpacing(header, firstImage, dicom_series);
    VolumeViewer.utils.setImagePositionStart(header, firstImage);
    VolumeViewer.utils.setDirectionCosines(header, firstImage);

    // Set datatype based on DICOM image
    var bitsAllocated       = firstImage.getBitsAllocated();
    var pixelRepresentation = firstImage.getPixelRepresentation();

    if (bitsAllocated === 8) {
      header.datatype = pixelRepresentation === 0 ? "uint8" : "int8";
    } else if (bitsAllocated === 16) {
      header.datatype = pixelRepresentation === 0 ? "uint16" : "int16";
    } else if (bitsAllocated === 32) {
      header.datatype = pixelRepresentation === 0 ? "uint32" : "int32";
    } else {
      header.datatype = "uint16"; // default
    }

    // Check for RGB images
    // Try to get the photometric interpretation or check if it's RGB
    var photometricInterpretation = firstImage.getPhotometricInterpretation ?
      firstImage.getPhotometricInterpretation() : null;

    if (photometricInterpretation === "RGB" ||
        (bitsAllocated === 24)              ||
        (firstImage.getDataType && firstImage.getDataType() === daikon.Image.BYTE_TYPE_RGB)) {
      header.datatype = "rgb8";
    }

    // Strides match how we lay out data: row-major within a slice.
    // X (columns) varies fastest, then Y (rows), then Z (slices).
    header.xspace.offset = 1;                                                       // X stride
    header.yspace.offset = header.xspace.space_length;                             // Y stride = width
    header.zspace.offset = header.xspace.space_length * header.yspace.space_length; // Z stride = width*height

    if (BrainBrowser.utils.isFunction(callback)) {
      callback(header);
    }
  }

  /**
   * Returns the axis order based on the orientation string if available,
   * or based on the direction cosines otherwise. Defaults to axial if neither is available.
   * @param {String} orientation - E.g: "XYZ--+"
   * @param {Array} imageOrientationPatient - An array of 6 values representing the direction cosines.
   *
   * @returns {Array} - The determined axis order.
   */
  VolumeViewer.utils.determineAxisOrder = function(orientation, imageOrientationPatient) {
    // Default to axial
    if (!orientation && (!imageOrientationPatient || imageOrientationPatient.length < 6)) {
      return ["xspace", "yspace", "zspace"];
    }

    if (orientation) {
      return VolumeViewer.utils.determineAxisOrderFromOrientation(orientation);
    } else {
      return VolumeViewer.utils.determineAxisOrderFromDirectionCosines(imageOrientationPatient);
    }
  }

  /**
   * Returns the axis order based on the orientation string.
   * @param {String} orientation - E.g: "XYZ--+"
   *
   * @returns {Array} - The determined axis order.
   */
  VolumeViewer.utils.determineAxisOrderFromOrientation = function(orientation) {
    // Default to axial
    if (!orientation || orientation.length < 6) {
      return ["xspace", "yspace", "zspace"];
    }

    // Determine view type based on slice progression axis
    // Extract the axis pattern (first 3 chars)
    var axisPattern = orientation.substring(0, 3); // e.g., "XYZ"
    var sliceAxis   = axisPattern.charAt(2);       // The 3rd character tells us slice direction
    switch (sliceAxis.toUpperCase()) {
      case 'Z':
        return ["xspace", "yspace", "zspace"];
      case 'Y':
        return ["xspace", "zspace", "yspace"];
      case 'X':
        return ["yspace", "zspace", "xspace"];
      default:
        return ["xspace", "yspace", "zspace"];
    }
  }

  /**
   * Returns the axis order based on the direction cosines.
   * @param {Array} imageOrientationPatient - An array of 6 values representing the direction cosines.
   *
   * @returns {Array} - The determined axis order.
   */
  VolumeViewer.utils.determineAxisOrderFromDirectionCosines = function(imageOrientationPatient) {

    // Analyze the direction cosines to determine slice orientation
    var rowCosines = [imageOrientationPatient[0], imageOrientationPatient[1], imageOrientationPatient[2]];
    var colCosines = [imageOrientationPatient[3], imageOrientationPatient[4], imageOrientationPatient[5]];

    // Calculate slice direction (cross product)
    var sliceCosines = [
      colCosines[1] * rowCosines[2] - colCosines[2] * rowCosines[1],
      colCosines[2] * rowCosines[0] - colCosines[0] * rowCosines[2],
      colCosines[0] * rowCosines[1] - colCosines[1] * rowCosines[0]
    ];

    // Find which axis (X, Y, Z) has the strongest component for slice direction
    var absSlice = sliceCosines.map(Math.abs);
    var maxIndex = absSlice.indexOf(Math.max(...absSlice));

    // 2 == Z, 1 == Y, 0 == X
    // Default to axial
    var spaces = ["xspace", "yspace", "zspace"];
    if (maxIndex === 1) {
      spaces = ["xspace", "zspace", "yspace"];
    } else if (maxIndex === 0) {
      spaces = ["yspace", "zspace", "xspace"];
    }

    return spaces;
  }

  /**
   * Returns axis direction reversals based on the orientation string and axis order.
   * @param {String} orientation - E.g: "XYZ--+"
   * @param {Array}  axisOrder - The determined axis order.
   *
   * @returns {Object} - An object with boolean flags for reverseX, reverseY, reverseZ.
   *                    E.g: { reverseX: false, reverseY: true, reverseZ: false }
   */
  VolumeViewer.utils.getAxisDirections = function(orientation, axisOrder) {
    var directions = {
      reverseX: false,
      reverseY: false,
      reverseZ: false
    };

    if (!orientation || orientation.length < 6 || !axisOrder || axisOrder.length < 3) {
      return directions;
    }

    var dirString = orientation.substring(3, 6);  // Get --+ part

    for (var i = 0; i < 3; i++) {
      var actualAxis = axisOrder[i];
      var isReversed = (dirString.charAt(i) === '-');

      // Map the direction to the correct anatomical axis
      if (actualAxis === "xspace") {
        directions.reverseX = isReversed;
      } else if (actualAxis === "yspace") {
        directions.reverseY = isReversed;
      } else if (actualAxis === "zspace") {
        directions.reverseZ = isReversed;
      }
    }

    return directions;
  }

  /**
   * Use the first image information to set header space attributes.
   * @param {Object} header - The volume header to populate.
   * @param {Object} firstImage - The first DICOM image in the series.
   * @param {Object} dicom_series - The DICOM series (daikon) containing all images.
   *
   * @returns {void}
   */
  VolumeViewer.utils.setHeaderSpace = function(header, firstImage, dicom_series) {
    var cols   = firstImage.getCols();
    var rows   = firstImage.getRows();
    var slices = dicom_series.images.length;

    // Assign dimensions based on acquisition orientation
    // [first_axis, second_axis, slice_axis]
    //
    // In DICOM:
    //   - cols   = width  of each image (varies along first in-plane axis)
    //   - rows   = height of each image (varies along second in-plane axis)
    //   - slices = number of images     (varies along slice progression axis)

    // Slice progression
    var sliceAxis = header.order[2];

    if (sliceAxis === "zspace") {
      // Axial acquisition: slices stack in Z direction
      header.xspace.space_length = cols;
      header.yspace.space_length = rows;
      header.zspace.space_length = slices;
    } else if (sliceAxis === "yspace") {
      // Coronal acquisition: slices stack in Y direction
      header.xspace.space_length = cols;
      header.yspace.space_length = slices;
      header.zspace.space_length = rows;
    } else if (sliceAxis === "xspace") {
      // Sagittal acquisition: slices stack in X direction
      header.xspace.space_length = slices;
      header.yspace.space_length = cols;
      header.zspace.space_length = rows;
    } else {
      // Fallback to default (axial)
      header.xspace.space_length = cols;
      header.yspace.space_length = rows;
      header.zspace.space_length = slices;
    }
  }

  /**
   * Compute the slice step size from the Image Position Patient (IPP) values
   * based on Papaya's approach.
   * @param {Object} dicom_series - The DICOM series (daikon) containing all images.
   *
   * @returns {number|null} - The computed slice step size, or null if it cannot be determined.
   */
  VolumeViewer.utils.computeSliceStepFromPositions = function(dicom_series) {
    var n = (dicom_series && dicom_series.images) ? dicom_series.images.length : 0;
    if (n < 2) return null;

    var image_orientation = dicom_series.images[0].getImageDirections();
    if (!image_orientation || image_orientation.length < 6) return null;

    var row = [image_orientation[0], image_orientation[1], image_orientation[2]];
    var col = [image_orientation[3], image_orientation[4], image_orientation[5]];

    // slice normal = row x col
    var normal = [
      row[1]*col[2] - row[2]*col[1],
      row[2]*col[0] - row[0]*col[2],
      row[0]*col[1] - row[1]*col[0]
    ];

    var steps = [];
    for (var i = 1; i < n; i++) {
      // Get two consecutive IPPs
      var ipp_0 = dicom_series.images[i-1].getImagePosition();
      var ipp_1 = dicom_series.images[i].getImagePosition();
      if (!ipp_0 || !ipp_1) continue;

      // project delta onto slice normal (absolute)
      var delta = [ipp_1[0]-ipp_0[0], ipp_1[1]-ipp_0[1], ipp_1[2]-ipp_0[2]];
      var projected_delta = Math.abs(delta[0]*normal[0] + delta[1]*normal[1] + delta[2]*normal[2]);
      if (projected_delta > 0) steps.push(projected_delta);
    }
    if (!steps.length) return null;

    // Return the median step to reduce impact of outliers
    steps.sort(function(a,b){ return a-b; });
    var median = steps[Math.floor(steps.length/2)];
    return median;
  }

  /**
   * Sets the step sizes for each axis.
   *
   * @param {Object} header - The volume header to populate.
   * @param {Object} firstImage - The first DICOM image in the series.
   * @param {Object} dicom_series - The DICOM series (daikon) containing all images.
   *
   * @returns {void}
   */
  VolumeViewer.utils.setSpacing = function(header, firstImage, dicom_series) {
    const pixelSpacing   = firstImage.getPixelSpacing()   || [1.0, 1.0]; // [row, col]
    const sliceThickness = firstImage.getSliceThickness() || 1.0;
    const ippStep        = VolumeViewer.utils.computeSliceStepFromPositions(dicom_series);

    // Use IPP-derived spacing if available, fall back to SpacingBetweenSlices, or to Thickness.
    const dicomGap       = (firstImage.getSliceGap && firstImage.getSliceGap()) || null;
    const sliceSpacing   = Math.abs(ippStep || dicomGap || sliceThickness);

    const row            = Math.abs(pixelSpacing[0]);
    const col            = Math.abs(pixelSpacing[1]);
    const slice          = sliceSpacing;

    const sliceAxis = header.order[2];
    if (sliceAxis === "zspace") {          // axial
      header.xspace.step = col;
      header.yspace.step = row;
      header.zspace.step = slice;
    } else if (sliceAxis === "yspace") {   // coronal
      header.xspace.step = col;
      header.yspace.step = slice;
      header.zspace.step = row;
    } else if (sliceAxis === "xspace") {   // sagittal
      header.xspace.step = slice;
      header.yspace.step = col;
      header.zspace.step = row;
    }
  }

  /**
   * Sets start positions of each axis based IPP of the first image.
   *
   * @param {Object} header - The volume header to populate.
   * @param {Object} firstImage - The first DICOM image in the series.
   *
   * @returns {void}
   */
  VolumeViewer.utils.setImagePositionStart = function(header, firstImage) {
    // Default to 0,0,0
    header.xspace.start = 0;
    header.yspace.start = 0;
    header.zspace.start = 0;

    var imagePosition = firstImage.getImagePosition();
    if (!(imagePosition && imagePosition.length >= 3))  { return; }

    // Assign positions based on the determined axis order
    var positions = [imagePosition[0], imagePosition[1], imagePosition[2]];
    for (var i = 0; i < 3; i++) {
      var spaceName           = header.order[i];
      header[spaceName].start = positions[i];
    }
  }

  /**
   * Direction cosines for each axis
   * @param {Object} header - The volume header to populate.
   * @param {Object} firstImage - The first DICOM image in the series.
   *
   * @returns {void}
   */
  VolumeViewer.utils.setDirectionCosines = function(header, firstImage) {
    // Get image orientation (direction cosines)
    var imageOrientationPatient = firstImage.getImageDirections();

    // Default to identity matrix
    header.xspace.direction_cosines = [1, 0, 0];
    header.yspace.direction_cosines = [0, 1, 0];
    header.zspace.direction_cosines = [0, 0, 1];

    if (!(imageOrientationPatient && imageOrientationPatient.length >= 6)) {
      return;
    }

    // DICOM standard: [row_x, row_y, row_z, col_x, col_y, col_z]
    var rowCosines = [imageOrientationPatient[0], imageOrientationPatient[1], imageOrientationPatient[2]];
    var colCosines = [imageOrientationPatient[3], imageOrientationPatient[4], imageOrientationPatient[5]];

    // Assign direction cosines based on the determined axis order
    // Standard DICOM:
    //     first 3 = rows,
    //     last  3 = columns
    var cosineArrays = [rowCosines, colCosines];

    // Map the first two axes (rows and columns) to their respective spaces
    for (var i = 0; i < 2; i++) {
      var spaceName = header.order[i];
      header[spaceName].direction_cosines = cosineArrays[i];
    }

    // Calculate slice direction cosines (3rd axis) using cross product
    var firstAxisCosines  = header[header.order[0]].direction_cosines;
    var secondAxisCosines = header[header.order[1]].direction_cosines;
    var sliceSpaceName    = header.order[2];

    header[sliceSpaceName].direction_cosines = [
      secondAxisCosines[1] * firstAxisCosines[2] - secondAxisCosines[2] * firstAxisCosines[1],
      secondAxisCosines[2] * firstAxisCosines[0] - secondAxisCosines[0] * firstAxisCosines[2],
      secondAxisCosines[0] * firstAxisCosines[1] - secondAxisCosines[1] * firstAxisCosines[0]
    ];

  }

  /**
   * Extract native data from the DICOM series.
   *
   * @param {Object} header - The volume header to populate.
   * @param {Object} dicom_series - The DICOM series (daikon) containing all images.
   *
   * @returns {TypedArray} - The extracted DICOM data.
   *
   */
  VolumeViewer.utils.extractNativeDicomData = function(header, dicom_series) {
    var image = dicom_series.images[0];

    var totalVoxels = header.xspace.space_length *
                      header.yspace.space_length *
                      header.zspace.space_length;

    // Determine the appropriate typed array based on datatype
    var native_data;
    switch (header.datatype) {
      case 'int8':
        native_data = new Int8Array(totalVoxels);
        break;
      case 'uint8':
        native_data = new Uint8Array(totalVoxels);
        break;
      case 'int16':
        native_data = new Int16Array(totalVoxels);
        break;
      case 'uint16':
        native_data = new Uint16Array(totalVoxels);
        break;
      case 'int32':
        native_data = new Int32Array(totalVoxels);
        break;
      case 'uint32':
      case 'rgb8':
        native_data = new Uint32Array(totalVoxels);
        break;
      default:
        var error_message = "Unsupported DICOM data type: " + header.datatype;

        BrainBrowser.events.triggerEvent("error", { message: error_message });
        throw new Error(error_message);
    }

    return native_data;
  }

  /**
   * Create DICOM data by copying pixel data from each slice into the volume
   * according to the acquisition orientation.
   * @param {Object} header - The volume header to populate.
   * @param {Object} dicom_series - The DICOM series (daikon) containing all images.
   *
   * @returns {TypedArray} - The created DICOM data.
   */
  VolumeViewer.utils.createDicomData = function(header, dicom_series) {
    var native_data = VolumeViewer.utils.extractNativeDicomData(header, dicom_series);

    // Copy pixel data from each DICOM slice into the volume
    // Get the actual in-plane dimensions (first two axes in the order)
    var sliceAxisName    = header.order[2]; // Get the actual slice axis
    var numSlices        = header[sliceAxisName].space_length;

    // Get orientation directions with proper axis mapping
    var firstImage  = dicom_series.images[0];
    var orientation = firstImage.getOrientation();
    var directions  = VolumeViewer.utils.getAxisDirections(orientation, header.order);

    for (var sliceIndex = 0; sliceIndex < numSlices; sliceIndex++) {
      var actualSliceIndex = directions.reverseZ ? (numSlices - 1 - sliceIndex) : sliceIndex;
      var image            = dicom_series.images[actualSliceIndex];
      var pixelData        = image.getPixelData().value.buffer;

      if (!pixelData) {
        continue;
      }

      var sliceData;
      if (pixelData instanceof ArrayBuffer) {
        // Create appropriate view based on datatype
        switch (header.datatype) {
          case 'int8':
            sliceData = new Int8Array(pixelData);
            break;
          case 'uint8':
          case 'rgb8':
            sliceData = new Uint8Array(pixelData);
            break;
          case 'int16':
            sliceData = new Int16Array(pixelData);
            break;
          case 'uint16':
            sliceData = new Uint16Array(pixelData);
            break;
          case 'int32':
            sliceData = new Int32Array(pixelData);
            break;
          case 'uint32':
            sliceData = new Uint32Array(pixelData);
            break;
          default:
            sliceData = new Uint16Array(pixelData); // fallback
        }

        // Map DICOM slice data to anatomical volume based on acquisition orientation
        var cols = image.getCols();
        var rows = image.getRows();

        for (var row = 0; row < rows; row++) {
          for (var col = 0; col < cols; col++) {
            // Source layout is row‑major within the slice.
            var sourceIndex = row * cols + col;

            var x_idx = directions.reverseX ? (cols - 1 - col) : col;   // X = columns
            var y_idx = directions.reverseY ? (rows - 1 - row) : row;   // Y = rows
            var z_idx = actualSliceIndex;                               // Z = slice index (already reversed if needed)

            var targetIndex =
              x_idx * header.xspace.offset +
              y_idx * header.yspace.offset +
              z_idx * header.zspace.offset;

            native_data[targetIndex] = sliceData[sourceIndex];
          }
        }
      } else if (Array.isArray(pixelData)) {
        sliceData = pixelData;
      } else {
        continue;
      }
    }

    VolumeViewer.utils.scanDataRange(native_data, header);
    return native_data;
  }

  /**
   * Create the volume, save origin and transform as well as intensity range.
   * @param {Object} header - The volume header to populate.
   * @param {Object} dicom_series - The DICOM series (daikon) containing all images.
   * @param {Function} callback - The callback function to call with the created volume.
   *
   * @returns {void}
   */
  VolumeViewer.utils.createDicomVolume = function(header, dicom_series, callback) {
    var volume = VolumeViewer.createVolume(header, VolumeViewer.utils.createDicomData(header, dicom_series));

    volume.type = "dicom";
    volume.saveOriginAndTransform(header);

    volume.intensity_min = volume.header.voxel_min;
    volume.intensity_max = volume.header.voxel_max;

    if (BrainBrowser.utils.isFunction(callback)) {
      callback(volume);
    }
  }

  /**
   * Normalize volume coordinates to a standard orientation:
   * @param {Object} volume - The volume to normalize.
   *
   * @returns {void}
   */
  VolumeViewer.utils.normalizeVolumeCoordinates = function(volume) {
    var header = volume.header;

    // Identical origins for all volumes (center at 0,0,0)
    // Useful for overlays
    var centerX = (header.xspace.space_length - 1) * Math.abs(header.xspace.step) / 2;
    var centerY = (header.yspace.space_length - 1) * Math.abs(header.yspace.step) / 2;
    var centerZ = (header.zspace.space_length - 1) * Math.abs(header.zspace.step) / 2;

    header.xspace.start = -centerX;
    header.yspace.start = -centerY;
    header.zspace.start = -centerZ;

    // Removes rotations/flips
    header.xspace.direction_cosines = [1, 0, 0];
    header.yspace.direction_cosines = [0, 1, 0];
    header.zspace.direction_cosines = [0, 0, 1];

    // Removes orientation-dependent flipping
    header.xspace.step = Math.abs(header.xspace.step);
    header.yspace.step = Math.abs(header.yspace.step);
    header.zspace.step = Math.abs(header.zspace.step);

    // Rebuild the volume's transform with normalized coordinates
    volume.saveOriginAndTransform(header);
  }

  /**
   * Create a normalized DICOM volume.
   * @param {Object} header - The volume header to populate.
   * @param {Object} dicom_series - The DICOM series (daikon) containing all images.
   * @param {Function} callback - The callback function once the volume is created.
   *
   * @returns {void}
   */
  VolumeViewer.utils.createNormalizedDicomVolume = function(header, dicom_series, callback) {
    VolumeViewer.utils.createDicomVolume(header, dicom_series, function(volume) {
      VolumeViewer.utils.normalizeVolumeCoordinates(volume);

      if (BrainBrowser.utils.isFunction(callback)) {
        callback(volume);
      }
    });
  }

}());


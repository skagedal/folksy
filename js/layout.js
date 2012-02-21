//
//   This file is part of Folksy, a framework for educational games.
//
//   Folksy is free software: you can redistribute it and/or modify
//   it under the terms of the GNU General Public License as published by
//   the Free Software Foundation, either version 3 of the License, or
//   (at your option) any later version.
//
//   Folksy is distributed in the hope that it will be useful,
//   but WITHOUT ANY WARRANTY; without even the implied warranty of
//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//   GNU General Public License for more details.
//
//   You should have received a copy of the GNU General Public License
//   along with Folksy.  If not, see <http://www.gnu.org/licenses/>.
//

"use strict";

// Requirements: only util.js

/** @namespace Layout functions. */

var layout = (function () {

    // Data types

    function Box(x, y, width, height, data) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.data = data;
    }

    Box.prototype.getWidth = function () { return this.width;  };
    Box.prototype.getHeight = function () { return this.height; };
    Box.prototype.getLeft = function () { return this.x; };
    Box.prototype.getTop = function () { return this.y; };
    Box.prototype.getRight = function () { return this.x + this.width; };
    Box.prototype.getBottom = function () { return this.y + this.height; };
    Box.prototype.getData = function () { return this.data; };

    function PlaceableBox(width, height, data) { 
	Box.call(this, 0, 0, width, height, data);
	this.origWidth = width;
	this.origHeight = height;
    }

    PlaceableBox.prototype = new Box();
    PlaceableBox.prototype.constructor = PlaceableBox;
    PlaceableBox.prototype.getOrigWidth = function () { 
	return this.origWidth; };
    PlaceableBox.prototype.getOrigHeight = function () { 
	return this.origHeight; };
    PlaceableBox.prototype.place = function (x, y, width, height) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
    };

    // Layout functions

    function heavyFirstCompare(a, b) {
	return b.weight - a.weight;
    }

    function insertIntoSorted(arr, obj, compare) {
	// `arr` is a sorted array, as if arr.sort(compare) was executed.
	// `obj` is an object we want inserted into the right place. 
	for (var i = 0; i < arr.length; i++) {
	    if (compare(obj, arr[i]) <= 0) {
		arr.splice(i, 0, obj);
		return;
	    }
	}
	// obj was "greater" than all others; Insert at the end. 
	arr.push(obj);
    }

    // We wrap each object in another object where we can keep calculations
    function wrapObject(obj) { 
	return {
	    realObject: obj,
	    weight: obj.getWidth() / obj.getHeight()
	};
    }

    function objToString(obj) {
	return String(obj.weight);
    }

    function binToString(bin) {
	return "[" + bin.map(objToString).join(", ") + "]";
    }

    function binsToString(bins) {
	return "[" + bins.map(binToString).join(", ") + "]";
    }

    function layoutRows(box, sortedObjects, padding, n_rows) {
	var boxHeight = box.getHeight();
	var boxWidth = box.getWidth();
	
	console.log("LET'S TRY this with %d rows...", n_rows);
	// Try a layout with 'n_rows' rows.
	
	function createBin() {
	    var b = [];
	    b.weight = 0;
	    return b;
	}
	function updateBin(b) {
	    b.weight = 0;
	    for (var i = 0; i < b.length; i++) {
		b.weight += b[i].weight;
	    }
	}
	// Create a bunch of bins where we put the objects.
	// The list is kept sorted from heaviest to lightest.
	var bins = [];
	while (bins.push(createBin()) < n_rows);

	// Greedy algorithm: put objects in a bin with most available
	// space.
	// TODO: Doesn't take the padding into account. Need to do
	// this based on approximation of rowHeight.

	for (var i = 0; i < sortedObjects.length; i++) {
	    // Put object in the last (lightest) bin.
	    var bin = bins.pop();
	    bin.push(sortedObjects[i]);
	    updateBin(bin);
	    // Reinsert bin.
	    insertIntoSorted(bins, bin, heavyFirstCompare);
	}
	// (Do we now have empty bins? If so, there is silliness in the algorithm.)
	console.log("Bin distribution: ", binsToString(bins));
	
	// Calculate space requirements. 

	var offsetY = padding;
	var emptySpace = offsetY * boxWidth;
	for (row = 0; row < n_rows; row++) {
	    var offsetX = padding;
	    var rowsLeft = n_rows - row; 
	    var heightLeft = boxHeight - offsetY;
	    var rowHeight = heightLeft / rowsLeft - padding;
	    var bin = bins[row];
	    var nItems = bin.length;
	    var xPaddingTotal = nItems * padding;
	    var widthItemsTotal = bin.weight * rowHeight;
	    
	    if (offsetX + widthItemsTotal + xPaddingTotal > boxWidth) {
		widthItemsTotal = boxWidth - xPaddingTotal - offsetX;
		rowHeight = widthItemsTotal / bin.weight;
	    }
	    var emptyX = boxWidth - widthItemsTotal;
	    
	    emptySpace += emptyX * rowHeight + padding * boxWidth;
	    offsetY += rowHeight + padding;
	    bin.rowHeight = rowHeight; // saved for when the solution
				       // (if picked) is implemented
	}
	emptySpace += (boxHeight - offsetY) * (boxWidth);

	return {bins:  bins, emptySpace: emptySpace};
    }

    /**
     * Lay out rectangular objects nicely in a rectangular box. Items may be
     * scaled. This implementation lays out the items in rows.
     * @param {Object} box		The bounding box to place objects in. 
     *					Has width and height.
     * @param {Object[]} objects	Objects to place. Have width, height and 
     *					place function.
     * @param {Object} params	User settable parameters.
     * <dl>
     * 	 <dt>padding:</dt>	<dd>Put at least this amount of pixels between each
     *				item. Defaults to 10.</dd>
     *	 <dt>h_align:</dt>	<dd>Horizontal alignment. "left", "right", "center" 
     *				or "justify". Defaults to "center".</dd>
     *	 <dt>v_align:</dt>	<dd>Vertical alignment. "left", "right", "center" 
     *				or "justify". Defaults to "center".</dd>
     *	 <dt>shuffle:</dt>	<dd>If true, shuffle items within rows and shuffle 
     *				the rows. Defaults to true.</dd>
     *	 <dt>equal_height:</dt>	<dd>If true, force all rows to be as high as the 
     *				lowest one. Defaults to true.</dd>
     * </dl>
     */
    function layoutObjects(box, objects, params) 
    {
	params = util.mergeObjects(params, {
	    // Defaults
	    padding:		10,
	    h_align:		"center",
	    v_align:		"center",
	    shuffle:		true,
	    equal_heights:	true
	});

	var padding = params["padding"];
	var numRows;
	var wrappedObjects = objects.map(wrapObject);
	
	wrappedObjects.sort(heavyFirstCompare);
	
	bestSolution = {emptySpace: Number.POSITIVE_INFINITY};
	
	for (numRows = 1; numRows <= wrappedObjects.length; numRows++) {
	    solution = layoutRows(box, wrappedObjects, padding, numRows);
	    // When all things are equal, we prefer a smaller number
	    // of rows (i.e., horizontal layout). Since these are
	    // tried first, a strict less-than is good here. Maybe we
	    // should even allow for some calculating error.
	    if (solution.emptySpace < bestSolution.emptySpace)
		bestSolution = solution;
	}

	// console.assert(bestSolution.bins);
	if (!bestSolution.bins) {
	    console.log("There was no solution.");
	    return;
	}
	// Implement bestSolution. FIXME: shuffle, alignment

	var realOccupiedSpace = 0;
	
	numRows = bestSolution.bins.length;
	var offsetY = padding;
	for (row = 0; row < numRows; row++) {
	    var offsetX = padding;
	    var bin = bestSolution.bins[row];
	    for (var i = 0; i < bin.length; i++) {
		var obj = bin[i];
		var width = bin.rowHeight * obj.weight;
		obj.realObject.place(offsetX, offsetY, width, bin.rowHeight);
		offsetX += width + padding; 
		realOccupiedSpace += width * bin.rowHeight;
	    }
	    offsetY += bin.rowHeight + padding;
	}
	
	console.log("Real occupied space: ", realOccupiedSpace);
	var totSpace = box.getWidth() * box.getHeight();
	console.log("Real empty space: ", totSpace - realOccupiedSpace);
	// Should be used for an assert
    }

    return {
	Box: Box,
	PlaceableBox: PlaceableBox,
	layoutObjects: layoutObjects
    };
    
})();
// window['layout'] = layout;


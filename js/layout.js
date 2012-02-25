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
	if (!util.isNumber(x) ||
	    !util.isNumber(y) ||
	    !util.isNumber(width) ||
	    !util.isNumber(height)) {
	    throw new TypeError("dimensions for box should be numbers");
	}
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
	if (!util.isNumber(width) ||
	    !util.isNumber(height)) {
	    throw new TypeError("dimensions for PlaceableBox " +
				"should be numbers");
	}
	Box.call(this, 0, 0, width, height, data);
	this.origWidth = width;
	this.origHeight = height;
    }

    PlaceableBox.prototype = new Box(0, 0, 0, 0);
    PlaceableBox.prototype.constructor = PlaceableBox;
    PlaceableBox.prototype.getOrigWidth = function () { 
	return this.origWidth; 	
    };
    PlaceableBox.prototype.getOrigHeight = function () { 
	return this.origHeight; 
    };
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

    function Row() {
        this.children = [];
        this.height = null;
        this.weight = 0;
    }
   
    Row.prototype.recalc = function () {
	this.weight = util.sum(util.pluck(this.children, 'weight'));
    }
    Row.prototype.addChild = function (child) {
        this.children.push(child);
        this.recalc();
    }
    Row.prototype.numChildren = function () {
        return this.children.length;
    }
    Row.prototype.getChildrenWidth = function () {
	this.recalc();
        // should assert that height is set...
        return this.weight * this.height;
    }
    Row.prototype.shuffleChildren = function () {
        util.shuffleInPlace(this.children);
    }

    function objToString(obj) {
	return String(obj.weight);
    }

    Row.prototype.toStr = function () {
	return "[" + this.children.map(objToString).join(", ") + "]";
    }

    function rowsToString(rows) {
	return "[" + 
	    rows.map(function (row) { return row.toStr; }).join(", ") + 
	    "]";
    }

    // Get the sum of rows' heights (previously calculated)
    function sumRowHeights(rows) {
        return util.sum(util.pluck(rows, 'height'));
    }

    function calculateRowHeights(rows, boxWidth, boxHeight,  
				 padding, equalHeights) {
	var offsetY = padding;
        var rowIndex;

	for (rowIndex = 0; rowIndex < rows.length; rowIndex++) {
	    var row = rows[rowIndex];
	    var offsetX = padding;
	    var rowsLeft = rows.length - rowIndex; 
	    var heightLeft = boxHeight - offsetY;
	    row.height = heightLeft / rowsLeft - padding;
	    var xPaddingTotal = row.children.length * padding;
	    var widthItemsTotal = row.weight * row.height;
	    
	    if (offsetX + widthItemsTotal + xPaddingTotal > boxWidth) {
		widthItemsTotal = boxWidth - xPaddingTotal - offsetX;
		row.height = widthItemsTotal / row.weight;
	    }

	    offsetY += row.height + padding;
	}

        if (equalHeights) {
            var smallestRowHeight = util.min(util.pluck(rows, 'height'));
            rows.forEach(function (row) {
                row.height = smallestRowHeight;
            });
        }
    }

    function calculateEmptySpace(rows, boxWidth, boxHeight, padding) {
        var offsetY = padding;
	var emptySpace = offsetY * boxWidth;
        for (var rowIndex = 0; rowIndex < rows.length; rowIndex++) {
            var row = rows[rowIndex];
            var widthItems = row.weight * row.height;
	    var emptyX = boxWidth - widthItems;
	    
	    emptySpace += emptyX * row.height + padding * boxWidth;
	    offsetY += row.height + padding;
        }
        emptySpace += (boxHeight - offsetY) * (boxWidth);
        return emptySpace;
    }


    // Try a layout with 'n_rows' rows.
    function layoutRows(box, sortedObjects, padding, equalHeights, n_rows) {
	var boxHeight = box.getHeight();
	var boxWidth = box.getWidth();
	
	// Create a bunch of rows where we put the objects.
	// The list is kept sorted from heaviest to lightest.
	var rows = [];
	while (rows.push(new Row()) < n_rows);

	// Greedy algorithm: put objects in a row with most available
	// space.
	// TODO: Doesn't take the padding into account. Need to do
	// this based on approximation of rowHeight.

	for (var i = 0; i < sortedObjects.length; i++) {
	    // Put object in the last (lightest) row.
	    var row = rows.pop();
	    row.addChild(sortedObjects[i]);
	
	    // Reinsert row.
	    insertIntoSorted(rows, row, heavyFirstCompare);
	}
	// (Do we now have empty rows? If so, there is silliness in
	// the algorithm.)
	console.log("Row distribution: ", rowsToString(rows));
	
        // Calculate row heights
        calculateRowHeights(rows, boxWidth, boxHeight, padding, equalHeights);

        var emptySpace = calculateEmptySpace(rows, boxWidth, boxHeight, 
					     padding);

	return {rows: rows, emptySpace: emptySpace};
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
     * 	 <dt>padding:</dt>	
     *     <dd>Put at least this amount of pixels between each
     *	       item. Defaults to 10.</dd>
     *	 <dt>h_align:</dt>	
     *     <dd>Horizontal alignment. "left", "right", "center" 
     *	       or "justify". Defaults to "center".</dd>
     *	 <dt>v_align:</dt>	
     *     <dd>Vertical alignment. "left", "right", "center" 
     *	       or "justify". Defaults to "center".</dd>
     *	 <dt>shuffle:</dt>	
     *     <dd>If true, shuffle items within rows and shuffle 
     *	       the rows. Defaults to true.</dd>
     *	 <dt>equal_height:</dt>	
     *     <dd>If true, force all rows to be as high as the 
     *	       lowest one. Defaults to true.</dd>
     * </dl>
     */
    function layoutObjects(box, objects, params) 
    {
	var numRows;
	var wrappedObjects;
	var bestSolution;

	params = util.mergeObjects(params, {
	    // Defaults
	    padding:		10,
	    h_align:		"center",
	    v_align:		"center",
	    shuffle:		true,
	    equal_heights:	true
	});

	// Wrap all objects to keep calculations
	wrappedObjects = objects.map(wrapObject);
	wrappedObjects.sort(heavyFirstCompare);
	
	bestSolution = {emptySpace: Number.POSITIVE_INFINITY};

	for (numRows = 1; numRows <= wrappedObjects.length; numRows++) {
	    var solution = layoutRows(box, wrappedObjects, 
				      params.padding, 
				      params.equal_heights, 
				      numRows);
	    // When all things are equal, we prefer a smaller number
	    // of rows (i.e., horizontal layout). Since these are
	    // tried first, a strict less-than is good here. Maybe we
	    // should even allow for some calculating error.
	    if (solution.emptySpace < bestSolution.emptySpace)
		bestSolution = solution;
	}

	if (!bestSolution.rows) {
	    console.log("There was no solution.");
	    return;
	}
	// Implement bestSolution. 

	var realOccupiedSpace = 0;
  
	var rows = bestSolution.rows;
        if (params.shuffle) {
            util.shuffleInPlace(rows);
            rows.forEach(function (row) {
                row.shuffleChildren();
            });
        }

	numRows = rows.length;
	var offsetY = box.getTop() + params.padding;
        var extraY = box.getHeight() - sumRowHeights(rows);
        if (params.v_align == 'bottom')
            offsetY += extraY;
        else if (params.v_align == 'center' ||
                 (params.v_align == 'justify' && numRows == 1))
	    offsetY += extraY / 2;
        var padY = params.padding;
        if (params.v_align == 'justify') 
            padY += extraY / (numRows - 1);
        
	for (var rowIndex = 0; rowIndex < numRows; rowIndex++) {
	    var offsetX = box.getLeft() + params.padding;
	    var row = rows[rowIndex];
            var numChildren = row.numChildren();
            var extraHSpace = box.getWidth() - 
		(row.getChildrenWidth() + numChildren * params.padding);
            if (params.h_align == 'right')
                offsetX += extraHSpace;
            else if (params.h_align == 'center' ||
                     (params.h_align == 'justify' && numChildren == 1))
                offsetX += extraHSpace / 2;

            var padX = params.padding;
            if (params.h_align == 'justify')
                padX += extraHSpace / (numChildren - 1);

	    for (var i = 0; i < numChildren; i++) {
		var obj = row.children[i];
		var width = row.height * obj.weight;
		obj.realObject.place(offsetX, offsetY, width, row.height);
		offsetX += width + padX; 
  
		realOccupiedSpace += width * row.height;
	    }
	    offsetY += row.height + padY;
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


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

// Requirements: only util.js

/*
 * layout (box, items, options).
 *
 * You get a box, a bunch of items and (optionally) some options. 
 * The box, and each of the items, have a width and a height, accessible with
 * .getWidth()/.getHeight(). 
 * Your mission, should you choose to accept it, is to put all the items 
 * nicely in the box. You may even scale them. 
 * Each item is placed with item.place(top, left, width, height). 
 * 
 * This layout engine should handle the following options:
 *   padding:       Put at least this amount of pixels between each item. Defaults to 10.
 *   h_align:       horizontal alignment. "left", "right", "center" or "justify". Defaults to "center".
 *   v_align:       vertical alignment. "left", "right", "center" or "justify". Defaults to "center".
 *   shuffle:       If true, shuffle items within rows and shuffle the rows. Defaults to true.
 *   equal_height:  If true, force all rows to be as high as the lowest one. Defaults to true. 
 *
 */


//
// LAYOUT 
//

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

	// Greedy algorithm: put objects in a bin with most available space
	// TODO: Doesn't take the padding into account. Need to do this based on approximation of rowHeight.
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
		bin.rowHeight = rowHeight; // saved for when the solution (if picked) is implemented
	}
	emptySpace += (boxHeight - offsetY) * (boxWidth);

	return {bins:  bins, emptySpace: emptySpace};
}

function layout(box, objects, userOptions) 
{
	options = {
		padding:	10,
		h_align:	"center",
		v_align:	"center",
		shuffle:	true,
		equal_heights:	true
	};
	for (key in userOptions) {
		if (userOptions.hasOwnProperty(key)) {
			options[key] = userOptions[key];
		}
	}
	
	if ("padding" in options)
		padding = options["padding"];
	else
		padding = 0;
	
	var numRows;
	var wrappedObjects = objects.map(wrapObject);

	wrappedObjects.sort(heavyFirstCompare);

	bestSolution = {emptySpace: Number.POSITIVE_INFINITY};

	for (numRows = 1; numRows <= wrappedObjects.length; numRows++) {
		solution = layoutRows(box, wrappedObjects, padding, numRows);
		// When all things are equal, we prefer a smaller number of rows (i.e., horizontal layout)
		// Since these are tried first, a strict less-than is good here. Maybe we should even
		// allow for some calculating error. 
		if (solution.emptySpace < bestSolution.emptySpace)
			bestSolution = solution;
	}

	// console.assert(bestSolution.bins);
	if (!bestSolution.bins) {
		console.log("There was no solution.");
		return;
	}
	// Implement bestSolution. FIXME: randomize. center (user settable alignment?)

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

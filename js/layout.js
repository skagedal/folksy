/*
 * layout (box, items, padding).
 *
 * You get a box, a bunch of items and a padding value. 
 * The box, and each of the items, have a width and a height, accessible with
 * .getWidth()/.getHeight(). 
 * Your mission, should you choose to accept it, is to put all the items 
 * nicely in the box. You may even scale them. There should be at least
 * `padding` pixels between each item. 
 * Place the items with item.place(top, left, width, height). 
 *
 */


// COMPATIBILITY CODE

// From  https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/map
// (removed production steps comments and rename some variables)
// Reference: http://es5.github.com/#x15.4.4.19
if (!Array.prototype.map) {
	Array.prototype.map = function(callback, thisArg) {
		var T, A, k;

		if (this == null) {
			throw new TypeError(" this is null or not defined");
		}

		var obj = Object(this);
		var len = obj.length >>> 0;

		// See: http://es5.github.com/#x9.11
		if ({}.toString.call(callback) != "[object Function]") {
			throw new TypeError(callback + " is not a function");
		}

		if (thisArg) {
			T = thisArg;
		}

		A = new Array(len);
		k = 0;

		while(k < len) {

			var kValue, mappedValue;

			if (k in obj) {
				kValue = obj[k];
				mappedValue = callback.call(T, kValue, k, obj);
				A[k] = mappedValue;
			}
			k++;
		}

		return A;
	};      
}

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

	// Create a bunch of bins where we put the objects.
	// The list is kept sorted from heaviest to lightest.
	function createBin() {
		var b = [];
		b.weight = 0;
		return b;
	}
	function updateBin(b) {
		b.weight = 0;
		for (var i = 0; i < b.length; i++) {
			console.log("Weight of ith item: ", b[i].weight);
			b.weight += b[i].weight;
		}
	}
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

		console.log("offset: ", offsetX, offsetY);
		console.log("rowsLeft: ", rowsLeft);
		console.log("heightLeft: ", heightLeft);
		console.log("rowHeight: ", rowHeight);
		console.log("nItems: ", nItems);
		console.log("xPaddingTotal: ", xPaddingTotal);
		console.log("bin.weight: ", bin.weight);
		console.log("widthItemsTotal: ", widthItemsTotal);

		if (offsetX + widthItemsTotal + xPaddingTotal > boxWidth) {
			widthItemsTotal = boxWidth - xPaddingTotal - offsetX;
			rowHeight = widthItemsTotal / bin.weight;
		}
		var emptyX = boxWidth - widthItemsTotal;
		console.log("emptyX: ", emptyX);

		emptySpace += emptyX * rowHeight + padding * boxWidth;
		offsetY += rowHeight + padding;
		bin.rowHeight = rowHeight; // saved for when the solution (if picked) is implemented
	}
	emptySpace += (boxHeight - offsetY) * (boxWidth);

	console.log("...EMPTY SPACE: ", emptySpace);

	return {bins:  bins, emptySpace: emptySpace};
}

function layout(box, objects, padding) 
{
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

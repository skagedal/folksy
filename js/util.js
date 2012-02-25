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
//   The functions isObject, isFunction, isString, isNumber, isNaN,
//   isBoolean, isRegExp, isNull, isUndefined is from the Underscore
//   library.
//     (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore is freely distributable under the MIT license.

"use strict";

/**
 * @namespace Utility functions. "Pure Javascript" , should be ignorant of the
 * DOM.
 */

var util = (function () {

    // From http://stackoverflow.com/questions/962802/is-it-correct-to-use-javascript-array-sort-method-for-shuffling
    function shuffleInPlace(array) {
	// Shuffle an array in-place (i.e., mutate the array).
	var tmp, current, top = array.length;      
	if(top) {
	    while(--top) {
		current = Math.floor(Math.random() * (top + 1));         
		tmp = array[current];         
		array[current] = array[top];         
		array[top] = tmp;     
	    }    
	}  
	return array; 
    } 

    /**
     * Pick `n` random elements from `array` using a more
     * efficient method than shuffling the whole array and taking
     * out the first `n` elements; it operates in time
     * proportional to `n` rather than the length of the whole
     * array.
     *
     * The algorithm mutates the input array while working, but
     * restores everything before returning.
     */
    function pickRandom (array, n) {
	n = Math.max(0, Math.min(array.length, n));

	return (function pickR(array, n, length) {
	    var i, picked, rest, hasIndex;

	    if (n === 0) {
		return [];
	    }

	    i = Math.floor(Math.random() * length);
	    // This is needed for restoration of dense arrays
	    hasIndex = array.hasOwnProperty(i);	
	    picked = array[i];
	    array[i] = array[length - 1];
	    rest = pickR(array, n - 1, length - 1);
	    // Restore array
	    if (hasIndex) {
		array[i] = picked;
	    } else {
		delete array[i];
	    }
	    rest.push(picked);
	    return rest;
	}) (array, n, array.length);
    }

    // Convenience function.
    function pickOneRandom(array) {
	return pickRandom(array, 1)[0];
    }

    function shuffle(array) {
	return pickRandom(array, array.length);
    }

    function pickRandomWeighted(coll, getWeight, n) {
	var total = 0;
	var subTotals = [];
	var objs;

	coll.each(function (obj) {
	    total += getWeight(obj);
	    subTotals.push({wtot: total, obj: obj});
	});
  
	function popOne (subTotals) {
	    var total = subTotals[subTotals.length - 1].wtot;
	    var rand = Math.random() * total;
	    var foundObj = null, foundIndex, foundWeight;

	    for (var i = 0; i < subTotals.length; i++) {
		if (foundObj === null) {
		    if (rand < subTotals[i].wtot) {
			foundObj = subTotals[i].obj;
			foundWeight = getWeight(foundObj);
			foundIndex = i;
		    }
		} else {
		    subTotals[i].wtot -= foundWeight;
		}
	    }
	    // console.assert(foundObj != null);
	    // should I sprinkle asserts in code or thoroughly unit test?
	    subTotals.splice(foundIndex, 1); // RIGHT?

	    return foundObj;
	}
  
	if (n == null)
	    return popOne(subTotals);
  
	objs = [];
	for (var i = 0; i < n; i++)
	    objs.push(popOne(subTotals)); 

	return objs;
    }


    function equalityChecker(a) {
	return function (b) {
	    return (a === b); 
	}
    }

    function inequalityChecker(a) {
	return function (b) {
	    return (a !== b); 
	}
    }

    function sum(array) {
	return array.reduce(function (a, b) {
	    return a + b;
	}, 0);

    }

    function min(array) {
	if (array.length < 1)
	    throw new TypeError("zero-length array");
	return Math.min.apply(Math, array);
    }

    function max(array)  {
	if (array.length < 1)
	    throw new TypeError("zero-length array");
	return Math.max.apply(Math, array);
    }


    function plucker(key) {
	return function(obj) {
	    return obj[key];
	}
    }

    function pluck(array, key) {
	return array.map(plucker(key));
    }

    function copyArray(array) {
	return array.slice(0);
    }

    function rotateArray(array) {
	var e = array.shift();
	array.push(e);
	return e;
    }

    /**
     * Merge properties from all objects given as arguments, objects
     * with lower argument indices overriding those with higher indices.
     */
    function mergeObjects(args) {
	var newObj = {}
	for (var i = arguments.length - 1; i >= 0; i--) {
	    var obj = arguments[i];
	    for (var key in obj) {
		if (obj.hasOwnProperty(key)) {
		    newObj[key] = obj[key];
		}
	    }
	}
	return newObj;
    }

    // This is from underscore.js
    var _toString = Object.prototype.toString;

    // Is a given variable an object?
    function isObject(obj) {
	return obj === Object(obj);
    };

    // Is a given value a function?
    function isFunction(obj) {
	return _toString.call(obj) == '[object Function]';
    };

    // Is a given value a string?
    function isString(obj) {
	return _toString.call(obj) == '[object String]';
    };

    // Is a given value a number?
    function isNumber(obj) {
	return _toString.call(obj) == '[object Number]';
    };

    // Is the given value `NaN`?
    function isNaN(obj) {
	// `NaN` is the only value for which `===` is not reflexive.
	return obj !== obj;
    };

    // Is a given value a boolean?
    function isBoolean(obj) {
	return obj === true || obj === false || 
	    _toString.call(obj) == '[object Boolean]';
    };

    // Is a given value a date?
    function isDate(obj) {
	return _toString.call(obj) == '[object Date]';
    };

    // Is the given value a regular expression?
    function isRegExp(obj) {
	return _toString.call(obj) == '[object RegExp]';
    };

    // Is a given value equal to null?
    function isNull(obj) {
	return obj === null;
    };

    // Is a given variable undefined?
    function isUndefined(obj) {
	return obj === void 0;
    };

    // Module exports
    return {
	shuffleInPlace: shuffleInPlace,
	pickRandom: pickRandom,
	pickOneRandom: pickOneRandom,
	shuffle: shuffle,
	pickRandomWeighted: pickRandomWeighted,
	equalityChecker: equalityChecker,
	inequalityChecker: inequalityChecker,
	sum: sum,
	min: min,
	max: max,
	plucker: plucker,
	pluck: pluck,
	copyArray: copyArray,
	rotateArray: rotateArray,
	mergeObjects: mergeObjects,
	isArray: Array.isArray,	// since we have a shim
	isObject: isObject,
	isFunction: isFunction,
	isString: isString,
	isNumber: isNumber,
	isNaN: isNaN,
	isBoolean: isBoolean,
	isRegExp: isRegExp,
	isNull: isNull,
	isUndefined: isUndefined
    };

})();

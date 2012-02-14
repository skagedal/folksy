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

/***********************************************************************
 * COMPATIBILITY CODE
 ***********************************************************************/


// From https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/IndexOf
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
        "use strict";
        if (this == null) {
	    throw new TypeError();
        }
	var t = Object(this);
        var len = t.length >>> 0;

        if (len === 0) {
	    return -1;
        }

        var n = 0;
        if (arguments.length > 0) {
	    n = Number(arguments[1]);

            if (n != n) { // shortcut for verifying if it's NaN
                n = 0;
            } else if (n != 0 && n != Infinity && n != -Infinity) {
                n = (n > 0 || -1) * Math.floor(Math.abs(n));
            }
        }
        if (n >= len) {
            return -1;
        }
        var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
        for (; k < len; k++) {
            if (k in t && t[k] === searchElement) {
                return k;
	    }
        }
        return -1;
    }
}

// From https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/Reduce
if ( !Array.prototype.reduce ) {
    Array.prototype.reduce = function reduce(accumulator){
        var i, l = this.length, curr;
        
        if(typeof accumulator !== "function") // ES5 : "If IsCallable(callbackfn) is false, throw a TypeError exception."
            throw new TypeError("First argument is not callable");

        if((l == 0 || l === null) && (arguments.length <= 1))// == on purpose to test 0 and false.
            throw new TypeError("Array length is 0 and no second argument");
        
        if(arguments.length <= 1){
            curr = this[0]; // Increase i to start searching the secondly defined element in the array
            i = 1; // start accumulating at the second element
        }
        else{
            curr = arguments[1];
        }
        
        for(i = i || 0 ; i < l ; ++i){
            if(i in this)
		curr = accumulator.call(undefined, curr, this[i], i, this);
        }
        
        return curr;
    };
}       

// From  https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/map
// (removed production steps comments and renamed some variables)
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

// From https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/filter

if (!Array.prototype.filter)
{
    Array.prototype.filter = function(fun /*, thisp */)
    {
	"use strict";

	if (this == null)
	    throw new TypeError();
	
	var t = Object(this);
	var len = t.length >>> 0;
	if (typeof fun != "function")
	    throw new TypeError();

	var res = [];
	var thisp = arguments[1];
	for (var i = 0; i < len; i++)
	{
	    if (i in t)
	    {
		var val = t[i]; // in case fun mutates this
		if (fun.call(thisp, val, i, t))
		    res.push(val);
	    }
	}
	
	return res;
    };
}

// From https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/forEach
// (removed production steps comments and renamed some variables)
// Reference: http://es5.github.com/#x15.4.4.18
if ( !Array.prototype.forEach ) {

    Array.prototype.forEach = function( callback, thisArg ) {

	var T, k;

	if ( this == null ) {
	    throw new TypeError( " this is null or not defined" );
	}

	var O = Object(this);
	var len = O.length >>> 0; // Hack to convert O.length to a UInt32

	if ( {}.toString.call(callback) != "[object Function]" ) {
	    throw new TypeError( callback + " is not a function" );
	}

	if ( thisArg ) {
	    T = thisArg;
	}

	k = 0;
	while( k < len ) {
	    var kValue;

	    if ( k in O ) {
		kValue = O[ k ];
		callback.call( T, kValue, k, O );
	    }
	    k++;
	}
    };
}


/***********************************************************************
 * MODULE
 ***********************************************************************/

util = (function () {

    // Pick random elements from an array. Works similar to 
    // `_.first(_.shuffle(array, n))`, but is more efficient -- operates 
    // in time proportional to `n` rather than the length of the whole 
    // array. 
    //
    // The algorithms mutates the input array while working, but restores 
    // everything before returning. This provides for an optimally
    // efficient algorithm in all situations.  
    function pickRandom (array, n) {
	n = Math.max(0, Math.min(array.length, n));

	return (function pickR(array, n, length) {
	    var i, picked, rest, hasIndex;

	    if (n === 0) {
		return [];
	    }

	    i = Math.floor(Math.random() * length);
	    hasIndex = array.hasOwnProperty(i);	// This is needed for restoration of dense arrays
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

    function sum(array) {
	return array.reduce(function (a, b) {
	    return a + b;
	}, 0);
    },   

    function plucker(key) {
	return function(obj) {
	    return obj[key];
	}
    }

    function pluckMap(array, key) {
	return array.map(plucker(key));
    }


    // Module exports
    return {
	pickRandom: pickRandom,
	pickOneRandom: pickOneRandom,
	equalityChecker: equalityChecker,
	sum: sum,
	plucker: plucker,
	pluckMap: pluckMap
    }
}
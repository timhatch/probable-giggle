/* MVC style coding for a dynamic presentation of bouldering results
* Copyright 2011, Tim Hatch
* Dual licensed under the MIT or GPL Version 2 licenses.
*/

/***********************************
*
* CODEKIT DECLARATIONS
*
***********************************/
/*global _        */

/***********************************
 *
 * UNDERSCORE UTILITIES
 *
 ***********************************/

/*
 * Use Mustache-style for Underscore templates
 *
 */
_.templateSettings = {
  evaluate  : /\{\[([\s\S]+?)\]\}/g,
  interpolate : /\{\{([\s\S]+?)\}\}/g
};

/*
 * Underscore mixins for the results display classes
 *
 */
_.mixin({
  /*
  * compareElements(arr, a, b)
  *
  * An underscore mixin function to perform a deep compare on two elements of an 2D numeric array.
  * returns +1 if the first sub-array is 'greater'; -1 if the first sub-array is 'smaller'; and 0 if the two sub-arrays are identical
  * the comparison is performed by comparing each element of the two sub-arrays in turn
  *
  */
  compareElements: function(arr, a, b){
    var depth = 0
    while (depth < arr[a].length && depth < arr[b].length) {
      if (arr[a][depth] < arr[b][depth]) { return 1 }
      if (arr[a][depth] > arr[b][depth]) { return -1 }
      depth++
    }
    return 0
  },

  /*
  * quicksort(arr, left, right)
  *
  * An underscore mixin function implementing a modified quicksort algorithm (the pivot is set as the first element of each comparison,
  * rather than set randomly or mid-way)
  * Based on the C++ implementation referenced at:
  * http://www.algolist.net/Algorithms/Sorting/Quicksort
  * and the javascript implementation at:
  * http://www.webxpertz.net/forums/showthread.php/11030-Article-JavaScript-Sorting-a-Multidimensional-Array-—-quicksort
  * The main change is to set the pivot as the left edge of the partition being tested (as opposed to the mid point or some random element)
  *
  */
  quicksort: function(arr, left, right){
    var i = left, j = right, pivot = left, tmp
    /* partition */
    while (i <= j) {
      while (_.compareElements(arr, i, pivot) > 0 ) i++  // Use a bespoke compare()
      while (_.compareElements(arr, j, pivot) < 0 ) j--
      if (i <= j) {
        tmp    = arr[i]
        arr[i] = arr[j]
        arr[j] = tmp
        i++
        j--
      }
    }
    /* recursion*/
    if (left < j )  _.quicksort(arr, left, j )
    if (i < right)  _.quicksort(arr, i, right)
  },

  /*
  * titleize(str), strRight(str, sep)
  *
  * Underscore mixins to either 'titleize' a string or create a substring from the right hand part of an existing string
  * Taken from the underscore string manipulation extensions at:
  * https://github.com/epeli/underscore.string
  *
  */
  titleize: function(str){
    if (str == null) return ''
    return String(str).replace(/(?:^|\s)\S/g, function(c){ return c.toUpperCase() })
  },
  strRight: function(str, sep){
    if (str == null) return ''
    str = String(str); sep = sep != null ? String(sep) : sep
    var pos = !sep ? -1 : str.indexOf(sep)
    return ~pos ? str.slice(pos+sep.length, str.length) : str
  }
})
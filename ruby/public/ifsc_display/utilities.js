//  MVC style coding for a dynamic presentation of competition results
//  Copyright 2012-16 T J Hatch
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.

//  -----------------------------------------------------
//  Underscore utilities
//  -----------------------------------------------------
//
// Use Mustache-style for Underscore templates
//
_.templateSettings = {
  evaluate    : /\{\[([\s\S]+?)\]\}/g,
  interpolate : /\{\{([\s\S]+?)\}\}/g
}

//  -----------------------------------------------------
//  Underscore mixins for the results display classes...
//  -----------------------------------------------------
//
_.mixin({
  //
  //  insertionsort(arr, comparator): An underscore mixin function implementing a basic insertion 
  //  sort algorithm operating on a 2D matrix. A comparator function is passed in from the caller.
  //  Based on the Javascript implementation referenced at:
  //  http://bateru.com/news/2011/03/code-of-the-day-javascript-insertion-sort/
  //
  insertionsort: function(arr, comparator){
    var l = arr.length
    var i = -1
    var j, t

    while (l--) {
      t = arr[++i]
      j = i
      while (j-- && comparator(arr[j], t)) { arr[j + 1] = arr[j] }
      arr[j + 1] = t
    }
  },

  //  titleize(str)
  //  Underscore mixins to either 'titleize' a string. Taken from the underscore string
  //  manipulation extensions at:
  //  https://github.com/epeli/underscore.string
  //
  titleize: function(str){
    if (str === null) return ''
    str  = String(str).toLowerCase()
    return str.replace(/(?:^|\s)\S/g, function(c){ return c.toUpperCase() })
  }
})

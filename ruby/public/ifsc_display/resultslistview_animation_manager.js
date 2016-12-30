//	MVC style coding for a dynamic presentation of competition results
//	Copyright 2012-16  T J Hatch
//
//	Licensed under the Apache License, Version 2.0 (the "License");
//	you may not use this file except in compliance with the License.
//	You may obtain a copy of the License at
//
//	http://www.apache.org/licenses/LICENSE-2.0
//
//	Unless required by applicable law or agreed to in writing, software
//	distributed under the License is distributed on an "AS IS" BASIS,
//	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//	See the License for the specific language governing permissions and
//	limitations under the License.

//	-----------------------------------------------------
//	SCOPE DECLARATIONS
//	-----------------------------------------------------
var app = app || {}

//	-----------------------------------------------------
//	ResultsListView Animation Module
//	Define methods to animate the display, and extend the resultslistview with these
//	-----------------------------------------------------

app.ResultsListView.AnimationModule = {
  // Define classes used to denote which DOM elements are to be moved or hiddent (in _filterArray)
  // and to hide the elements
  _filterArray  : [],
  _hiddenClass  : 'hidden',
  // Define a _margin value as el.offsetHeight does not include any margin
  _margin       : 0,

  //  animateDOM() : Loop though an array of elements, sorting them and then recalculating 
  //  the vertical position of each element based on its order within the array. We use an 
  //  array (styleQueue) to queue up animations for execution in a single batch once all 
  //  required animations have been calculated. 
  //
  animateDOM: function(){
    var moveBy

    // Reset the style queue
    this.styleQueue = []

    // Call a function to set the specic filters to be used for animations deendign on whether the 
    // app is mobile or dektop. 
    // _setDFilters => desktop
    // _setMFilters => mobile
    this[this.settings.isFullScreenApp ? '_setDFilters' : '_setMFilters']()

    // containerNodes can contain more than one "container" of sortable elements, so we iterate 
    // across containerNodes to catch each one.
    _(this.resultsView).each(function(container){
      // Reset the conatiner height (containerHeight) and the incremental height (h)
      // Filter and sort the DOM elements (returns an Array of nodes, not a nodelist...)
      var containerHeight = 0
      var h               = 0
      var visibleElements = this.getVisibleElements(container)

      // Calculate the required translation from the old (el.offsetTop) and required 
      // (containerHeight) position of the element. Then push to the style queue and update 
      // container height ahead of moving to the next element.
      // For each element, starting at the 0th element (presumed to be at the top, we
      // 1) Set the 'height' of the element. The height (h) is the same for all elements, 
      // so we could define this just once to save a few computational cycles...
      // 2) Calculate the vertical transformation required to move the element from its current 
      // position (el.offsetTop) to its new position "containerHeight", which is the vertical 
      // dimension of the containing element
      // 3) Push the the transformation details onto the styleQueue. In aggregate, we make the 
      // opacity = 1, move the element and resize the element (scale=1). If the element is already 
      // visible, the only transformation effect that will have any visible effect is the 
      // movement of the element. If the element was previously hidden, then it will go from
      // transparent to opaque, and increase in size from scale=0.001 to scale=1
      // 4) Update the vertical dimension of the containing element to fix the target position 
      // of the next element in the array
      _(visibleElements).each(function(el){
        // NOTE: Math.round() forces resizes/translations to whole pixels.
        h      = h || Math.round(el.offsetHeight * (1 + this._margin))
        moveBy = Math.round(containerHeight - el.offsetTop)
        this.styleQueue.push({ el : el, style : this._applyTransform(1, moveBy, 1) })
        containerHeight += h       
      }, this)

      // Finally, push an instruction onto the stylequeue to update the overall height of the 
      // container
      this.styleQueue.push({ el: container, style: { height : containerHeight+'px' } })
    }, this)

    // Execute the required animations by running through the styleQueue and applying the 
    // relevant CSS styles to each element in the queue
    _(this.styleQueue).each(function(obj){
      for (var key in obj.style) { obj.el.style[key] = obj.style[key] }
    })
  },

  // _setMFilters() : Sets CSS classes used to determine which elements are viewable for the mobile 
  // apps. This is pretty simple as on the apps we display either M or F in conjunction with 
  // Tagged/Untagged for favourites.
  // Assigns classes as follow:
  // .m_list - male visible
  // .f_list - female visible
  // .tgd    - favourites are visible
  // e.g. this._filterArray would be [m_List, tgd] to show only male faourites
  // TODO: Strictly speaking, we could do away with all of thie class allocation, and instead
  // determine visibility based simply on model parameters, e.g. why allocated a m_list class
  // when the category of any climber model is known explicitly...
  _setMFilters: function(){
    var filter = []
    // Show either Male/Female; or Male+Favourite/Female+Favourite
    filter.push(this.settings.get('ShowCategory') ? 'm_list' : 'f_list')
    if (this.settings.get('ShowFavorites')) { filter.push('tgd') }

    // Set the class filter and element margin for the Mobile Apps
    this._filterArray = filter
    this._margin      = 0
  },

  // _setFilters() :  Sets CSS classes used to determine which elements are viewable for the 
  // desktop display. The CSS class assignment is more complicated here, as in addition to 
  // M/F we have to page through the results.
  // The desktop display uses a single class, '.show' but more a more complicated algorithm 
  // for determining visibility
  // TODO: Describe behaviour & purpose of the call to pagingAnimation/tickerAnimation 
  // 
  _setDFilters: function(){
    // If we need to hide one of the results lists (user selected by overloading the 
    // ShowFavorites property for this purpose)
    this.toggleViews(this.settings.get('ShowFavorites'))

    // Call bespoke functions to apply filters to animate by page or 'ticker'
    this[(this.currentRound < 2) ? 'pagingAnimation' : 'tickerAnimation']()

    // Set the class filter and element margin for the Desktop Apps
    this._filterArray = ['show']
    this._margin      = 1/12
  },
  
  //  pagingAnimation(): Set a filter on each element to simulate paging through the results.
  //
  pagingAnimation: function(){
    var order

    // Iterate across each subview, and set its visibility
    _(this.subviews).each(function(view){
      order = view.model.get('display_order')
      view.el.classList[
        ((order > this.swapCounter) && (order <= this.displayCounter)) ? 'add' : 'remove'
      ]('show')
    }, this)

    // Update the counters
    this.swapCounter    = (this.displayCounter < this.displayLock) ? 
      this.swapCounter + this.displayQuota : 0
    this.displayCounter = this.swapCounter + this.displayQuota
  },
 
  //  tickerAnimation(): Display the [counter] competitors and scroll through the remainder one 
  //  at a time.
  //
  tickerAnimation: function(){
    var counter = this.displayCounter

    // Loop across all the climbers whose display_order property is less than the displayQuota 
    // parameter and either (a) add or (b) remove te '.show' class to the element deoending upon 
    // whether the displayOrder parameter is greater than the displayQuoate
    // Typically the climbers ranked 6 or better, but if climbers are tied then 
    // only the first 6 will be shown...
    _(this.subviews).each(function(view){
      view.el.classList[
        (view.model.get('display_order') <= this.displayQuota) ? 'add' : 'remove'
      ]('show')
    }, this)

    // Find the climbers whose rankorder property is 1 greater than the value of the displayCounter 
    // variable and show them, then iterate the displayCounter variable (or reset it once we get to 
    // the end of the list)
    if (this.displayLock > this.displayQuota){
      var viewArr = _(this.subviews).filter(function(view){ 
        return view.model.get('display_order') === this.displayCounter+1 
      }, this)
      _(viewArr).each(function(view){ view.el.classList.add('show') }, this)
    }

    // Update the counter
    this.displayCounter = (counter < this.displayLock-1) ? counter+1 : this.displayQuota
  },

  // getVisibleElements(containerEl) : 
  // Parameters: A parent element containing child elements to be sorted, displayed and animated
  // Returns: An ordered ARRAY of (child) elements (not a NODELIST)
  // Behaviour: Walks through the container element and determine which
  // of the child elements are going to be visible/hidden in the next animation loop.
  //
  getVisibleElements: function(container){
    // Static nodelists for filtering
    // !important - hiddenNodes MUST use a static nodelist as we mutate the list
    var cntentNodes = container.querySelectorAll(this.subviews[0].tagName || 'li')
    var activeNodes = container.querySelectorAll('.'+this._filterArray.join("."))
    var hiddenNodes = container.querySelectorAll('.'+this._hiddenClass)

    // utility function to check if a given class is contained in the context el (this)
    var truthTest   = function(item){ return this.classList.contains(item) }

    // If no filter is defined, return all elements in the container
    if (!this._filterArray.length) { return cntentNodes }

    // iterate across all the subviews in the container and 'hide' any that don't contain all of 
    // the defined filter classes (i hiding, we first shrink the element, make it transparent 
    // and then add a class setting the CSS visibility property to hidden
    _(cntentNodes).each(function(el){
      var isVisible  = !el.classList.contains(this._hiddenClass)
      var isFiltered = _(this._filterArray).every(truthTest, el)
      if ( isVisible && !isFiltered){
        this.styleQueue.push({ el: el, style: this._applyTransform(0, 0, 0.001) })
        el.classList.add(this._hiddenClass)
      }
    }, this)

    // Iterate across all of the INITIALLY hidden subviews in the container and 'unhide' them 
    // if they contain the defined filter classes (we've not yet moved them into position)
    // If they dont contain all of the defined filter classes then we can leave them untouched.
    _(hiddenNodes).each(function(el){
      if (_(this._filterArray).every(truthTest, el)) { el.classList.remove(this._hiddenClass) }
    }, this)

    // Return an  array containing a sorted list of the nodes containing the defined filter classes
    // This is in effect a list of the nodes that need to be made visible and repositioned.
    return this.sortByDataAttribute(activeNodes)
  },

  //  _applyTransform(): Private helper function called from animateDOM() and getVisibleElements() 
  //  to set CSS transformation properties
  //
  _applyTransform: function(opacity, translate, scale){
    var string = 'translate3d(0,'+translate+'px,0) scale3d('+scale+','+scale+','+scale+')'
    var obj    = { 'opacity' : opacity, '-webkit-transform' : string, 'transform' : string }
    return obj
  },

  //  sortByDataAttribute(): Private helper function called by getVisibleElements() to sort 
  //  elements passed to the function by their data-rank and (if ==) data-load attributes. 
  //  !important - returns an array  not a nodelist
  //  NOTE: Accessing data by el.getAttribute('data-rank') is faster than direct access 
  //  el.dataset.rank, so use this
  //
  sortByDataAttribute: function(nodelist){
    // To sort we need to turn the nodelist into an array
    var itemArray  = Array.prototype.slice.call(nodelist, 0)
    var comparator = function(item1, item2) {
      var a = parseInt(item1.getAttribute('data-rank'), 10)
      var b = parseInt(item2.getAttribute('data-rank'), 10)
      // fall back to original order if data matches
      if (a === b) {
        a = parseInt(item1.getAttribute('data-load'), 10)
        b = parseInt(item2.getAttribute('data-load'), 10)
      }
      return ((a > b) ? 1 : (a < b) ? -1 : 0)
    }
    // Sort the input array using the comparator function
    return itemArray.sort(comparator)
  }
}
_.extend(app.ResultsListView.prototype, app.ResultsListView.AnimationModule)


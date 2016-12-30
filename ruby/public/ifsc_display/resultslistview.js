//  MVC style coding for a dynamic presentation of competition results
//  Copyright 2012-16  T J Hatch
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
//  SCOPE DECLARATIONS
//  -----------------------------------------------------
var app = app || {}

//  -----------------------------------------------------
//  ResultsListView...
//  -----------------------------------------------------
//
//  Extend the Backbone.js 'View' class
//  Uses Mixins to modularise the class code
//
app.ResultsListView = Backbone.View.extend({

  currentView : null,
  id          : 'wrapper',
  className   : 'resultslistview',
  events      : {
    'click .cbox' : 'handleTaggingEvent'
  },

  //  initialize() : Create the containing view for the collection of individual model views
  //  The view is initialized by passing the following options: "settings"
  //
  //  !Important - The backbone options parameter is used to allow the view to reference the
  //  application settings
  //
  initialize: function(options){
    // Store a reference to the application settings model
    this.settings = options.settings

    // Initialisie event listeners (on the application settings model) and connect to the relevant
    // handlers
    this.listenTo(this.settings, 'change:ShowFavorites', this.animateDOM, this)
    this.listenTo(this.settings, 'change:ShowCategory', this.handleCategoryChange, this)
    this.listenTo(this.settings, 'change:ShowAgeGroup', this.initResultsListView, this)

    // Start listening for touch/drag events
    this.initDragManager()

    // Initialise the results view
    this.initResultsListView()
  },

  //  close(): Clean out the view when it is closed
  //
  close: function(){
    _(this.subviews).each(function(subview){ subview.close() }, this)
  },

  //  -------------------------------------------------------------------------------------------
  //  View Initialisation & Update Methods
  //  -------------------------------------------------------------------------------------------
 
  //  initResultsListView(): Populate the results collections and render the related subviews 
  //  into the main view called each time the app is loaded, or when a new competition or round 
  //  is selected by the user
  //
  initResultsListView: function(){
    var _initResultsArray = '_init'+this.settings.get('comp_type')+'ResultsArray'

    // Record the current view parameters
    this.currentComp  = this.settings.get('EGWComp')
    this.currentRound = this.settings.get('EGWRound')
    this.currentCType = this.settings.get('comp_type')
    this.categoryObj  = this.settings.getCategories()

    // Create or reset an array of collection (ResultsLists) objects and a startlist object
    this.resultslists = []
    this.starters     = null

    // Call the discipline-specific _init[*]ResultsArray() function to populate the 
    // resultslists array
    this[_initResultsArray]()

    // Render the view container & set the statusBarHeight == 24 to indicate that data is 
    // loading
    this.renderSuperView()
    this.setStatusBarHeight(24)

    // Call the fetchViewContent() function to get data from the server and render subviews
    this.fetchViewContent()
  },

  //  Private methods called from initResultsListView() to create the view's collections (each a 
  //  ResultsList object)
  //
  _initBResultsArray: function(){
    // Set up the variables for the first object to be fetched
    var cat1  = this.settings.get('ShowCategory') ? this.categoryObj.male : this.categoryObj.female
    var cat2  = (cat1 === this.categoryObj.male) ? this.categoryObj.female : this.categoryObj.male
    var round = this.currentRound

    // Call pushCollections to load two collections
    this.pushNewCollection(cat1, round)
    if (!this.currentRound) { round++ ; cat2 = cat1 }
    this.pushNewCollection(cat2, round)
  },

  _initLResultsArray: function(){
    // Set up the variables for the first object to be fetched
    var cat1  = this.settings.get('ShowCategory') ? this.categoryObj.male : this.categoryObj.female
    var cat2  = (cat1 === this.categoryObj.male) ? this.categoryObj.female : this.categoryObj.male
    var round = this.currentRound

    this.check_cats = [cat1, cat2]
    // Call pushNewCollection to load a collection into the resultslists array
    this.pushNewCollection(cat1, round)

    // Load a second collection if (a) it's the semifinal/final; or (b) a desktop display 
    // (to display both cats)
    if (!!round || this.settings.isFullScreenApp) { this.pushNewCollection(cat2, round) }

    // Finally, deal with the exceptional case of the World Championship format, where we have 
    // 2 sub-competitions in the qualification round (as there field is split into 2).
    // Create a 2nd collection if we're in Qualification and we're not on the Desktop; then 
    // overwrite the default competition and category parameters for the collections before 
    // we load any data
    // TODO: Integrate this into the application structure, rather than hard-wiring...
//    if (this.currentComp === 1500 && !round) {
//      if (!this.settings.isFullScreenApp) { this.pushNewCollection(cat1, round) }
//      this.resultslists[0].comp = 1595 // 1458 //
//      this.resultslists[1].comp = 1596 // 1525 //
//      this.resultslists[1].cat  = cat1
//      this.resultslists[1].SG2  = 1
//    }
  },

  _initSResultsArray: function(){
    // Set up the variables for the first object to be fetched
    var cat1  = this.settings.get('ShowCategory') ? this.categoryObj.male : this.categoryObj.female
    var cat2  = (cat1 === this.categoryObj.male) ? this.categoryObj.female : this.categoryObj.male
    var round = this.currentRound

    // Push a single collection onto the array for the selected round
    this.pushNewCollection(cat1, round)

    // and if we're using the desktop app, collect another collections (so that we have both
    // categories)
    if (this.settings.isFullScreenApp) { this.pushNewCollection(cat2, round) }
  },

  //  pushNewCollection(category, round): Create two collection objects and push them into the 
  //  resultslist array called from _init[*]ResultsArray() methods
  //
  pushNewCollection: function(category, round){
    // Create a new collection for the first set of data to be fetched
    this.resultslists.push(new app.ResultsList({
      'settings': this.settings,
      'round'   : round,
      'cat'     : category,
      'cObj'    : this.categoryObj 
    }))
  },

  //  fetchViewContent():  call the collection.loadResults() method, render the associated 
  //  subviews and then sort/update the views
  //
  fetchViewContent: function(){
    var promise
    var promiseArray = []
    var SF           = (this.currentCType === 'S' && !!this.currentRound)
    var LQ           = (this.currentCType === 'L' && !this.currentRound)
    var message

    // Fetch results from the server for each collection. Also pass the index number of the 
    // collection (needed by the renderSubViews() method)
    _(this.resultslists).each(function(collection, i){
      promise = collection.loadResults()
      .then(function(){ this.renderSubViews(collection, i) }.bind(this))
      .catch(function(err){ message = err })
      promiseArray.push(promise)
    }.bind(this))

    // Now perform any actions that need all asynchronous actions to have been completed
    // i.e. When all promises in the array been have resolved (i.e. when we have rendered all
    // subviews)
    Promise.all(promiseArray).then(function(){
      // window.console.log('all promises resolved')
      if (!!this.subviews.length) {
        // If we're using the General Result for results updates, we'll need to pull that 
        // in. Otherwise just update the view. See also ResultsList::update() for when the 
        // General Result ia used
        this.updateViewContent({ force_refresh : (LQ || SF) ? true : false })
        // If we're running the desktop app, then start the autoRefresh...
        if (this.settings.isFullScreenApp) { this.autoRefresh() }
      }
      // Otherwise get the list of any climbers registered for the comp' or put up an error 
      // message
      else { 
        var renderer = (!this.settings.get('EGWRound')) ? 'renderStartlist' : 'renderXHRError'
        this[renderer]() 
      }
    }.bind(this))
  },

  //  updateViewContent(options): call the collection.update() method and then update the view
  //  Behaviour:
  //  if options.force_refresh == true, fetch new results data from the server and then call 
  //  this.animateDOM(); or if options.force_refresh is undefined || false, call this.animateDOM()
  //
  updateViewContent: function(options){
    var promise 
    var promiseArray = []

    // window.console.log(this.resultslists)
    // If force_refresh == true, then get new results from the server
    options = options || {} // OR options || (options = {})
    if (options.force_refresh) {
      _(this.resultslists).each(function(collection){
        promise = collection.update()
        .catch(function(err){ window.console.log(err +' caught in updateViewContent:') })
        promiseArray.push(promise)
      }, this)
    }

    // But in all cases, perform a visual sort & hide the statusbar
    Promise.all(promiseArray).then(function(){
      this.animateDOM()
      this.hideStatusBar()
    }.bind(this))
  },

  //  -------------------------------------------------------------------------------------------
  //  Render Methods -
  //  -------------------------------------------------------------------------------------------
  //
  //  renderSuperView(): Render the view container
  //
  renderSuperView: function(){
    // Clean up any existing views if render is being called other than the first time
    if (this.currentView) { this.close() }
    this.subviews = []

    // Create the shell of the view & append to the DOM. This overwrites any existing content.
    //this.el.innerHTML = _.template(document.getElementById('rlv_template').textContent, {})
    this.el.innerHTML = this.template()
    document.body.appendChild(this.el)

    // Create references to the current view and to the list elements within the view
    this.currentView  = this.el
    this.resultsView  = this.el.getElementsByTagName('ul')
  },

  //  renderSubViews(): Render the climber subviews.
  //  Takes as inputs a collection (of climber models) and the index of the collection within the 
  //  resultslist array.
  //  The method then determines which list element view into which it needs to render:
  //  NOTE: The mobile-format display always renders into the first (and only) <ul> element
  //  NOTE: The desktop-format display always renders into two <ul> elements, 0 and 1 (determined 
  //  by the collection's index) represented by the idx parameter
  //
  renderSubViews: function(collection, i){
    var viewtype = this.settings.get('comp_type')+"ClimberView"
    var frag     = document.createDocumentFragment()
    var index    = (this.settings.isFullScreenApp && i) ? 1 : 0
    var offset   = (collection.round === 1) ? 1000 : 0
    var o, subview

    // Iterate through the collection and:
    // Create a new subview (the subview initialisation method takes care of rendering) 
    // and append it to a list of subviews (for garbage collection when the superview is 
    // re-rendered)
    // Set a 'data-load' attribute with a unique value (we need this for a stable sort of 
    // the DOM) in animateDOM(). The 'offset' value forces startgroup 2 to display after 
    // startgroup 1
    // Finally, append to the document fragment   
    collection.each(function(model){
      subview = new app[viewtype]({ model : model })
      this.subviews.push(subview)
      o = this.subviews.length + offset
      subview.el.setAttribute('data-load', o)
      frag.appendChild(subview.el)
    }, this)

    // Append the document fragment to the cached parent object...
    this.resultsView[index].appendChild(frag)

    // Enable chaining
    return this
  },

  //  renderStartlist(): Fetch startlist data and then render the associated views (or an error
  //  message)
  //
  renderStartlist: function(){
    // Instatiate the startlist collection object
    this.starters = new app.ResultsList({ 'settings' : this.settings, 'cObj' : this.categoryObj })

    // Call the collection's loadStarters() method and when done, style the ClimberViews (null 
    // the rank and hide the favourites button)
    this.starters.loadStarters()
    .then(
      // On success : render the list and call updateViewContent()
      function(){ 
        if (this.starters.length) { 
          this.renderSubViews(this.starters).updateViewContent() 
        } else { this.renderXHRError() }
      }.bind(this),
      // On failure : call the renderXHRError() method
      function(){ this.renderXHRError() }.bind(this))
    .then(function(){
      _(this.el.getElementsByClassName('rank')).each(function(el){ el.textContent = '' })
      _(this.el.getElementsByClassName('fav')).each(function(el){ el.style.visibility = 'hidden' })
    }.bind(this))
  },

  //  renderXHRError(): Render an error message when no data can be loaded
  //
  renderXHRError: function(){
    var onl = "Network Error : Data may not exist or Server is unavailable"
    var ofl = "Network Disconnected (and requested data not in memory)"
    var xel = document.createElement('div')

    xel.className   = 'xhr_error'
    xel.textContent = (!window.navigator.onLine) ? ofl : onl
    this.el.insertBefore(xel, this.el.firstChild)
    this.hideStatusBar()
  },

  //  -------------------------------------------------------------------------------------------
  //  Event Handlers -
  //  -------------------------------------------------------------------------------------------
  //
  //  handleTaggingEvent(): Respond to a user input to mark a climber as a favourite (or not)
  //  Behaviour: 
  //  This method relies on click events 'bubbling up' from the relevant view and is 
  //  theoretically a more efficient mechanism than having event handlers within each subview as 
  //  this method requires only a single event handler, where explicit event handlers within each 
  //  subview implies [n] handlers (where 12 < n 80 in our case)
  //  A key assumption is that the DOM element and its related model have the same id
  //
  handleTaggingEvent: function(e){
    var model  = e.target.id
    var status = e.target.checked
    //  We have to go up 3 levels to 'tag' the list element
    var view   = e.target.parentNode.parentNode.parentNode
    var tagged = null

    // Set the visibility status on the model
    _(this.resultslists).each(function(collection){
      tagged = collection.get(model)
      // If the model was within the collection
      if (tagged) { tagged.set({ 'is_tagged' : status }) }
    })

    // Set the visibility status on the view
    view.classList.toggle('tgd')
    view.classList.toggle('ntg')
  },

  //  handleCategoryChange(): Respond to a user input to change the visible Category.
  //  Behaviour:
  //  If we need to load new data, then call initResultsListView()
  //  If we don't need to load new data, just call animateDOM() to ensure that the view coming 
  //  into focus in sorted 
  //  NOTE: The behaviour of this method is tied to that of initResultsListView(), and depends 
  //  whether we are loading data for both categories at the same time. e.g. For Lead/Boulder we 
  //  load a single category at a time in Qualification but load data for both categories 
  //  simultaneously for the semi-final and final rounds. For Speed we always load only a single 
  //  category at any one time.
  //
  handleCategoryChange: function(){
    //var toggle_loadResults = (!this.currentRound || (this.currentCType === 'S'))
    var loadnewdata = (!this.currentRound || (this.settings.get('comp_type') === 'S'))
    this[(loadnewdata) ? 'initResultsListView' : 'animateDOM']()
  },
})

//  -------------------------------------------------------------------------------------------
//  Mobile-specific methods
//  -------------------------------------------------------------------------------------------


app.ResultsListView.mobile = {
  //  View Template
  //
  template: _.template([
    "<div id='pulltab'><span>. . .</span></div>",
    "<ul></ul>"
  ].join(''))  
}


//  -------------------------------------------------------------------------------------------
//  Desktop-specific methods
//  -------------------------------------------------------------------------------------------

app.ResultsListView.desktop = {
  
  //  View template
  //
  template: _.template([
    "<div id='pulltab'><span>. . .</span></div>",
    "<ul></ul><ul></ul>"
  ].join('')),

  //
  //  autoRefresh(): Use an interval timer to fetch data from the server every 10s or 30s
  //
  autoRefresh: function(){
    var lArr     = _(this.resultslists).pluck('length')
    var interval = this.currentRound ? 10000 : 30000

    // Clear any exising interval from memory
    if (this.intervalTimer) { clearInterval(this.intervalTimer).bind(this) }

    // Reset the swapCounter, displayCounter and displayLock parameters
    this.swapCounter    = 0
    this.displayCounter = this.displayQuota = this.currentRound ? 6 : 7
    this.displayLock    = _(lArr).max()

    // First we re-fire animateDOM(), as the desktop app calls swapView or swapPage from 
    // animateDOM() and these functions each require this.displayLock, this.displayCounter 
    // and this.swapCounter to have been defined, which is in this function. So any earlier 
    // call on animateDOM() will not correctly define the view filters
    //
    this.animateDOM()

    // Set up the interval timer
    this.intervalTimer = setInterval(function(){
      window.console.log('update called')
      this.updateViewContent({ force_refresh : 'true' })
    }.bind(this), interval)
  },

  //
  //  toggleViews(bool): On the Desktop application, we override the behaviour of the 'favorites' 
  //  button in the Header bar, so that instead of toggling the view state of an individual 
  //  climber, it centers the left-hand ul element and hides the right-hand ul elements
  //
  toggleViews: function(bool){
    var ul1    = this.el.getElementsByTagName('ul')[0]
    var ul2    = this.el.getElementsByTagName('ul')[1]
    var action = bool ? 'add' : 'remove'

    ul1.classList[action]('shift')
    ul2.classList[action]('hide')
  }
}

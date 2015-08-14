/*  MVC style coding for a dynamic presentation of bouldering results
* Copyright 2011, Tim Hatch
* Dual licensed under the MIT or GPL Version 2 licenses.
*/

/***********************************
*
* CODEKIT DECLARATIONS
*
***********************************/
/*global Backbone */
/*global _        */
/*global App      */

window.App = window.App || {}

/***********************************
*
* MODELS / COLLECTIONS
*
***********************************/

/*
* ResultsList extending Backbone.js 'Collection' class
*
*/
App.ResultsList = Backbone.Collection.extend({
  url       : './scripts/getJSON.php',
  model     : App.Climber,

  /*
  * initialize()
  *
  * NOTE: Mandatory input parameter is a reference to the application settings model (options.settings)
  * NOTE: Optional input parameters are the round and category for display
  *
  */
  initialize: function(options){

    // Use the options data to set the round/category if provided, and set the comp & numberofblocs based on the application settings
    this.cat      = options.cat || 'm'

  },

  /*
  * loadResults(): Get startlist data from the server
  *
  * Return a bespoke $.deferred instead of simply passing through the $.deferred returned by the $.getJSON call.
  * This allows us to work around the possibility that $.getJSON may return a 404 if (for example) one of the specified Starting Groups does not exist.
  *
  */
  loadResults: function() {
    var url  = this.url+'?cat='+this.cat,
      $rsp = $.Deferred(),
      $xhr = $.getJSON(url),
      self = this

    $xhr.success(function(data){
      self.parseJSONData(data)        // Tidy up the retrieved eGroupware JSON object
      self.reset(data)            // Create a set of models from the edited 'participants' object
//      window.console.log(data)
      $rsp.resolve(true)            // Resolve the Deferred and pass true for a successful query
    })
    $xhr.error(function(){
      $rsp.resolve(false)           // Resolve the Deferred and pass false for an unsuccessful query
    })
    return $rsp
  },

  /*
  * update(): Get startlist data from the server
  *
  * Uses the same methodology as loadResults() to get around $.getJSON returning a $.deferred with fail status
  *
  */
  update: function(){
    var url  = this.url+'?cat='+this.cat,
      $rsp = $.Deferred(),
      $xhr = $.getJSON(url),
      self = this

    $xhr.success(function(data){
//      window.console.log(data)
      self.setResults(data)         // Calculate and set the results data for each climber (model)
      self.sort()               // Calculate the resulting rank
      $rsp.resolve(true)
    })
    $xhr.error(function(){
      $rsp.resolve(false)
    })
    return $rsp
  },

  /*
  * parseJSONData(participants): Parse the JSON data returned in loadResults()
  *
  */
  parseJSONData: function(data) {
    // For each entry in the .participants object
    _(data).each(function(person){
      person.id     = parseInt(person.startnumber, 10)
      person.rankorder  = person.id
    }, this)
  },

  setResults: function(data) {
    var model
    _(data).each(function(person){
//      window.console.log(person.startnumber)
      model = this.get(person.startnumber)
      model.set({ 'points' : person.points, 'bonus' : person.bonus })
    }, this)
  },
  /*
  * sort(): Extract a numeric result from the string provided by eGroupware
  *
  */
  sort: function(){
//    window.console.log('ResultsList::sort fired')
    var rankArray   = [],
      sortingArray  = [],
      s_len     = this.models.length,
      cr,
      k

    // Push data into a temporary array that we can sort (sortingArray)
    _(this.models).each(function(model){ sortingArray.push(model.getResults()) })

    // Sort by T/TA/B/BA/rank_prev_heat/PerID (this latter gives a 'stable sort' in the event of ==)
    _(sortingArray).quicksort(0, s_len-1)
    // Make a new array containing the 'id' of the climbers in post-sort order
    rankArray = _(sortingArray).map(function(arr){ return -_(arr).last() })
    // Find the climber (model) who is ranked first i.e. the first 'id' contained within rankArray and set their currentranking == 1, and rankorder == 1
    // rankorder is needed for positioning the model view in the DOM and is unique, whereas currentranking may not be unique (if the climber is ex-aequo)
    // This updates the model's currentranking & rankorder attributes
    this.get(rankArray[0]).set({ 'currentranking' : 1 , 'rankorder' : 1})

    // Now update the ranking and order information for the other climbers...
    // first we need to pop the start_order off the array so that we can correctly test for ex-aequo n T/TA/B/BA/rank_prev_heat
    // Then iterate through the sortingArray... If the result of the climber in rows i and i-1 are the same, make the climber rankings equal. If the two sets of results are different then make the ranking of the climber in row i equal to i+1 (+1 because row indices start at 0 in javascript). The rankorder is however always set at i+1 (this enables a stable visual sort)
    _(sortingArray).each(function(arr){ arr.pop() })
    for(k = 1; k < s_len; k++){
      cr = (_(sortingArray).compareElements(k-1, k) === 0) ? this.get(rankArray[k-1]).get('currentranking') : (k+1)
      this.get(rankArray[k]).set({ 'currentranking' : cr, 'rankorder' : k+1 })
    }
  }
});



/***********************************
*
* VIEWS
*
***********************************/

/*!
 * ResultsList view extending Backbone.js 'View' class
 */
App.ResultsListView = Backbone.View.extend({
  $resultsView  : null,
  currentView   : null,
  className   : 'resultslistview',

  /*
  * initialize() : Create the containing view for the collection of individual model views
  * The view is initialized by passing the following options:
  *
  * !Important - The backbone options parameter is used to allow the view to reference the application settings
  *
  */
  initialize: function(options){
    var self = this

    self.loadResults(options.cat)
    setInterval(function(){
      self.updateView({ 'force_refresh' : true })
    }, 5000)

  },

  /*
  * loadResults(): Populate the results collections and render the related subviews into the main view
  *
  */
  loadResults: function(cat){
    var subview,
      $response,
      $deferreds  = [],
      self    = this

    // Pre-render the view container & initialise the collections containing the results
    this.initViewContainer(cat)

    // Fetch results from the server for each collection
    // We return a bespoke $.deferred object from the $.ajax call and create views if that $.deferred returns true
    _(this.resultslists).each(function(collection){
      $response = collection.loadResults()
      $.when($response).done(function(bool){
        // If the collection's loadResults() function returns 'true' (i.e. the collection's getJSON returned data, create and append a subview for each climber)
        if (bool) {
          collection.each(function(model){
            subview =  new App.ClimberView({ model : model })
            self.climberviews.push(subview)
            self.$resultsView.append(subview.render().el)
            // NOTE: Now that we've created the model views, we can update the view to show results
            subview.update()
          })
        }
      })
      $deferreds.push($response)
    })

    // When all $deferreds have completed (i.e. when we have rendered all subviews), initialize $.isotope and call update() to sort/filter the view
    $.when.apply(null, $deferreds).done(function(){

      // Initialise isotope for elements of kind 'li'
      self.$resultsView.isotope({
        itemSelector  : 'li',
        getSortData   : {
          rankorder: function($el){ return parseInt( $el.data('rankorder'), 10) }
        }
      })
      self.updateView()
    })
  },

  /*
  * initViewContainer(): Create the results collections & call the main view render function
  *
  */
  initViewContainer: function(cat){


    // Create an array of ResultsLists objects (collections) & set up the variables for the first object to be fetched
    this.resultslists = []

    // Push two collections onto the array for the selected round, either M+F or both Starting Groups for the selected category in Q
    this.resultslists.push(new App.ResultsList({ 'cat' : cat }))
    // this.resultslists.push(new App.ResultsList({ 'cat' : cat+'j' }))

    // Pre-render the view container
    this.render()
  },

  /*
  * render(): Render the view container
  *
  */
  render: function(){
    var str = '<ul></ul>'

    // Clean up any existing views if render is being called other than the first time
    if (this.currentView) { this.close() }
    this.climberviews = []

    // Create the shell of the view.
    this.$el.html(str)
    this.$resultsView = this.$('ul')  // Cache the resultslist view

    // Append the view to the DOM
    $('#wrapper').prepend(this.el)

    // Create a reference to the current view
    this.currentView = this
  },

  /*
  * updateView(): Order the displayed results
  *
  * Takes an optional parameter to force a refresh of the collection data
  *
  */
  updateView: function(options){
    var $response,
      $deferreds  = [],
      self    = this

    // If force_refresh == true, then get new results from the server
    options || (options = {})

    if (options.force_refresh) {
      _(this.resultslists).each(function(collection){
        $response = collection.update()
        $deferreds.push($response)
      }, this)
    }

    // But in all cases, apply the $.isotope filters to perform the visual sort
    $.when.apply(null, $deferreds).done(function(){

      // Set the default css properties & set the $.isotope filter based on the current application settings
      var cssProperty = 'visible'

      // Call the $.isotope updateSortDate() method on the li elements in the view
      // We need to do this as the parameter 'rankorder' will have changed since $.isotope was initialized
      self.$resultsView.isotope( 'updateSortData', self.$('li'))

      // Call the $.isotope sortBy() method using rankorder as the sorting parameter and apply filters to show the top 'n' and to rotate through the remainder
      self.$resultsView.isotope({ 'sortBy': 'rankorder' })
    })
  }
});

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
//  ResultsList...
//  -----------------------------------------------------
//
//  Extend the Backbone.js 'Collection' class
//
app.ResultsList = Backbone.Collection.extend({

  model : app.Climber,

  //  initialize()
  //
  //  NOTE: Mandatory input parameter is a reference to the application settings model 
  //  (options.settings)
  //  NOTE: Optional input parameters are the round and category for display
  //
  initialize: function(options){
    this.settings = options.settings

    // Use the options data to set the round/category, and set the comp based on the 
    // application settings
    this.comp  = this.settings.get('EGWComp')
    this.type  = this.settings.get('comp_type')
    this.round = options.round || this.settings.get('EGWRound')
    this.cat   = options.cat
    this.SG2   = (this.round === 1) ? 1 : 0

    // Store the categories relevant to the round
    this.cObj  = options.cObj

    // Set constants used in function calls e.g. ::setResults()
    // = Number of boulders
    this.NB    = this.settings.get('Boulders')[this.settings.get('EGWRound')] 
    // = Booleans for Speed Final, Lead Qualification, Lead Final
    this.SF    = (this.type === 'S' && !!this.round)
    this.LQ    = (this.type === 'L' && !this.round)
    this.LF    = (this.type === 'L' && (this.round === this.settings.get('comp_rnds')))

    // Call updateFavoritesList() if any model in the collection fires a change:is_tagged event
    this.on('change:is_tagged', this.updateFavoritesList, this.settings)
  },

	//	loadResults(): Fetch results data from eGroupware and populate the collection
	//	Uses the default entry point to eGroupware specifying the comp, category and round
	//
	loadResults: function(){
		var query = '?wet_id='+this.comp+'&grp_id='+this.cat+'&route='+this.round
    var parse = function(data){
				this.parseJSONData(data)
				this.reset(data)
				this.setRankPrevHeat()
				this.sortResults(data)
    }.bind(this)

    return this.getJSON(query).then(parse)
  },

  //  loadStarters(): Fetch results data from eGroupware and populate the collection
  //  Uses the &type=starters option to fetch the list of registered climbers
  //
  loadStarters: function(){
	},

  //  update(): Fetch climber data from the server and update the collection
  //  Behaviour:
  //  For most cases: Boulder (all rounds), Lead (all rounds) and Speed (qualification) we 
  //  retrieve the eGroupware response for that specific round (e.g. using the &route=[*] 
  //  parameter). This is efficient in terms of data usage, as only the result for the 
  // competitors in that round is retrieved, but it does give some inefficiencies. For the Speed 
  // Final, we can't do this so easily, as the final can have anywhere from 3 to 5 stages so we 
  // have an unknown number of 'rounds' to retrieve. So in this case, we retrieve the "General 
  // Result", submitting the request without the '&route' parameter
  //
  update: function(){
    var query = '?wet_id='+this.comp+'&grp_id='+this.cat
    var parse = function(data){ this.sortResults(data.participants) }.bind(this)

    // Set the url to access either the specific round or the General Result
    query += ((this.LQ || this.SF) ? '' : '&route='+this.round)

    // Set the results data for each climber (model) in the collection, then sort the collection
    return this.getJSON(query).then(parse)
  },

  //  -----------------------------------------------------------------------------------------------
  //  Data Parsing & Sorting Methods -
  //  -----------------------------------------------------------------------------------------------
  
  //  parseJSONData(participants): Parse the JSON data returned in loadResults()
  //
  parseJSONData: function(participants){
    var mcat  = this.cObj.male
    var chr

    // For each entry in the .participants object
    _(participants).each(function(person, i){
      chr = _(person.lastname).last()
      if (chr === chr.toUpperCase()) { person.lastname = _.titleize(person.lastname) }
      chr = _(person.firstname).last()
      if (chr === chr.toUpperCase()) { person.firstname = _.titleize(person.firstname) }

			// Add new properties (a) as the model id and (b) to indicate the starting group
			person.id             = parseInt(person.per_id, 10)
			person.is_tagged      = (_.indexOf(this.settings.get('FavoritesList'), person.id) > -1)

      // Edit properties , e.g. where ints/floats are stored as strings
      person.cat            = mcat === (person.cat || this.cat)
      // Rely on the original order if not defined
      person.start_order    = parseInt(person.start_order, 10) || i+1 
      person.rank_prev_heat = parseFloat(person.rank_prev_heat) || null

      // Delete properties that aren't used
      ;delete person.birthyear
      ;delete person.city
      ;delete person.federation
      ;delete person.fed_url
      ;delete person.qoints
      ;delete person.result_modified
      ;delete person.reg_fed_id
      ;delete person.start_number
      ;delete person.url
    }, this)
  },

  //  setResults(participants): Set calculated results & sorting parameters for each model, 
  //  then sort the collection using the 'sort_value' parameter stored for each model within the
  //  collection and update parameters used by the model view by calling setDisplayValues() 
  //  and setDisplayTime() so that the model views update.
  //
  sortResults: function(participants){
    var _setResults = '_set'+this.type+'Results'
    var opts        = {}

    // Iterate across each person in the participants object to set calculated properties 
    // required for sorting & displaying results
    _(participants).each(function(person){
      // Get the general results data
      opts.rank = parseInt(person.result_rank, 10)
      opts.prev = parseFloat(person.rank_prev_heat) || parseInt(person.start_order, 10)

      // Set the related model parameters
      this[_setResults](person, opts)
    }, this)

    // Re-order the collection's models using an insertion sort algorithm - this should be 
    // sufficiently fast:
    // (a) the models are initially loaded in starting order (if the round has not started); and
    // (b) once the round has started, the first 'sort' may affect all elements, but subsequent
    // sorts should only be incremental.
    // !important: We pass a comparator function as an argument to the insertionsort() function
    _(this.models).insertionsort(function(a, b){ return (a.get('sort_value') > b.get('sort_value')) })
    // Call setDisplayValues() to set model attributes appearing in the view.
    this.setDisplayValues()
  },

	//
	//	Private methods called from setResults() to set results data for specific disciplines
	//
	_setBResults: function(person, options){
		var model   = this.get(parseInt(person.per_id, 10))
    var sortval = options.rank || this.length + options.prev
      
		// Get the model and set its results parameters
		model.set({
			'sort_value': sortval || null,
      'sort_values': person.sort_values || null,
      'result_jsonb': person.result_jsonb || null
		})
	},

  _setLResults: function(person, options){
    var model   = this.get(parseInt(person.PerId, 10))
    var sortval = options.rank || (this.length + options.prev)

    // If it's the qualification round (i.e. we're fetching the General Result)
    if (this.LQ) {

      // 2 Qualification in series has no result0 parameter until the second route starts, so fix this
      if (!person.result0 && !person.result1) { person.result0 = person.result }

      // Set the effective rank parameter (for sorting). If we are looking either: (a) the
      // qualification round after it has completed; or (b) a 2-route serial qualification
      // round is in progress, and at least one climber has started the second route, then
      // the 'quali-points' property will exist and we can use that. In the case of (a), we
      // have to use it anyway as the options.rank parameter will change as a consequence of 
      // results in later rounds) If the "quali_points" parameter doesn't exist then either
      // (a) a 2-route parallel qualification round is in progress, or (b) a 2-route serial
      // qualification round is in progress, but the second route has not yet started and we
      // just use the options.rank parameter as initially set
      if (person.quali_points !== undefined) { sortval = parseFloat(person.quali_points) }

      // The overall ranking is not calculated when data has been entered for only one route 
      // in a 2-route parallel qualification round. We can fix this by making sortval = the 
      // rank on the one route completed.
      if (sortval === 1) {
        if (person.result0 === undefined) sortval = parseInt(person.result_rank1, 10) || 0.9
        if (person.result1 === undefined) sortval = parseInt(person.result_rank0, 10) || 1.1
      }
    }

    // Set the model's results properties. Use a try block because (in the qualification round) 
    // the collection is initially populated from the &route=0 response, and updates are 
    // gathered from the General Result - in theory the latter should be a subset of the 
    // former, but try... catch... is safe. Technically we don't need a try... catch.. for the 
    // semifinal and final, as for these rounds we collect data for the round itself, but it 
    // does no harm
    try {
      model.set({
        'result'    : person.result || null,
        'result0'   : person.result0 || null,
        'result1'   : person.result1 || null,
        'res_rank0' : person.result_rank0 || null,
        'res_rank1' : person.result_rank1 || null,
        'sort_value': sortval || null,
        'time'      : parseFloat(person.time) || null
      })
    }
    catch (err) { window.console.log('not in collection (PerId): '+person.PerId) }
  },
  _setSResults: function(person, options){
    var model   = this.get(parseInt(person.PerId, 10))
    var sortval = options.rank || (this.length + options.prev)
    var rank

    // Iterate across the results for each stage in the speed final
    if (this.SF) {
      // Set the basic rank & result parameters
      rank          = person.result_rank6 || person.result_rank5 || person.result_rank4 || 
        person.result_rank3 || person.result_rank2
      person.result = person.result6 || person.result5 || person.result4 || 
        person.result3 || person.result2

      // Throw in an experimental loop that we can use to show when the competitor was eliminated
      //var last, m, n = 6
      //while (n > 1) {
      //  if (!!person['result'+n]) { m = n; break }
      //  n--
      //}
      //if (!!this.rts[m]) last = this.rts[m]
      //window.console.log(last)
    }

    // Abbreviate the result text where the climber has been eliminated for 2 False Starts.
    if (person.result === "2. false start") { person.result = "2 FS" }

    // Set the model's results parameters. Use a try block because the General Result will 
    // contain competitors not in the final round i.e. they won't have a corresponding model in 
    // the collection and a model.set() call will error out
    try {
      model.set({
        'result'    : person.result || null,
        'sort_value': sortval || null,
        'result_l'  : person.result_l ? person.result_l : null,
        'result_r'  : person.result_r ? person.result_r : null,
        'elim'      : (rank !== "1")
        //'lastround' : last || null
      })
    }
    catch (err) { window.console.log('not in collection (PerId): '+person.PerId) }
  },

  //  -------------------------------------------------------------------------------------------
  //  Setter Methods -
  //  -------------------------------------------------------------------------------------------
 
  //  setRankPrevHeat(): Calculate the rank from the previous heat. We implement this method 
  //  specifically for lead competitions and for the round following qualification, where 
  //  eGroupware provides the rank_prev_heat property as the qualification points calculated for 
  //  the climber rather than an actual rank.
  //
  setRankPrevHeat: function(){
    var l    = this.length
    var rArr = []
    var i, j, cr

    // Exit if the comp is not a lead comp; or if the round does not immediately follow
    // qualification
    if (!(this.type === 'L' && this.round === 2)) { return }

    // Create a temporary array containing the rank_prev_heat data (as this will be 
    // overwritten) and run an insertion sort across the temporary array to order by the prior 
    // rank
    // !important: We pass a comparator function as an argument to the insertionsort() function
    this.each(function(model){ rArr.push([model.get('rank_prev_heat'), model.get('id')]) })
    _(rArr).insertionsort(function(a,b){ return (a[0] > b[0]) })

    // Traverse the temporary array & set new values for the 'rank_prev_heat' property of the 
    // relevant models
    for (i = 0, j = 1, this.get(rArr[0][1]).set({ 'rank_prev_heat' : 1 }); j < l; i++, j++) {
      cr = (rArr[i][0] === rArr[j][0]) ? this.get(rArr[i][1]).get('rank_prev_heat') : j+1
      this.get(rArr[j][1]).set({ 'rank_prev_heat' : cr })
    }
  },

  //  setDisplayTime(): Assign a 'true | false' flag to each model to indicate whether time is 
  //  relevant in the final.
  //  !important: This function requires the collection to have been sorted prior to invocation
  //  We set attributes directly - rather than using .set() - which may be naughty but is 
  //  substantially faster.
  //
  setDisplayTime: function(){
    var a = this.models
    var l = this.length
    var i, j

    // Set the 'timeflag' of the first element to false and then iterate across the models, 
    // [0]th to [n-1]th and set timeflags == true for the the [r]th and [r+1]th elements if the 
    // results are equal and they were tied in a prior round. If neither of these things are 
    // true, then set the timeflag of the [r+1]th element to false: The timeflag for the [r]th 
    // element may be true or false depending on the results of a previous test (e.g. if it's 
    // the same as [r-1]th element)
    for (i = 0, j = 1, a[0].set({ 'time_flag' : false }); j < l; i++, j++) {
      if (a[i].get('result') === a[j].get('result') && a[i].get('rank_prev_heat') === a[j].get('rank_prev_heat')) {
        a[i].set({ 'time_flag' : true })
        a[j].set({ 'time_flag' : true })
      } else {
        a[j].set({ 'time_flag' : false })
      }
    }
  },

  //  -------------------------------------------------------------------------------------------
  //  Event Handlers -
  //  -------------------------------------------------------------------------------------------

  // updateFavoritesList():
  // NOTE: the event binder calls this function with this.settings as its scope, so we need only 
  // use this.get and not this.settings.get
  //
  updateFavoritesList: function(model){
    var arr    = this.get('FavoritesList')
    var person = model.get('id')

    // If the model is_tagged parameter is TRUE, push the model id onto the favourites list, 
    // otherwise remove it, then save the list
    if (model.get('is_tagged')) { arr.push(person) } else { arr = _(arr).without(person) }
    this.save({ 'FavoritesList' : arr })
  }
})

// Extend the ResultsList collection to include generic Ajax methods, specifically getJSON
_.extend(app.ResultsList.prototype, app.AjaxMixin)


//  -------------------------------------------------------------------------------------------
//  Mobile-specific methods
//  -------------------------------------------------------------------------------------------

app.ResultsList.mobile = {
  //
  // setDisplayValues(): Set the 'calculated_rank' and 'display_order' model properties
  // !important: This function requires the collection to have been sorted prior to invocation
  // !important: We define and use a new property 'calculated_rank' in preference to using the 
  // 'result_rank' property that is retrieved from eGroupware, because this 'result_rank' 
  // property is mutable. i.e. (specifically in the case of Lead, where we use the General Result 
  // to obtain the results on each qualification route) the 'result_rank' property can change as 
  // between rounds and so the result retrieved from eGroupware may not be that applicable for 
  // the round that's being looked at
  //
  setDisplayValues: function(){
    var a = this.models
    var l = this.length
    var i, j, cr

    // Iterate across the models setting rank and display ordering parameters
    for (i = 0, j = 1, a[0].set({ 'calculated_rank' : 1, 'display_order' : 1 }); j < l; i++, j++) {
      cr = (a[i].get('sort_value') === a[j].get('sort_value')) ? a[i].get('calculated_rank') : (j+1)
      a[j].set({ 'calculated_rank' : cr , 'display_order' : cr })
    }

    // Call setDisplayTime() to show time in (only for the Lead Final)
    if (this.LF) this.setDisplayTime()
  }
}

//  -------------------------------------------------------------------------------------------
//  Desktop-specific methods
//  -------------------------------------------------------------------------------------------

app.ResultsList.desktop = {
  //
  //  setDisplayValues(): override the setDisplayValues() function of the base (mobile) app.
  //  Specifically, we need to force a stable display order because of the 'paging' display 
  //  (this is not needed in the mobile app as all results are technically on display, though 
  //  not necessarily visible in the viewport). If the display order is not stable, then 
  //  results may be 'missed' or displayed twice (once pre-page and again post-page)
  //
  setDisplayValues: function(){
    var a = this.models
    var l = this.length
    var i, j, cr

    // Iterate across the models setting rank and display ordering parameters
    for (i = 0, j = 1, a[0].set({ 'calculated_rank' : 1, 'display_order' : 1 }); j < l; i++, j++) {
      cr = (a[i].get('sort_value') === a[j].get('sort_value')) ? a[i].get('calculated_rank') : (j+1)
      a[j].set({ 'calculated_rank' : cr , 'display_order' : j+1 })
    }

    // Call setDisplayTime() to show time in (only for the Lead Final)
    if (this.LF) this.setDisplayTime()
  }
}

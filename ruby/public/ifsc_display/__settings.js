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
//  AjaxMixin...
//  -----------------------------------------------------
//
//  Mixin to provide basic AJAX functionality required by appication objects
//
app.AjaxMixin = {
  url : '/results/route',  
  //  getJSON(url): Fetch a json response from the server, returning the JSON object within an 
  //  ES6-type Promise
  //  !important: As at 03/07/2014, Safari does not support the XMLHttpRequest.responseType = 
  //  "json" type (Chrome does). As a work-around, either (a) test for the type of the response 
  //  and return it, or call JSON.parse or (b) don't send a responseType and always call 
  //  JSON.parse on the returned string
  getJSON: function(query){
    // Construct the full url and append a timestamp to prevent the results caching
    var url = this.url + query + '&_=' + Date.now()

    // Fetch data from the server and resolve the Promise (or reject the Promise if the 
    // XMLHttpRequest fails)
    return new Promise(function(resolve, reject){
      var client  = new XMLHttpRequest()
      var handler = function(){
        if (this.readyState === this.DONE) {
          if (this.status === 200) {
            resolve(JSON.parse(this.response))
          } else { reject(this) }
        }
      }
      // Define and send the XMLHttpRequest
      client.open("GET", url)
      client.onreadystatechange = handler
      // client.responseType       = "json"
      client.setRequestHeader("Accept", "application/json")
      client.send()
    })
  }
}

//  -----------------------------------------------------
//  Settings...
//  -----------------------------------------------------
//
//  Settings model extending the Backbone.js 'Model' class
//  This model persists in localStorage the eGroupWare parameters for the results display and 
//  information about the preferred view state.
//
app.Settings = Backbone.Model.extend({

  // Set up a localStorage container
  localStorage : new Backbone.LocalStorage("app_settings"),

  // Set up default categories
  defaults : {
    Boulders    : [5,null,4,4],
    EGWCategory : {
      // Category codes for International (Senior) competitions
      "B" : { "m" : [6], "f" : [5] },
      "L" : { "m" : [1], "f" : [2] },
      "S" : { "m" : [23], "f" : [24] }
      // Category codes for Test competitions
        //"B" : { "m" : [63], "f" : [5] },
        //"L" : { "m" : [62], "f" : [2] },
        //"S" : { "m" : [64], "f" : [24] }
    }
  },

  //    Properties used to interrogate the eGroupware JSON Interface
  //    (str)WetId == EGWComp, (str)GrpId == EGWCategory, (str)route_order == EGWRound
  //
  //    Computed Properties
  //    ShowCategory:  The last viewed/selected category
  //    ShowFavorites:  Defines whether the default is to show all competitors or a list of 
  //    'favourites'
  //    FavoritesList:  The selected 'favourites'
  //
  initialize: function(attributes, options){
    // As we don't need the list of competitions to hold any kind of modifiable state, we don't 
    // need to save the list of comps to localStorage, so make this a direct property of the 
    // model rather than an attribute Likewise whether the app is mobile or desktop
    this.isFullScreenApp          = options.isFullScreenApp   || false
    this.competitionList          = options.competitionList   || []
    this.requestParameters        = options.requestParameters || { "disciplines" : [], "cat_id" : [] }
    // Fetch the model attributes from localStorage
    // this.fetch()

    // eGroupWare parameters:
    this.attributes.EGWComp       = this.attributes.EGWComp  || options.defaultCompetition.WetId
    this.attributes.EGWRound      = this.attributes.EGWRound || 2

    // display parameters
    this.attributes.FavoritesList = this.attributes.FavoritesList || options.FavoritesList
    // NOTE: Use a comp_type parameter to deal with multiple competition types
    // NOTE: Use a comp_rnds parameter to deal with competitions with different numbers of 
    // rounds
    this.attributes.comp_name     = this.attributes.comp_name || options.defaultCompetition.name
    this.attributes.comp_type     = this.attributes.comp_type || options.defaultCompetition.type
    this.attributes.comp_rnds     = this.attributes.comp_rnds || (options.defaultCompetition.rnds || 3)

    // NOTE: ShowCategory & ShowFavorites are === false by default unless read through fetch()
    // NOTE: Use a ShowAgeGroup parameter to deal with multiple age groups (e.g. Youth 
    // competitions)
    this.attributes.ShowCategory  = this.attributes.ShowCategory  || 0
    this.attributes.ShowFavorites = this.attributes.ShowFavorites || 0
    this.attributes.ShowAgeGroup  = this.attributes.ShowAgeGroup  || 0
  },

  //  fetchEGWCalendarData(): Fetch the competition calendar for the current year and create a 
  //  list of competitions for display
  //
  fetchEGWCalendarData: function(){
    var disps = this.requestParameters.disciplines
    var catID = this.requestParameters.cat_id.toString()
    var query = '?year=' + (new Date()).getFullYear() + '&filter[cat_id]=' + catID
    var parse = function(data){
      // window.console.log(data.competitions)
      _(disps).each(function(disp){
        var arr = this.parseCalendarData(data.competitions, disp)
        this.competitionList.push.apply(this.competitionList, arr)
      }.bind(this))
    }.bind(this)
    
    // If a competitionList was passed in, assume that we have a static list and just return a 
    // resolved promise, If no competitionList was passed, fire a getJSON request to get the 
    // calendar from eGroupware
    return (!this.competitionList.length) ? this.getJSON(query).then(parse) : Promise.resolve("Using Static List")
  },

  //  parseCalendarData(): Parse the calendar returned from eGroupware
  //  Underscore sure has an ugly chaining syntax...
  //  TODO: Override this for Junior competitions, as the number of rounds differs between _JWM 
  //  and _JEM/_JEC events
  //
  parseCalendarData: function(calendar, discipline){
    // Use the category ids defined in the EGWCategory attribute to find whether a competition 
    // includes the specified  discipline and then set the number of rounds in the competition 
    // (2 or 3)
    var testCatId = this.attributes.EGWCategory[discipline].m[0]
    var rounds    = (discipline === 'S') ? 2 : 3

    // Filter the list down to the selected discipline types, then reduce this down to the 
    // parameters required for rendering and lastly unwrap the underscore object
    return _.chain(calendar)
      .filter(function(comp){
        return _(comp.cats).some(function(cat){ return parseInt(cat.GrpId, 10) === testCatId })
      })
      .map(function(comp){
        var rgx  = /([a-z]{1,})([A-Z]{2,})/
        var str  = comp.short.replace(rgx, '$1 $2')
        var code = str + ' (' + (comp.host_nation || 'TBA') +')'
        return { "WetId" : comp.WetId, "type"  : discipline, "name"  : code, "rnds"  : rounds }
      })
      .value()
  },

  //  getCategories(): Return the category identifiers for the competition type (and if a youth 
  //  competition, the age group).
  //  NOTE: If not otherwise defined, this.attributes.ShowAgeGroup == 0
  //
  getCategories: function(){
    var cArr = this.attributes.EGWCategory[this.attributes.comp_type]
    var ages = this.attributes.ShowAgeGroup
    var cObj = {}

    cObj.male   = cArr.m[ages]
    cObj.female = cArr.f[ages]
    return cObj
  }
})

// Extend the Settings model to include generic Ajax methods
_.extend(app.Settings.prototype, app.AjaxMixin)


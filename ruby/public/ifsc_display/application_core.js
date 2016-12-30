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

// Module: Underscore extensions
// @codekit-prepend "./utilities.js"

// Module: Core Application code
// @codekit-prepend "./settings.js"
// @codekit-prepend "./settingsview.js"
// @codekit-prepend "./headerview.js"
// @codekit-prepend "./climberview.js"
// @codekit-prepend "./resultslist.js"
// @codekit-prepend "./resultslistview.js"
// @codekit-prepend "./resultslistview_animation_manager.js"
// @codekit-prepend "./resultslistview_drag_manager.js"

//	-----------------------------------------------------
//	SCOPE DECLARATIONS
//	-----------------------------------------------------
var app = app || {}


//  -----------------------------------------------------
//  Application Object...
//  -----------------------------------------------------
//
//  Wrap eveything in a singleton object
//
window.applicationObject = {

  //
  //  init() - Initialize the application object
  //  Create the a model to store application settings and the various application views
  //  Force disabling of ajax caches (IOS 6.x aggressively caches data)
  //
  init: function(idx, options){
    // Scale to the screen (where not handled by the browser automatically)
    this.scaleToScreen()

    // Initialise in order the settings model and then each of the application views:
    // 1) settingsView, accessing the application settings and containing the settings model
    // 2) headerView, controlling the application views/models -
    // 3) resultsView, displaying the results
    // Pass the settings model allowing them to (make and) respond to changes within without
    // application level event mediation.
    this.settings     = new app.Settings({ 'id' : idx }, options)

    this.settingsView = new app.SettingsView({ 'settings' : this.settings })
    this.headerView   = new app.HeaderView({ 'settings' : this.settings })
    this.resultsView  = new app.ResultsListView({ 'settings' : this.settings })

    // Handle events not handled within any individual view
    this.handleApplicationEvents()
  },

  //
  //  handleApplicationEvents(): Manage message passing for events that require an action in a 
  //  view other than that where they originated. Load new results (if required) and Hide/Show 
  //  the SettingsView following either (1) a swipe/double-tap in the ResultsListView; (2) based 
  //  on an action in either the SettingsView or HeaderView.
  //
  handleApplicationEvents: function(){
    // Handle events changing the view state of the SettingsView
    this.resultsView
      .on('appEvent:toggleSettingsView', this.toggleSettingsView, this)
    this.settingsView
      .on('appEvent:toggleSettingsView', this.toggleSettingsView, this)
    this.headerView
      .on('appEvent:toggleSettingsView', this.toggleSettingsView, this)
  },

  //
  //  toggleSettingsView(): Toggle the settingsView window and call 
  //  resultsView::initResultsListView if the comp ID,
  //  round or competition type (boulder/lead/speed) have been changed by a user input
  //
  toggleSettingsView: function(){
    // If any settings have changed, fetch new data from eGroupware
    var a = (this.resultsView.currentComp  !== this.settings.get('EGWComp'))
    var b = (this.resultsView.currentRound !== this.settings.get('EGWRound'))
    var c = (this.resultsView.currentCType !== this.settings.get('comp_type'))
    if (a || b || c) { this.resultsView.initResultsListView() }

    // Toggle the view state of the settingsView
    this.settingsView.toggleViewState()
  }
}

// Mobile Methods for applicationObject
//

window.applicationObject.mobile = {

//  scaleToScreen(): Dummy method - handle screen scaling using the viewport meta tag
//
  scaleToScreen: function(){}
}

// Desktop methods for applicationObject
//

window.applicationObject.desktop = {
//
//  scaleToScreen(): Sets the base font size for the document based on the reported screen 
//  height and width. Calculates the scaling factor as a % (rounded down to the nearest 
//  integer) of either the screen width or height. Use the minimum factor from height/width 
//  so as to fit the screen independent of its aspect ratio
//
  scaleToScreen: function(){
    var w = screen.width/724
    var h = screen.height/448
    var s = Math.min(w,h)
    var x = 5*Math.floor(20 * s) 

    document.documentElement.style.fontSize = x + '%'
  }
}

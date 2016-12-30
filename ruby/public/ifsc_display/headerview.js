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
//  HeaderView...
//  -----------------------------------------------------
//
//  Header view extending Backbone.js 'View' class
//  This is a simple view to trigger the interchange of views. It's pre-rendered & mainly acts by 
//  messaging the applicationObject. The view's methods toggle its visible state
//
app.HeaderView = Backbone.View.extend({
  events  : function(){
    return Modernizr.touch ?
    {
      'touchend span.icn'     : 'toggleSettingsView',
      'touchend span.cat'     : 'toggleShowCategory',
      'touchend span.fav'     : 'toggleShowFavorites',
    } :
    {
      'click span.icn'      : 'toggleSettingsView',
      'click span.cat'      : 'toggleShowCategory',
      'click span.fav'      : 'toggleShowFavorites',
    }
  },

  //
  //  toggleShowCategory(): Toggle the displayed category (and update the settings model 
  //  accordingly)
  //  NOTE: Requires an object, containing properties: 'showCategory' and 'showFavs'
  //
  initialize: function(options){
    // Init Properties
    this.settings      = options.settings
    this.showCategory  = this.settings.get('ShowCategory') ? 'm-tag' : 'f-tag'
    this.showFavorites = this.settings.get('ShowFavorites') ? 'icon-tag' : 'icon-tag-empty'

    // Init Events
    this.listenTo(this.settings, 'change:comp_name', this.setWindowTitle, this)

    // Init Render
    this.render()
  },

  //
  //  setWindowTitle(): Set the window title... Called by an event listener (see above in 
  //  initialize() when the selected competition is changed by a user input
  //
  setWindowTitle: function(){
    this.el.getElementsByClassName('cmp')[0].innerHTML = this.settings.get('comp_name')
  },

  template: _.template([
    "<span class='icn'></span>",
    "<span class='cmp'>{{comp_name}}</span>",
    "<span class='cat {{showCategory}}'></span>",
    "<span class='fav {{showFavorites}}'></span>"
  ].join('')),
  //
  //  render(): Render the header view
  //
  render: function(){
    var parent = document.getElementById('header')
    // Render the view template and append it to the DOM
    this.el.innerHTML = this.template({
      'comp_name'     : this.settings.get('comp_name'),
      'showCategory'  : this.showCategory,
      'showFavorites' : this.showFavorites
    })
    parent.insertBefore(this.el, parent.firstChild)
  },

  //
  //  toggleSettingsView(): Trigger an application level event to toggle the view state (the 
  //  event is caught at application level)
  //
  toggleSettingsView: function(){
    this.trigger('appEvent:toggleSettingsView')
  },

  //
  //  toggleShowCategory(): Toggle the displayed category (and update the settings model 
  //  accordingly)
  //
  toggleShowCategory: function(){
    var el = this.el.getElementsByClassName('cat')[0]
    var cat

    // toggle the icon 'button' between male & female states
    el.classList.toggle('m-tag')
    el.classList.toggle('f-tag')

    // Change the model state to reflect the selected display option
    cat = el.classList.contains('m-tag') ? 1 : 0
    this.settings.save({ 'ShowCategory' : cat })
  },

  //
  //  toggleShowFavorites(): Toggle the displayed climbers (all or favourites) and update the 
  //  settings model
  //
  toggleShowFavorites: function(){
    var el = this.el.getElementsByClassName('fav')[0]
    var fav

    // toggle the icon 'button' between active and inactive states
    el.classList.toggle('icon-tag')
    el.classList.toggle('icon-tag-empty')

    // Change the model state to reflect the selected display option
    fav = el.classList.contains('icon-tag') ? 1 : 0
    this.settings.save({ 'ShowFavorites' : fav })
  }
})

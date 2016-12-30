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
//  Climber...
//  -----------------------------------------------------
//
//  Climber model extending Backbone.js 'Model' class
//
app.Climber = Backbone.Model.extend({
  // Currently no common methods / properties
})

//  -----------------------------------------------------
//  ClimberView...
//  -----------------------------------------------------
//
//  Climber view extending Backbone.js 'View' class
//
app.ClimberView = Backbone.View.extend({
  tagName   : 'li',
  className : 'ntg',

  //
  //  initialize(): Trigger the view's update method if the associated model is changed
  //  NOTE: The association between model & view is made in the superview's initialize method
  //
  initialize: function(){
    // Bind the ::update function to any change in the related model.
    this.listenTo(this.model, 'change', this.update, this)

    // Finish initialization by rendering and updating the view from the relevant model data
    this.render()
    this.update()
  },

  //
  //  close(): Safely remove the window, GC references to the view
  //
  close: function(){
    // Remove all local event bindings - no effect in this instance as there are none
    // !important - Remove the view from the DOM and remove any bound model events
    this.unbind()
    this.remove()

    // Delete in-memory references to the el, see
    // http://andrewhenderson.me/tutorial/backbone-memory-leaks-zombie-views/
    // But not sure how important these are...
    ;delete this.el
  }
})

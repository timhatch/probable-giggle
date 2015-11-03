/* MVC style coding for a dynamic presentation of bouldering results
* Copyright 2015, Tim Hatch
* Dual licensed under the MIT or GPL Version 2 licenses.
*/

/**********************************************************
* CODEKIT DECLARATIONS
**********************************************************/
/*global Backbone */
/*global _        */
/*global App      */

/*
* Use Mustache-style for Underscore templates
*/
_.templateSettings = {
  evaluate  : /\{\[([\s\S]+?)\]\}/g,
  interpolate : /\{\{([\s\S]+?)\}\}/g
};

window.App = window.App || {}

/**********************************************************
* Climber model extending Backbone.js 'Model' class
**********************************************************/

App.Climber = Backbone.Model.extend({ /* No customisation */ })

/**********************************************************
* Climber view extending Backbone.js 'View' class
**********************************************************/

App.ClimberView = Backbone.View.extend({
  tagName       : 'li',

  /*
  * initialize(): Trigger the view's update method if the associated model is changed
  */
  initialize: function(){
    this.listenTo(this.model, 'change', this.update, this)
  },

  /*
  * render(): Render a view when the associated model is first loaded.
  */
  render: function(){
    // Render the underscore template
    var templateFunc  = _.template(document.getElementById('climber_template').textContent)
    this.el.innerHTML = templateFunc({
      name   : this.model.get('name'),
      code   : this.model.get('category').toUpperCase(),
      points : this.model.get('points'),
      bonus  : this.model.get('bonus'),
      rank   : this.model.get('rank') || this.model.get('perid')
    })

    // Add a class to denote the category (used by $.isotope for filtering)
    // Set the data::rankorder property so that we can sort the superview when it is rendered
    this.el.querySelector('.rank').classList.add(this.model.get('category'))
    this.$el.data('rankorder', this.model.get('rank'))
    return this;
  },

  /*
  * update(): Update the view when the associated model is updated
  */
  update: function(){

    // Update the aggegrate results
    this.el.querySelector('.pts').textContent  = this.model.get('points')
    this.el.querySelector('.bns').textContent  = this.model.get('bonus')
    this.el.querySelector('.rank').textContent = this.model.get('rank')

    // Update the view's data properties
    this.$el.data('rankorder', this.model.get('rank'))
  }
})

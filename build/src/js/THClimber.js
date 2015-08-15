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
  * The underscore _.template method is used to interpret the actual template (in the DOM) 
  * and will layout 5 sub-elements to show results on each bloc.
  *
  * Pass in the EGW Category for the relevant model
  */
  render: function(){

    // Render the underscore template
    var tmpl = $('#climber_template').text(),
      str = _.template(tmpl, {
        name   : _.titleize(this.model.get('name')),
        code   : this.model.get('category').toUpperCase(),
        points : this.model.get('points'),
        bonus  : this.model.get('bonus'),
        rank   : this.model.get('rank') || this.model.get('perid')
      })

    this.$el.html(str);

    // Add a class to denote the category (used by $.isotope for filtering)
    // Set the data::rankorder property so that we can sort the superview when it is rendered
    this.$('.rank').addClass(this.model.get('category'))
    this.$el.data('rankorder', this.model.get('rank'))

    // Return
    return this;
  },

  /*
  * update(): Update the view when the associated model is updated
  */
  update: function(){

    // Update the aggegrate results
    this.$('.pts').text(this.model.get('points'))
    this.$('.bns').text(this.model.get('bonus'))
    this.$('.rank').text(this.model.get('rank'))

    // Update the view's data properties
    this.$el.data('rankorder', this.model.get('rank'))
  }
})

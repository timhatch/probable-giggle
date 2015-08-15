/* MVC style coding for a dynamic presentation of bouldering results
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
* MODELS
*
***********************************/

/*
* Climber model extending Backbone.js 'Model' class
*/
App.Climber = Backbone.Model.extend({
  /*
  * Properties used from eGroupware JSON Interface
  * (str)start_order, (str)PerId                -> init & set by collection::load()
  * (str)lastname, (str)nation (str)rank_prev_heat      -> init & set by collection::load()
  *
  * Computed Properties
  */

  /* getResults()
  * Return the top/bonus data as an array for sorting
  */
  getResults: function(){
    var arr = [];
    arr[0] = -this.attributes.points        // negative data gives a descending sort
    arr[1] = -this.attributes.bonus         // positive data an ascending sort
    arr[2] = -this.attributes.id
    return arr;
  }
});

/***********************************
*
* VIEWS
*
***********************************/

/*
* Climber view extending Backbone.js 'View' class
*/
App.ClimberView = Backbone.View.extend({
  tagName       : 'li',

  /*
  * initialize(): Trigger the view's update method if the associated model is changed
  * NOTE: The association between model & view is made in the superview's initialize method
  *
  */
  initialize: function(){
    // Bind the ::update function to any change in the related model.
    this.listenTo(this.model, 'change', this.update, this)
  },

  /*
  * render(): Render a view when the associated model is first loaded.
  * The underscore _.template method is used to interpret the actual template (in the DOM) and will layout 5 sub-elements to show results on each bloc.
  *
  * Pass in the EGW Category for the relevant model
  *
  */
  render: function(){

    // Render the underscore template
    var tmpl= $('#climber_template').text(),
      str = _.template(tmpl, {
      rank  : this.model.get('rank') || 1,
      name  : _.titleize(this.model.get('name')),
      code  : this.model.get('category').toUpperCase(),
      points  : this.model.get('points'),
      bonus : this.model.get('bonus')
    });

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
  *
  */
  update: function(){

    var syntheticRank = parseInt(100*this.model.get('points'), 10) + parseInt(this.model.get('bonus'),10)
    this.$el.data('rankorder', -syntheticRank)

    // Update the displayed rank & the rankorder data element used by the isotope sort function
    this.$('.rank').text(this.model.get('rank'))

    // Update the aggegrate results
    this.$('.pts').text(this.model.get('points'))
    this.$('.bns').text(this.model.get('bonus'))
  }
});
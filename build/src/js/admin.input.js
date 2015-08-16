/***********************************
* CODEKIT DECLARATIONS
***********************************/

/*global Backbone */
/*global _        */
/*global App      */

// Use a Mustache syntax within underscore's templating mechanism
_.templateSettings = {
  evaluate : /\{\[([\s\S]+?)\]\}/g,
  interpolate : /\{\{([\s\S]+?)\}\}/g
}

window.App = window.App || {}

/**********************************************************
* Boulder model extending Backbone.js 'Model' class
**********************************************************/

App.Bloc = Backbone.Model.extend({
  /* Inherited properties */
  resmx   : [10, 7, 4, 1, 0],
  defaults: {
    state : 4,          // check state
    score : 0,
    bonus : 0
  },

  /*
  * Set the score and bonus attributes
  */
  setResult: function(i){
    i = parseInt(i,10)
    this.attributes.score = (i < 3) ? this.resmx[i] : 0
    this.attributes.bonus = (i < 4) ? 1 : 0

    this.set({"state" : i})
  }
})

/**********************************************************
* Boulder view extending Backbone.js 'View' class
**********************************************************/

App.BlocView = Backbone.View.extend({
  tagName   : "div",
  className : "tile",
  model     : App.Bloc,
  events    : {
    // "click  input[type=radio]" : "updateFromRdio",
    "change input[type=text]"  : "updateFromText" 
  },

  /*
  * initialize(): Bind the change event of this.model to this.update()
  */  
  initialize: function(){
    this.listenTo(this.model, 'change', this.update, this)
  },

  /*
  * Render the view from its template
  */
  render: function(){
    this.el.innerHTML = _.template(document.getElementById('boulder_tmpl').textContent, 
    { id : this.model.get('id') })
    
    // Create a reference to the data entry and status indicator elements
    this.textCell = this.el.querySelector('input[type="text"]')
    this.nodeList = this.el.getElementsByClassName('flag')
    
    this.update()
    return this
  },

  /*
  * updateFromText() : Update the score from data entered using the keyboard
  */
  updateFromText: function(){
    // Get the value of the textfield and set the model 'state'
    var $el     = this.$el.find(':text'),
      text      = $el.val(),
      new_state = (!text) ? 4 : _(this.model.resmx).indexOf(parseInt(text,10))

    // Strip out any '0's & flag invalid inputs & set the state so that they're ignored for the 
    // purposes of calculating the score
    if (text == '0') $el.val('')
    if (new_state > -1) { $el.removeClass('error') } else { $el.addClass('error'); new_state = 4 }

    // Update the model
    this.model.setResult(new_state)
  },

  /*
  * Synchronise the view and model states
  */
  update: function(){
    var i = this.model.get("state"),
        j = (i < 4) ? this.model.resmx[i] : null

    // sync the text and radio states
     this.textCell.value = j
    
    _(this.nodeList).each(function(el){
      el.classList.remove('noerror')
      el.classList.remove('error')
    })
    switch (i) {
    case 4:
      window.console.log('do nothing')
      break;
    case 3:
      this.nodeList[i].classList.add('error')
      break;
    default:
      this.nodeList[i].classList.add('noerror')
    }
  }
})


/**********************************************************
* Collection of boulder models
**********************************************************/
/* Model Collection */
App.Result = Backbone.Collection.extend({
  identity  : {
    "PerId"   : null,
    "name"    :"name",
    "code"    : null,
    "category"  :"m"
  },
  score   : 0,
  bonus   : 0,
  model   : App.Bloc,

  /*
  * Instantiate a collection of models
  */
  initialize: function(){
    // Bind change events (bubbled up from any change to a model) to this.setResult()
    this.on('change', this.setResult, this)
  },

  /*
  * Populate the collection
  */
  populate: function(n){
    while (n) { this.add(new App.Bloc({ "id" : 'b'+n })); n-- }
    return this
  },

  /*
  * Get Collection data from the server
  */
  load: function(text){
    var self =  this
    $.getJSON("./scripts/get.php", {"PerId" : text}, function(data){
      // Update the collection identity data
      self.identity = data.identity
      // Trigger a specific change to deal with only the identity changing
      self.trigger('change:title') 
      // Update the models (no change event will be fired if the data isn't actually changed)
      _(self.models).each(function(model){
        var i = model.get('id')
        model.setResult(data.results[i])
      })
    })
  },

  /*
  * Set the aggregate result
  */
  setResult: function(){
    this.score = this.bonus = 0
    _(this.models).each(function(model){
      this.score += model.get("score")
      this.bonus += model.get("bonus")
    }, this)
  },

  /*
  * Post Results to server
  */
  post: function(){
    $.post("./scripts/post.php", {
        "PerId" : this.identity.PerId,
        "models": JSON.stringify(this)
      }, function(data){
      /* as a test, write-back the data received at the server */
      window.console.log(data)
    })
  }
})

/**********************************************************
  App container
**********************************************************/

App.MainView = Backbone.View.extend({
  el      : $('#inner'),
  events    : {
    "blur     #PerId"  : "handleTabEvent",
    "keypress #PerId"  : "handleKeyPress",
    "click    #submit" : "postResult"
  },
  blocs   : 30,

  /*
  * Initialize() : Init the view
  */
  initialize: function(options){
    var n = options.blocs || this.blocs,
      el  = document.getElementById('tiles'), 
      view

    // Bootstrap the collection's models & create the relevant views
    this.collection = new App.Result()
    this.collection.populate(n).each(function(model){
      view = new App.BlocView({ "model": model })
      el.insertBefore(view.render().el, el.firstChild)
    })
    
    // Cache a reference to the PerId cell
    this.PerId = document.getElementById('PerId')
    
    // Bind the change and change:title event of this.collection to this.update()
    this.listenTo(this.collection, 'change', this.update, this)
    this.listenTo(this.collection, 'change:title', this.update, this)
  },

  /*
  * handleKeyPress() & handleTabEvent()
  * Respond only when the ENTER key is pressed or when the user tabs out of the cell
  */
  handleKeyPress: function(e){ if (e.keyCode === 13) this.handleTabEvent() },
  handleTabEvent: function(){ if (!!this.PerId.value) this.collection.load(this.PerId.value) },

  /*
  * Respond to a submit event by calling the relevant collection function
  */
  postResult: function(){ this.collection.post() },

  /*
  * Update the Identity display
  */
  update: function(){
    // Update the identity data - NOTE: May wish to separate this into a different function
    document.getElementById("name").textContent = this.collection.identity.name
    document.getElementById("ctgy").textContent = this.collection.identity.category.toUpperCase()
    // Update the results field
    document.getElementById("rslt").textContent = this.collection.score+'.'+this.collection.bonus
  }
})
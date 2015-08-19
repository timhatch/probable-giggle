/***********************************
* CODEKIT DECLARATIONS
***********************************/

/* global _        */
/* global Backbone */
/* global App      */
/* global Promise  */

/* @codekit-prepend "promise-1.0.0.min.js" */

// Use a Mustache syntax within underscore's templating mechanism
_.templateSettings = {
  evaluate : /\{\[([\s\S]+?)\]\}/g,
  interpolate : /\{\{([\s\S]+?)\}\}/g
}

window.App = window.App || {}
Backbone.View = Backbone.NativeView
App.AjaxMixin = {
  /*
  * ajaxRequest(): Really simple Promises A inclined XMLHttpRequest
  * Parameters:
  *   type = 'GET' or 'POST'.
  *   url  = The url target. For 'GET' requests this includes any query parameters. For 
  *   'POST' requests it will be the base url only.
  *   data = (not used for 'GET' requests) the data to be 'posted'.
  * Example:
  *   GET request:  this.ajaxRequest('GET', url)
  *   POST request: this.ajaxRequest('POST', url, data)
  *
  * NOTE: This function will not respect redirects
  * NOTE: Requires that the server-script returns a JSON-encoded response
  */
  ajaxRequest: function(type, url, data){

    return new Promise(function(resolve, reject){
      var client  = new XMLHttpRequest(),
      handler = function(){
        if (this.readyState === this.DONE) {
          if (this.status === 200) {
            resolve(JSON.parse(this.response))
          } else {
            reject(this)
          }
        }
      }

    client.open(type, url)
    client.onreadystatechange = handler
    client.setRequestHeader('Accept', 'application/json')
    if (type === 'POST') {
      client.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
    }
    client.send(data)
    })
  }
}

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
  tagName   : 'div',
  className : 'tile',
  model     : App.Bloc,
  events    : {
    // "click  input[type=radio]" : "updateFromRdio",
    "change input[type=text]"  : 'updateFromText'
  },

  /*
  * initialize(): Bind the change event of this.model to this.update()
  */
  initialize: function(){ this.listenTo(this.model, 'change', this.update, this) },

  /*
  * Render the view from its template
  */
  render: function(){
    var templateFunc  = _.template(document.getElementById('boulder_tmpl').textContent)
    this.el.innerHTML = templateFunc({ id : this.model.get('id') })

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
    var el = this.textCell,
      text = el.value,
      new_state = (!text) ? 4 : _(this.model.resmx).indexOf(parseInt(text,10))

    // Strip out any '0's,  flag invalid inputs & set the state so that they're ignored for the
    // purposes of calculating the score
    if (text === '0') el.value = ''
    if (new_state > -1) { el.classList.remove('error') }
    else { el.classList.add('error'); new_state = 4 }

    // Update the model
    this.model.setResult(new_state)
  },

  /*
  * Synchronise the view and model states
  */
  update: function(){
    var i = this.model.get('state'),
      j = (i < 4) ? this.model.resmx[i] : null

    // sync the text and radio states
     this.textCell.value = j

    _(this.nodeList).each(function(el){ el.classList.remove('noerror', 'error') })
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
    "name"    :'name',
    "code"    : null,
    "category":'m'
  },
  score   : 0,
  bonus   : 0,
  model   : App.Bloc,

  /*
  * Instantiate a collection of models
  * Bind change events (bubbled up from any change to a model) to this.setResult()
  */
  initialize: function(){ this.on('change', this.setResult, this) },

  /*
  * Populate the collection
  */
  populate: function(n){
    while (n) { this.add(new App.Bloc({ "id": 'b'+n })); n-- }
    return this
  },

  /*
  * Get Collection data from the server
  */
  load: function(text){
    var self =  this,
        url  = './scripts/get.php?PerId='+text

    this.ajaxRequest('GET', url)
    .then(function(data){
      self._setIdentity(data.identity)
      self._resetModels(data.results)
    })
    .catch(function(err){ window.console.log(err) })
  },

  _setIdentity: function(identity){
    this.identity = identity
    this.trigger('change:title')
  },
  _resetModels: function(results){
    _(this.models).each(function(model){
      model.setResult(results[model.get('id')])
    })
  },

  /*
  * Set the aggregate result
  */
  setResult: function(){
    this.score = this.bonus = 0
    _(this.models).each(function(model){
      this.score += model.get('score')
      this.bonus += model.get('bonus')
    }, this)
  }
})
_.extend(App.Result.prototype, App.AjaxMixin)
/**********************************************************
  App container
**********************************************************/

App.MainView = Backbone.View.extend({
  el     : document.getElementById('inner'),
  events : {
    "change input#perid"   : 'handleTabEvent',
    // "keypress input#perid"    : 'handleKeyPress',
    "click  button#submit" : 'postResult'
  },
  blocs  : 30,

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
      view = new App.BlocView({ 'model': model })
      el.insertBefore(view.render().el, el.firstChild)
    })
        
    // Cache a reference to the PerId cell
    this.perEl = document.getElementById('perid')

    // Bind the change and change:title event of this.collection to this.update()
    this.listenTo(this.collection, 'change', this.update, this)
    this.listenTo(this.collection, 'change:title', this.update, this)
  },

  /*
  * handleKeyPress() & handleTabEvent()
  * Respond only when the ENTER key is pressed or when the user tabs out of the cell
  */
  // handleKeyPress: function(e){ if (e.keyCode === 13) this.handleTabEvent() },
  handleTabEvent: function(){ if (!!this.perEl.value) this.collection.load(this.perEl.value) },

  /*
  * Respond to a submit event by calling the relevant collection function
  */
  postResult: function(){
    var query = 'PerId='+this.perEl.value+'&models='+JSON.stringify(this.collection)
    this.collection.ajaxRequest('POST', './scripts/post.php', query)
    .then(function(response){ window.console.log(JSON.stringify(response)) })
  },

  /*
  * Update the Identity display
  */
  update: function(){
    // Update the identity data 
    document.getElementById('name').textContent  = this.collection.identity.name
    document.getElementById('grpid').textContent = this.collection.identity.category.toUpperCase()
    // Update the results field
    document.getElementById('result').textContent = this.collection.score+'.'+this.collection.bonus
  }
})
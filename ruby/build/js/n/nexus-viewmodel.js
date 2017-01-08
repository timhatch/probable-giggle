//  -----------------------------------------------------
//  CODEKIT DECLARATIONS
//  -----------------------------------------------------
/*global m                                            */
/*global mx                                           */

var App = App || {};

App.sessionStorage   = mx.storage( 'session' , mx.SESSION_STORAGE )

App.ViewModel = function(comp){ 
  var sessiondata = App.sessionStorage.get('n-appstate')
  if (!sessiondata) {
    sessiondata = { wet_id : comp, route : null, grp_id : null, blc_nr : null, State : false }
    App.sessionStorage.set('n-appstate', sessiondata)
  }
  window.console.log(sessiondata)

  return {
    connection  : m.prop(true),
    model       : App.PersonResult,
    ss          : sessiondata,
    
    // View-Model parameters and functions derived from the model
    start_order : null,
    fullname    : null, 
    result      : { a: null, b: null, t: null },
    key         : function(){ return 'p'+ String(parseInt(this.ss.blc_nr, 10)) },
    
    // setValue allows a result attribute to be set only once, i.e.
    // if the existing value is null (or zero), set the value of the attribute to
    // equal the current number of attempts.
    // If the attribute in question is a "top" and no "bonus" has been recorded, then
    // automatically set the bonus as well
    //
    setValue: function(attr){
      if (!this.result[attr]) {
        this.result[attr] = this.result.a
        if (attr === 't' && !this.result.b) {
          this.result.b = this.result.a
        }
      }
    },

    // clearValue() unsets any existing data 
    clearValue: function(attr){
      if (!!this.result[attr]) this.result[attr] = null
    },
  
    // Construct query parameters from stored data on the competition, round and group
    // plus the provided start_order
    mergeParams: function(query){
      var rounds = {"QA":0, "QB":1,"S":2,"F":3,"SF":4}
      var groups = {"M":6,"F":5,"MJ":84,"FJ":81,"MA":82,"FA":79,"MB":83,"FB":80,"TM":63,"TF":284}
      return Object.assign({
        wet_id : parseInt(this.ss.wet_id, 10),
        route  : rounds[this.ss.route],
        grp_id : groups[this.ss.grp_id]
      }, query)
    },
    
    // Fetch a model from the server
    // If the model doesn't exist (e.g. we've entered an ineligible startnumber)
    // theh reset the model and only otherwise process the data
    fetch: function(val){
      this.start_order = parseInt(val, 10)
      this.model.fetch(this.mergeParams({ start_order: this.start_order }))
      .then(function(){
        try {
          if (!this.model.data) { this.reset() } 
          else {
            this.result   = this.model.data.result_jsonb[this.key()] || { a: null, b: null, t: null }
            this.fullname = this.model.data.lastname+', '+this.model.data.firstname
          }
        }
        catch (err) { window.console.log(err) }
      }.bind(this))
      .then(function(){ this.connection(true) }.bind(this))
      .then(null, function(){ this.connection(false) }.bind(this))      
    },
    
    // Save data back to the server
    save: function(){
      var params
      // Prevent a save occuring if no viewmodel has been instantiated
      if (!this.start_order) return
      // Create the parameters to save back to the server
      // TODO: Computed property names (ESNext) breaks Uglify.js
      // Can fix, e.g. var o = {}; o[key] = this.result
      params = this.mergeParams({
        per_id      : this.model.data.per_id,
        result_jsonb: { [this.key()] : this.result }
      });
      // Send the data back
      this.model.save(params) 
      .then(function(){ this.connection(true) }.bind(this))
      .then(null, function(){ this.connection(false) }.bind(this))
    },
    
    // Reset the viewmodel
    reset: function(){
      this.start_order = null
      this.fullname    = null 
      this.result      = { a: null, b: null, t: null }
      
      this.model.data = {}
    }
  }
};

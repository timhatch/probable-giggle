//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */
/*global mx                                           */

var App = App || {};

App.sessionStorage   = mx.storage( 'session' , mx.SESSION_STORAGE )

App.VM = function(sessiondata){  
  return {
    connection  : m.prop(true),
    model       : App.PersonResult,
    ss          : sessiondata,
    
    // View-Model parameters and functions derived from the this.model
    //
    start_order : null,
    fullname    : null, 
    result      : {a: null,b: null,t: null},
    
    // Set or unset results
    
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
    composeURLParams: function(query){
      var rounds = {"QA":0, "QB":1,"S":2,"F":3,"SF":4}
        , groups = {"M":6,"F":5,"MJ":84,"FJ":81,"MA":82,"FA":79,"MB":83,"FB":80,"TM":63, "TF":284}
        , params = {
            wet_id     : parseInt(sessiondata.WetId, 10),
            route      : rounds[sessiondata.Route],
            grp_id     : groups[sessiondata.GrpId]
        }
      
      return Object.assign(params, query) 
    },
    
    fetch: function(val){
      var params  = this.composeURLParams({ start_order: parseInt(val, 10) || 1 })
      
      this.model.fetch(params)
      .then(function(){
        try {
          // If the model doesn't exist (e.g. we've entered an ineligible startnumber)
          // theh reset the model and only otherwise process the data
          if (!this.model.data) { this.reset() } 
          else {
            var key          = 'p' + String(parseInt(this.ss.BlcNr, 10))
            this.result      = this.model.data.result_jsonb[key] || { a: null, b: null, t: null }
            this.start_order = this.model.data.start_order
            this.fullname    = this.model.data.lastname+', '+this.model.data.firstname
          }
        }
        catch (err) { window.console.log(err) }
      }.bind(this))
      .then(function(){ this.connection(true) }.bind(this))
      .then(null, function(){ this.connection(false) }.bind(this))      
    },
  
    save: function(){
      var params = this.composeURLParams({ per_id: this.model.data.per_id })
      var key    = 'p' + String(parseInt(sessiondata.BlcNr, 10))
      
      // Prevent a save occuring if no viewmodel has been instantiated
      if (!this.start_order) return
      
      // Update the PersonModel
      this.model.data.result_jsonb[key] = this.result
      params.result_jsonb               = { [key] : this.result }
      
      this.model.save(params) 
      .then(function(){ this.connection(true) }.bind(this))
      .then(null, function(){ this.connection(false) }.bind(this))
    },
    
    reset: function(){
      this.start_order = null
      this.fullname    = null 
      this.result      = {a: null,b: null,t: null}
      
      this.model.data = {}
    }
  }
};

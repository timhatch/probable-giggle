//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */
/*global mx                                           */

var App = App || {};

App.VM = function(model, sessiondata){  
  return {
    model       : model,
    ss          : sessiondata,
    // View-Model parameters and functions derived from the model
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
    composeURLParams: function(val){
      var rounds = {"QA":0, "QB":1,"S":2,"F":3,"SF":4}
        , groups = {"M":6,"F":5,"MJ":84,"FJ":81,"MA":82,"FA":79,"MB":83,"FB":80}

      return {
        wet_id     : parseInt(sessiondata.WetId, 10),
        route      : rounds[sessiondata.Route],
        grp_id     : groups[sessiondata.GrpId],
        start_order: parseInt(val, 10) || 1          
      }
    },
    
    fetch: function(val){
      var params  = this.composeURLParams(val)
        , promise = model.fetch(params)
    
      promise.then(function(){
        try {
          var key          = 'p' + String(parseInt(sessiondata.BlcNr, 10))
          this.result      = model.data.result_jsonb[key] || {a: null,b: null,t: null}
          this.start_order = model.data.start_order
          this.fullname    = model.data.lastname+', '+model.data.firstname 
        }
        catch (err) { window.console.log(err) }
      }.bind(this))
      .then(function(){ App.connectionStatus(true) })
      .then(null, function(){ App.connectionStatus(false) })      
    },
  
    save: function(){
      var promise, key = 'p' + String(parseInt(sessiondata.BlcNr, 10))
      
      model.data.result_jsonb[key] = this.result
      
    //  // TODO: Add code here to save the model (if it has changed, in particular setting "b0")

    //  // Prevent a save occuring if no viewmodel has been instantiated
      if (!this.start_order) return

    //  // Otherwise save any results data
       promise = model.save()
    //  promise
    //  .then(function(){ App.connectionStatus(true) })
    //  .then(null, function(){ App.connectionStatus(false) })
    },
    
    reset: function(){
      this.start_order = null
      this.fullname    = null 
      this.result      = {a: null,b: null,t: null}
      
      model.data = {}
    }
  }
};

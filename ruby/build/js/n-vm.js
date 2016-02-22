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
    
    setResult: function(attr){
      if (!this.result[attr]) {
        this.result[attr] = this.result.a
        if (attr === 't' && !this.result.b) this.result.b = this.result.a
      }
    },
  
    resetValues: function(attr){
      if (attr === 'a') return
      // Not sure the if test is needed?
      if (!!this.result[attr]) this.result[attr] = 0
    },
  
    // Construct query parameters from stored data on the competition, round and group
    // plus the provided start_order
    composeURLParams: function(val){
      var rounds = {"Q":0,"S":2,"F":3}
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
          this.result      = model.data.result_json[key] || {a: null,b: null,t: null}
          this.start_order = model.data.start_order
          this.fullname    = model.data.lastname+', '+model.data.firstname 
        }
        catch (err) { window.console.log(err) }
      }.bind(this))
      .then(function(){ App.connectionStatus(true) })
      .then(null, function(){ App.connectionStatus(false) })      
    },
  
    serialiseResults: function(){
      var key = 'p' + String(parseInt(sessiondata.BlcNr, 10))
        , obj = {}, str = ''
       
      for (var prop in this.result) {
        if (this.result[prop] !== null) str += (prop+this.result[prop])
      }
      window.console.log(str)
      obj[key] = str
      return JSON.stringify(obj)
    },

    save: function(){
      var key = 'p' + String(parseInt(sessiondata.BlcNr, 10))
      model.data.result_json[key] = this.result
      
      // TODO: Add code here to save the model (if it has changed, in particular setting "b0")
      var json    = this.serialiseResults()
        , promise

      // Prevent a save occuring if no viewmodel has been instantiated
      if (!this.start_order) return

      // Otherwise save any results data
      promise = model.save(json)
      promise
      .then(function(){ App.connectionStatus(true) })
      .then(null, function(){ App.connectionStatus(false) })
    },
    
    reset: function(){
      this.start_order = null
      this.fullname    = null 
      this.result      = {a: null,b: null,t: null}
      
      model.data = {}
    }
  }
};
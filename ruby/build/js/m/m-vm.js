//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/* global m                                            */

var App = App || {}

App.VM = function(model, sessiondata){
  return {
    model       : model,
    ss          : sessiondata,
    // View-Model parameters and functions derived from the model
    //
    start_order : null, 
    fullname    : null, 
    result      : null,

    sumResults: function(){
      window.console.log("sumResults called")
      var x = 0, y = 0, xa = 0
        , results = model.data.result_json
      for (var prop in results){
        if (results[prop].t) { x += 13; xa += (3 * results[prop].t) }
        if (results[prop].t || results[prop].b) { y  += 1 }  
      }
      this.result = (x - xa) + " b"+y
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
        start_order: parseInt(val, 10)
      }
    },
//    fetch: function(val){ window.console.log('called fetch') },
    fetch: function(val){
      if (val === null) return 
      this.reset()
        
      var params  = this.composeURLParams(val)
        , promise = model.fetch(params)
    
      promise
        .then(function(){
          try { 
            this.start_order = model.data.start_order
            this.fullname    = model.data.lastname+', '+model.data.firstname
            this.sumResults()
          } 
          catch (err) { this.reset() }      
        }.bind(this))
        .then(function(){ App.connectionStatus(true) })
        .then(null, function(){ App.connectionStatus(false) })
    },
  
    reset: function(){
      this.start_order  = null
      this.fullname     = null
      this.result       = null
      this.model.data   = { result_json: {} }
      this.model.params = { wet_id: 999 }
    }
  }
}

//for (var attrname in obj2) { obj1[attrname] = obj2[attrname]; }
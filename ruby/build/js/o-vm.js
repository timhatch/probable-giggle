//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/* global m                                            */

var App = App || {}

App.VM = function(model, sessiondata){
  return {
    ss          : sessiondata,
    rd          : model,
    // View-Model parameters and functions derived from the model
    //
    params      : {},
    // Construct query parameters from stored data on the competition, round and group
    // plus the provided start_order
    composeURLParams: function(val){
      var rounds = {"Q":0,"S":2,"F":3}
        , groups = {"M":6,"F":5,"MJ":84,"FJ":81,"MA":82,"FA":79,"MB":83,"FB":80}

      return {
        wet_id : parseInt(sessiondata.WetId, 10) || 0,
        route  : rounds[sessiondata.Route] || 0,
        grp_id : groups[sessiondata.GrpId] || 1
      }
    },

    //
    //
    fetch: function(val){
      //this.reset()
      var params  = this.composeURLParams(val)
        , promise = this.rd.fetch(params)
    
      promise
        .then(function(){ App.connectionStatus(true) })
        .then(null, function(){ App.connectionStatus(false) })
    },
  
    reset: function(){
//      window.console.log('reset called')
//      this.start_order = null
//      this.fullname    = null
//      this.result      = null
//      
//      model.data = {}
//      this.resArray.forEach(function(boulder){
//        boulder.result = {a:null,b:null,c:null}
//        boulder.displayResult = ''
//        boulder.resultString  = null
//      })
    }
  }
}
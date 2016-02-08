//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/* global m                                            */

var App = App || {}

App.VM = function(routedata, sessiondata){
  return {
    ss          : sessiondata,
    rd          : routedata,
    // View-Model parameters and functions derived from the model
    //
    params      : {},
    resArray    : [],
    
    sumResults: function(){},
        
    parseModelData: function(obj){
      window.console.log(obj.params)
      obj.data.forEach(function(person){
        var result = new App.PersonResult(person.start_order)

        person.result_json = result.objectifyResults(person.result_json)

        result.data        = person
        result.params      = Object.assign({start_order: result.data.start_order}, obj.params)
        this.resArray.push(result)
      }.bind(this))
      //
      // NOTE DEBUGGING
      window.console.log(this.resArray)
    },
  
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
        .then(function(){
          try { this.parseModelData(this.rd) } 
          catch (err) { window.console.log(err) }      
        }.bind(this))
        .then(function(){ App.connectionStatus(true) })
        .then(null, function(){ App.connectionStatus(false) })
    },
  
    serialiseResults: function(){
//      var tmp = {}
//      this.resArray
//        .filter(function(res){ return res.result.a !== null })
//        .forEach(function(res){ tmp[res.id] = res.resultString })
//      return JSON.stringify(tmp)
    },

    save: function(){
      var obj = []
        , promise
      
      obj = this.resArray.map(function(result){
        return {
          start_order: result.data.start_order,
          result_json: JSON.stringify(result.stringifyResults(result.data.result_json))
        }
      })
      
//      window.console.log(obj)
      
//      var json = this.serialiseResults()
//        , promise
//
//      // Prevent a save occuring if no viewmodel has been instantiated
//      if (!this.start_order) return
//
      promise = routedata.save(obj)
      promise
        .then(function(){ App.connectionStatus(true) })
        .then(null, function(){ App.connectionStatus(false) })
    },
  
    saveAll: function(){},
  
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
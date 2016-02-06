//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/* global m                                            */

var App = App || {}

App.VM = function(model, sessiondata){
  return {
    ss          : sessiondata,
    // View-Model parameters and functions derived from the model
    //
    start_order : null, 
    fullname    : null, 
    result      : null,          

    resArray    : (function(){
      for (var i = 1, a = []; i <= 30; i++) { a.push(new App.BoulderResultVM(i)) }
      return a
    })(),

    sumResults: function(){
      var x = 0, y = 0, xa = 0
      this.resArray.forEach(function(boulderModel){
        if (boulderModel.result.t) { x  += 1; xa += boulderModel.result.t }
        if (boulderModel.result.t || boulderModel.result.b) { y  += 1 }
      })
      this.result = x+'t'+xa+' b'+y
    },
  
    parseModelData: function(model){
      this.start_order = model.data.start_order
      this.fullname    = model.data.lastname+', '+model.data.firstname
        
      this.resArray.forEach(function(boulderModel){
        var r = JSON.parse(model.data.result_json)[boulderModel.id]          
        if (!!r) boulderModel.parse(r)
      }.bind(this)) 
      this.sumResults()
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
          try { this.parseModelData(model) } 
          catch (err) { window.console.log(err) }      
        }.bind(this))
        .then(function(){ App.connectionStatus(true) })
        .then(null, function(){ App.connectionStatus(false) })
    },
  
    serialiseResults: function(){
      var tmp = {}
      this.resArray
        .filter(function(res){ return res.result.a !== null })
        .forEach(function(res){ tmp[res.id] = res.resultString })
      return JSON.stringify(tmp)
    },

    save: function(){
      var json = this.serialiseResults()
        , promise

      // Prevent a save occuring if no viewmodel has been instantiated
      if (!this.start_order) return

      promise = model.save(json)
      promise
        .then(function(){ App.connectionStatus(true) })
        .then(null, function(){ App.connectionStatus(false) })
    },
  
    reset: function(){
      window.console.log('reset called')
      this.start_order = null
      this.fullname    = null
      this.result      = null
      
      model.data = {}
      this.resArray.forEach(function(boulder){
        boulder.result = {a:null,b:null,c:null}
        boulder.displayResult = ''
        boulder.resultString  = null
      })
    }
  }
}
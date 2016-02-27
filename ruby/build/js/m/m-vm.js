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

    resArray    : (function(){
      for (var i = 1, a = []; i <= 30; i++) { a.push(new App.BoulderResultVM(i)) }
      return a
    })(),

    sumResults: function(){
      window.console.log("sumResults called")
      var x = 0, y = 0, xa = 0
      this.resArray.forEach(function(boulderModel){
        if (boulderModel.result.t) { x += 13; xa += (3 * boulderModel.result.t) }
        if (boulderModel.result.t || boulderModel.result.b) { y  += 1 }
      })
      this.result = (x - xa) + " b"+y
    },
  
    parseModelData: function(model){
      var o = {a:null,b:null,t:null} 
      
      this.start_order = model.data.start_order
      this.fullname    = model.data.lastname+', '+model.data.firstname        
      this.resArray.forEach(function(boulderModel){
        var r = model.data.result_json[boulderModel.id]
        boulderModel.result = (!!r) ? r : Object.assign({}, o)
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
  
    save: function(viewmodel){
      var obj = { result: null }
        , str = ""

      for (var key in viewmodel.result){
        if (viewmodel.result[key] !== null) str += (key+viewmodel.result[key])
      }
      obj.result = str
            
      str = JSON.stringify(obj)
      str = str.replace("result",viewmodel.id)
      model.save(str)
//      promise = model.save(json)
//      promise
//        .then(function(){ App.connectionStatus(true) })
//        .then(null, function(){ App.connectionStatus(false) })
    },
  
    reset: function(){
      this.start_order = null
      this.fullname    = null
      this.result      = null
      
      this.resArray.forEach(function(boulder){
        boulder.result = Object.assign({},{a:null,b:null,c:null})
      })
    }
  }
}

//for (var attrname in obj2) { obj1[attrname] = obj2[attrname]; }
/***********************************
* CODEKIT DECLARATIONS
***********************************/
/* global m                       */
/* global App                     */

window.App = window.App || {}

App.VM = function(model, sessiondata){  
  return {
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
  
    parseModelData: function(model){
      var key = 'p' + String(parseInt(sessiondata.BlcNr, 10))
        , obj = JSON.parse(model.data.result_json)

      for (var prop in this.result) {
        var str = prop + "[0-9]{1,}"          
          , v   = (!!obj[key]) ? obj[key].match(str) : null
        this.result[prop] = v ? parseInt(v[0].slice(1),10) : null
      }
      this.start_order = model.data.start_order
      this.fullname    = model.data.lastname+', '+model.data.firstname      
    },
        
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
          this.parseModelData(model)
        }
        catch (err) {
          window.console.log(err)
        }
      }.bind(this))
      .then(function(){ App.connectionStatus(true) })
      .then(null, function(){ App.connectionStatus(false) })
    },
  
    serialiseResults: function(){
      var key = 'p' + String(parseInt(sessiondata.BlcNr, 10))
        , obj = {}, str = ''
      
      for (var prop in this.result) {
        if (!!this.result[prop]) str += (prop+this.result[prop])
      }
      obj[key] = str
      return JSON.stringify(obj)
    },

    save: function(){
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
    
    // TODO Figure out when and where to call this...
    reset: function(){
      this.start_order = null
      this.fullname    = null 
      this.result      = {a: null,b: null,t: null}
      
      model.data = {}
    }
  }
}
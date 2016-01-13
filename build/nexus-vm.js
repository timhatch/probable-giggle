/***********************************
* CODEKIT DECLARATIONS
***********************************/
/* global m                       */
/* global App                     */

window.App = window.App || {}

App.VM = function(model){  
  return {
    // View-Model parameters and functions to link the App.Person model
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
      // Not sure the if test is needed?
      if (attr === 'a') return
      if (!!this.result[attr]) this.result[attr] = 0
    },
  
    parseModelData: function(model){
      var vm  =  App.sessionStorage.get('AppState')
        , key = 'p' + String(parseInt(vm.BlcNr, 10))
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
      var vm = App.sessionStorage.get('AppState')
        , rounds = {"Q":0,"S":2,"F":3}
        , groups = {"M":6,"F":5,"MJ":84,"FJ":81,"MA":82,"FA":79,"MB":83,"FB":80}

      return {
        wet_id     : parseInt(vm.WetId, 10),
        route      : rounds[vm.Route],
        grp_id     : groups[vm.GrpId],
        start_order: parseInt(val, 10) || 1          
      }
    },
    
    fetch: function(val){
      var params = this.composeURLParams(val)
        , resp   = model.fetch(params)
    
      resp.then(function(){
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
      var vm  =  App.sessionStorage.get('AppState')
        , key = 'p' + String(parseInt(vm.BlcNr, 10))
        , obj = {}, str = ''
      
      for (var prop in this.result) {
        if (!!this.result[prop]) str += (prop+this.result[prop])
      }
      obj[key] = str
      return JSON.stringify(obj)
    },

    save: function(){
      var json = this.serialiseResults()
        , resp = model.save(json)
      
      resp
      .then(function(){ App.connectionStatus(true) })
      .then(null, function(){ App.connectionStatus(false) })
    }
  }
}
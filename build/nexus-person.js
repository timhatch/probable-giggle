/***********************************
* CODEKIT DECLARATIONS
***********************************/
/* global m                       */
/* global App                     */

window.App = window.App || {}

App.Person = { 
  start_order : null,
  fullname    : null,
  resultJSON  : {},
    
  composeURI: function(val){
    var rounds = {"Q":0,"S":2,"F":3}
      , groups = {"M":6,"F":5,"MJ":84,"FJ":81,"MA":82,"FA":79,"MB":83,"FB":80}
    
      return {
      "wet_id"     : parseInt(App.viewModel.WetId,10),
      "route"      : rounds[App.viewModel.Route],
      "grp_id"     : groups[App.viewModel.GrpId],
      "start_order": parseInt(val,10)
    }
  },
    
  fetch: function(val){
    var self = this
    // Deal with the case where no value is provided
    if (!val) return
    // Otherwise fetch the climber's start_order, name and results...
    return m.request({
      method: 'GET',
      url   : '/climber',
      data  : self.composeURI(val)
    })
    .then(function(resp){
      try {
        self.resultJSON  = JSON.parse(resp.result_json)
        self.fullname    = resp.lastname + ', ' + resp.firstname
        self.start_order = parseInt(val, 10) || null
      }
      catch (err) { 
        window.console.log('invalid response : '+err) 
      }
      App.connectionStatus(true)
    })
    .then(null, function(){
      App.connectionStatus(false)
    })
  },
  
  save: function(jsonString){
    var params = this.composeURI(this.start_order)
    params.result_json = jsonString

    m.request({
      method: 'PUT',
      url   : '/climber/bloc',
      data  : params
    })
    .then(function(resp){
      window.console.log(resp)
      App.connectionStatus(true)
    })
    .then(null, function(){
      App.connectionStatus(false)      
    })
  },
  
  // Reset the climber data
  // TODO FIx the reset...
  reset: function(){
    this.start_order = null
    this.fullname    = null
    this.resultJSON  = {}
  }
}
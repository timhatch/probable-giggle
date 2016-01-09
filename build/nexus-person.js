/***********************************
* CODEKIT DECLARATIONS
***********************************/
/* global m                       */
/* global App                     */

window.App = window.App || {}

App.Person = { 
  start_order : null,
  fullname    : null,
  result      : {a:null,b:null,t:null},
  
  // Increment the attempts count on the current boulder
  incrementAttempts: function(val){
    var atts = this.result.a + val
    
    this.result.a = (atts >= 0) ? atts : 0
    this.save()
  },
  
  // set the bonus/top values for the current boulder
  setResult: function(attr){
    var res = this.result
    if (!res[attr]) {
      res[attr] = res.a
      if (attr === 't' && !res.b) res.b = res.a
    }
  },

  // Reset results for the current boulder
  resetResult: function(attr){
    if (!!this.result[attr]) this.result[attr] = 0
  },
  
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
    // Deal with the case where no value is provided
    if (!val) return
    
    //window.console.log(this.composeURI(val))
    var self = this
    m.request({
      method: 'GET',
      url   : '/climber',
      data  : self.composeURI(val)
    })
    .then(function(resp){
      try {
        var problem = 'p' + String(parseInt(App.viewModel.BlcNr, 10))
          , result  = JSON.parse(resp.result_json)[problem] || ''

        for (var prop in self.result) {
          var str = prop + "[0-9]{1,}"
            , v   = result.match(str) || null
          self.result[prop] = v ? parseInt(v[0].slice(1),10) : null
        }
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
  
  save: function(){
    var params = this.composeURI(this.start_order)
//      , obj    = {}
//      , key    = 'p' + String(parseInt(App.viewModel.BlcNr, 10))
//      , str    = ''//  
//    for (var prop in this.result) {
//      if (!!this.result[prop]) str += (prop+this.result[prop])
//    }
//    obj[key] = str
//    params.result_json = JSON.stringify(obj)
    params.result_json = this.stringifyResult()

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
  
  stringifyResult: function(){
    var key = 'p' + String(parseInt(App.viewModel.BlcNr, 10))
      , obj = {} , str = ''

    for (var prop in this.result) {
      if (!!this.result[prop]) str += (prop+this.result[prop])
    }
    obj[key] = str
    return JSON.stringify(obj)
  },
  
  // Reset the climber data
  reset: function(){
    this.start_order = null
    this.fullname    = null
    this.result      = {a:null,b:null,c:null}
  }
}
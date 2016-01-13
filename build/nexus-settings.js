/***********************************
* CODEKIT DECLARATIONS
***********************************/
/* global m                       */
/* global App                     */

window.App = window.App || {}

App.settingsVC = {
  controller: function(sessiondata){
    this.ss = sessiondata
    
    this.fetch = function(){
      // Break if a required value has not been provided...
      // Note that we're not validating date here...
      for (var prop in sessiondata) { if (sessiondata[prop] === null) return }
      
      // If all values have been provided, then fetch the competition ID from the server
      m.request({ 
        method: 'GET', 
        url   : '/competition',
        data  : { wet_id: sessiondata.WetId }
      })
      .then(function(resp){
        try {
          var title = resp.title || '-'
          title +=  ' / '+sessiondata.Route+' / '+sessiondata.GrpId+' / '+sessiondata.BlcNr 
          
          sessiondata.WetNm = title
          sessiondata.State = true
          App.sessionStorage.set('AppState', sessiondata)
        }
        catch (err) {
          window.console.log('invalid response : '+err) 
        }
        // TODO Need to clear or reset the model & view model when changing settings
        // model.reset()
        App.connectionStatus(true)
      })
      .then(null, function(){
        App.connectionStatus(false)
      })
    }
  },
  
  view: function(ctrl){
    var ss = ctrl.ss
    return m("div#settings",[
      m.component(App.ParamSV, ss, { key: 'WetId', text: "competition", pattern: "[0-9]" }),
      m.component(App.ParamSV, ss, { key: 'Route', text: "round" }),
      m.component(App.ParamSV, ss, { key: 'GrpId', text: "category" }),
      m.component(App.ParamSV, ss, { key: 'BlcNr', text: "boulder", pattern: "[0-9]" }),
      m("button.save", { 
        type    : "primary", 
        outline : true, 
        upper   : true,
        onclick : ctrl.fetch.bind(ctrl)
      }, "save")
    ])
  }
}

App.ParamSV = {
  controller: function(sessiondata, params){
    this.ss     = sessiondata
    this.params = params
    // Note that this stores all keys as strings...
    this.set = function(val){
      sessiondata[params.key] = val.toUpperCase() || null
    }
  },
  
  view: function(ctrl){
    return m("div.modal", [
      m("label", ctrl.params.text),
      m("input[type=text]", {
        onchange: m.withAttr("value", ctrl.set.bind(ctrl)),
        pattern : ctrl.params.pattern || null,
        value   : ctrl.ss[ctrl.params.key]
      })
    ])
  }
}
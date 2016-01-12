/***********************************
* CODEKIT DECLARATIONS
***********************************/
/* global m                       */
/* global App                     */

window.App = window.App || {}

App.settingsVC = {
  controller: function(sessionState){
    this.ss = sessionState
    
    this.fetch = function(){
      // Break if a required value has not been provided...
      // Note that we're not validating date here...
      for (var prop in sessionState) { if (sessionState[prop] === null) return }
      
      // If all values have been provided, then fetch the competition ID from the server
      m.request({ 
        method: 'GET', 
        url   : '/competition',
        data  : { wet_id: sessionState.WetId }
      })
      .then(function(resp){
        try {
          var title = resp.title || '-'
          title +=  ' / '+sessionState.Route+' / '+sessionState.GrpId+' / '+sessionState.BlcNr 
          
          sessionState.WetNm = title
          sessionState.State = true
          App.sessionStorage.set('AppState', sessionState)
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
  controller: function(sessionState, params){
    // Note that this stores all keys as strings...
    this.set = function(val){
      sessionState[params.key] = val.toUpperCase() || null
    }
  },
  
  view: function(ctrl, sessionState, params){
    return m("div.modal", [
      m("label", params.text),
      m("input[type=text]", {
        onchange: m.withAttr("value", ctrl.set.bind(ctrl)),
        pattern : params.pattern || null,
        value   : sessionState[params.key]
        //style   : (ss[params.key] === null) ? 'background-color:yellow' : 'none'
      })
    ])
  }
}
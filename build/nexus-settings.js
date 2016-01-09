/***********************************
* CODEKIT DECLARATIONS
***********************************/
/* global m                       */
/* global App                     */

window.App = window.App || {}

App.settingsVC = {
  controller: function(){

    this.fetch = function(){
      // Break if a required value has not been provided...
      // Note that we're not validating date here...
      for (var prop in App.viewModel) { if (App.viewModel[prop] === null) return }
      
      // If all values have been provided, then fetch the competition ID from the server
      m.request({ 
        method: 'GET', 
        url   : '/competition',
        data  : { wet_id: App.viewModel.WetId }
      })
      .then(function(resp){
        try {
          var title = resp.title || '-'
          title +=  ' / '+App.viewModel.Route+' / '+App.viewModel.GrpId+' / '+App.viewModel.BlcNr 
          
          App.viewModel.WetNm = title
          App.viewModel.State = true
          App.sessionStorage.set('AppState', App.viewModel)
        }
        catch (err) {
          window.console.log('invalid response : '+err) 
        }
        App.Person.reset()
        App.connectionStatus(true)
      })
      .then(null, function(){
        App.connectionStatus(false)
      })
    }
  },
  
  view: function(ctrl){
    return m("div#settings",[
      m.component(App.parametersSubview, { key: 'WetId', text: "competition", pattern: "[0-9]" }),
      m.component(App.parametersSubview, { key: 'Route', text: "round" }),
      m.component(App.parametersSubview, { key: 'GrpId', text: "category" }),
      m.component(App.parametersSubview, { key: 'BlcNr', text: "boulder", pattern: "[0-9]" }),
      m("button.save", { 
        type    : "primary", 
        outline : true, 
        upper   : true,
        onclick : ctrl.fetch.bind(ctrl)
      }, "save")
    ])
  }
}

App.parametersSubview = {
  controller: function(params){
    // Note that this stores all keys as strings...
    this.set = function(val){
      App.viewModel[params.key] = val.toUpperCase() || null
    }
  },
  
  view: function(ctrl, params){
    return m("div.modal", [
      m("label", params.text),
      m("input[type=text]", {
        onchange: m.withAttr("value", ctrl.set.bind(ctrl)),
        pattern : params.pattern || null,
        value   : App.viewModel[params.key]//,
        //style   : (App.viewModel[params.key] === null) ? 'background-color:yellow' : 'none'
      })
    ])
  }
}
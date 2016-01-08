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
      for (var prop in App.vm) { if (App.vm[prop] === null) { return }}
      
      // If all values have been provided, then fetch the competition ID from the server
      m.request({ method: 'GET', url: '/competition',
        data: { wet_id: App.vm.wid }
      })
      .then(function(resp){
        App.connectionStatus(true)   // Set the connection status 
        try {
          var title = resp.title || '-'
          title +=  ' / '+ App.vm.rnd + ' / ' + App.vm.grp + ' / ' + App.vm.prb 
          App.vm.ttl = title
          App.vm.vst = true
          App.ss.set('AppState', App.vm)
        }
        catch (err) { window.console.log(err) }
      })
      .then(null, function(err){ 
        App.connectionStatus(false)  // Set the connection status
        window.console.log('connection error: '+ err) 
      })
    }
  },
  
  view: function(ctrl){
    return m("div#settings",[
      m.component(App.parametersSubview, { key: 'wid', text: "competition", pattern: "[0-9]" }),
      m.component(App.parametersSubview, { key: 'rnd', text: "round" }),
      m.component(App.parametersSubview, { key: 'grp', text: "category" }),
      m.component(App.parametersSubview, { key: 'prb', text: "boulder", pattern: "[0-9]" }),
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
    this.params = params

    this.set = function(val){ 
      App.vm[params.key] = val.toUpperCase() || null
    }
  },
  
  view: function(ctrl){
    var params = ctrl.params
    return m("div.modal", [
      m("label", params.text),
      m("input[type=text]", {
        onchange: m.withAttr("value", ctrl.set.bind(ctrl)),
        pattern : params.pattern || null,
        value   : App.vm[params.key]//,
        //style   : (App.vm[params.key] === null) ? 'background-color:yellow' : 'none'
      })
    ])
  }
}
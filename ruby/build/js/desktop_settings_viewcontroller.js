//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */
/*global mx                                           */

var App = App || {};

App.SettingsVC = {
  // Chnage this to vm, as the sessiondata is callable from the vm...
  controller: function(vm){
    this.ss = vm.ss
    
    this.fetch = function(){
      // Break if a required value has not been provided...
      // Note that we're not validating date here...
//      for (var prop in vm.ss) { if (vm.ss[prop] === null) return }

      // If all values have been provided, then fetch the competition ID from the server
      m.request({ 
        method: 'GET', 
        url   : '/competition',
        data  : { wet_id: vm.ss.WetId }
      })
      .then(function(resp){
        try {
          vm.ss.WetNm = resp.title
          vm.ss.State = true
          App.sessionStorage.set('m-appstate', vm.ss)
        }
        catch (err) {
          window.console.log('invalid response : '+err) 
        }
        vm.reset()
      })
      .then(function(){
        App.connectionStatus(true)
      })
      .then(null, function(){
        App.connectionStatus(false)
      })
    }
  },
  
  view: function(ctrl){
    return m("div#settings",[
      m.component(App.ParamSV, ctrl, { key: 'WetId', text: "competition", pattern: "[0-9]" }),
      m.component(App.ParamSV, ctrl, { key: 'Route', text: "round" }),
      m.component(App.ParamSV, ctrl, { key: 'GrpId', text: "category" }),
    ])
  }
};

App.ParamSV = {
  controller: function(ctrl, params){
    this.params = params
    this.ss     = ctrl.ss
    // Note that this stores all keys as strings...
    this.set = function(val){
      ctrl.ss[params.key] = val.toUpperCase() || null
      if (params.key === 'WetId') { ctrl.fetch() }
      else { App.sessionStorage.set('m-appstate', ctrl.ss) }
    }
  },
  
  view: function(ctrl){
    return m("div.modal", [
      m("input[type=text]", {
        placeholder: ctrl.params.text,
        onchange: m.withAttr("value", ctrl.set.bind(ctrl)),
        pattern : ctrl.params.pattern || null,
        value   : ctrl.ss[ctrl.params.key] || m.trust('')
      })
    ])
  }
};
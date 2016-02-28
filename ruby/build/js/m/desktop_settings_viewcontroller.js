//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */
/*global mx                                           */

var App = App || {};

App.SettingsVC = {
  view: function(ctrl, vm){
    return m("div#settings",[
      m.component(App.ParamSV, { vm: vm, key: 'WetId', text: "competition" }),
      m.component(App.ParamSV, { vm: vm, key: 'Route', text: "round" }),
      m.component(App.ParamSV, { vm: vm, key: 'GrpId', text: "category" }),
    ])
  }
};

App.ParamSV = {
  controller: function(params){
    // Note that this stores all keys as strings...
    this.set = function(val){
      params.vm.ss[params.key] = val.toUpperCase() || null
      App.sessionStorage.set('m-appstate', params.vm.ss)
      params.vm.reset()
    }
  },
  
  view: function(ctrl, params){
    return m("span.modal", [
      m("label", params.text),
      m("input[type=text]", {
        onchange: m.withAttr("value", ctrl.set.bind(ctrl)),
        value   : params.vm.ss[params.key] || m.trust('')
      })
    ])
  }
};
//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */
/*global mx                                           */

var App = App || {};

App.SettingsVC = {
  // Chnage this to vm, as the sessiondata is callable from the vm...
  view: function(ctrl, vm){
    return m("div#settings",[
      m("header", { className: App.connectionStatus() ? 'connected' : 'disconnected' }, 
        vm.ss.comp.title || m.trust('&nbsp;')
      ),
      m.component(App.ParamSV, { vm: vm, key: 'WetId', text: "competition" }),
      m.component(App.ParamSV, { vm: vm, key: 'Route', text: "round" }),
      m.component(App.ParamSV, { vm: vm, key: 'GrpId', text: "category" })
    ])
  }
};

App.ParamSV = {
  controller: function(params){
    // Note that this stores all keys as strings...
    this.set = function(val){
      params.vm.ss[params.key] = val.toUpperCase() || null
      switch (params.key) {
      case 'WetId':
        params.vm.fetchCompetition()
        break
      case 'GrpId':
        params.vm.fetch()
        break
      default:
        App.sessionStorage.set('o-appstate', params.vm.ss)
      }
    }
  },
  
  view: function(ctrl, params){
    return m("span.modal", [
      m("label", params.text),
      m("input[type=text]", {
        onchange: m.withAttr("value", ctrl.set.bind(ctrl)),
        pattern : params.pattern || null,
        value   : params.vm.ss[params.key] || m.trust('')
      })
    ])
  }
}
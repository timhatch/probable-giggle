//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */
/*global mx                                           */

var App = App || {};

App.SettingsVC = {
  // Chnage this to vm, as the sessiondata is callable from the vm...
  controller: function(vm){
    this.vm = vm
    this.ss = vm.ss
    
  view: function(ctrl){
    return m("div#settings",[
      m("header", { className: App.connectionStatus() ? 'connected' : 'disconnected' }, 
        ctrl.ss.comp.title || m.trust('&nbsp;')
      ),
      m.component(App.ParamSV, ctrl, { key: 'WetId', text: "competition", pattern: "[0-9]" }),
      m.component(App.ParamSV, ctrl, { key: 'Route', text: "round" }),
      m.component(App.ParamSV, ctrl, { key: 'GrpId', text: "category" })
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
      switch (params.key) {
      case 'WetId':
        ctrl.fetchCompetitionParams()
        break
      case 'GrpId':
        ctrl.fetchResultList()
        break
      default:
        App.sessionStorage.set('o-appstate', ctrl.ss)
      }
    }
  },
  
  view: function(ctrl){
    return m("span.modal", [
      m("label", ctrl.params.text),
      m("input[type=text]", {
        onchange: m.withAttr("value", ctrl.set.bind(ctrl)),
        pattern : ctrl.params.pattern || null,
        value   : ctrl.ss[ctrl.params.key] || m.trust('')
      })
    ])
  }
}
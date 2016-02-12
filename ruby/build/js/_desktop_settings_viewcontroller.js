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
    
    this.fetchCompetitionParams = function(){
      m.request({ 
        method: 'GET', 
        url   : '/competition',
        data  : { wet_id: vm.ss.WetId }
      })
      .then(function(resp){
        try {
          vm.ss.comp  = resp
          App.sessionStorage.set('o-appstate', vm.ss)          
        }
        catch (err) { window.console.log('invalid response : '+err) }
        vm.reset()
      })
      .then(function(){ App.connectionStatus(true) })
      .then(null, function(){ App.connectionStatus(false) })
    }
    
    this.fetchResultList = function(){
      vm.fetch(null)
    }
  },
  
  view: function(ctrl){
    return m("div#settings",[
      m("header", { className: App.connectionStatus() ? 'connected' : 'disconnected' }, 
        ctrl.ss.comp.title || m.trust('&nbsp;')
      ),
      m.component(App.ParamSV, ctrl, { key: 'WetId', text: "competition", pattern: "[0-9]" }),
      m.component(App.ParamSV, ctrl, { key: 'Route', text: "round" }),
      m.component(App.ParamSV, ctrl, { key: 'GrpId', text: "category" }),
      m.component(App.TableSelectorViewController, ctrl.vm)
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

App.TableSelectorViewController = {
  controller: function(vm){
    this.clicked = function(){
      return {
        onclick: function(e){
          var prop    = e.target.getAttribute("value")
          vm.viewType = prop
        }
      }
    }
  },
  
  view: function(ctrl){
    return m("span", ctrl.clicked(), [
      m("label", "Startlist"),
      m("input[type=radio]", {name: "type", value: "Starters", checked: true}), 
      m("label", "Jurylist"),
      m("input[type=radio]", {name: "type", value: "Scores" }), 
      m("label", "Results"),
      m("input[type=radio]", {name: "type", value: "Results" })
    ])
  }
}

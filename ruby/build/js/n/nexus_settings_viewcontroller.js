//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */
/*global mx                                           */

var App = App || {};

App.SettingsPanelComponent = {
  // Chnage this to vm, as the sessiondata is callable from the vm...
  controller: function(vm){
    
    this.fetch = function(){
      // Break if a required value has not been provided...
      // Note that we're not validating date here...
      for (var prop in vm.ss) { if (vm.ss[prop] === null) return }
      
      // Get the first climber
      // Need to fix this, modify vm.fetch to use a promise... 
      vm.fetch(1) 
      vm.ss.State = true
      App.sessionStorage.set('n-appstate', vm.ss)
    }
  },
  
  view: function(ctrl, vm){
    return m("div#settings",[
      m.component(App.ParamSV, { ss : vm.ss, key: 'wet_id', text: "competition", pattern: "[0-9]" }),
      m.component(App.ParamSV, { ss : vm.ss, key: 'route', text: "round" }),
      m.component(App.ParamSV, { ss : vm.ss, key: 'grp_id', text: "category" }),
      m.component(App.ParamSV, { ss : vm.ss, key: 'blc_nr', text: "boulder", pattern: "[0-9]" }),
      m("button.save", { 
        type    : "primary", 
        outline : true, 
        upper   : true,
        onclick : ctrl.fetch.bind(ctrl)
      }, "save")
    ])
  }
};

App.ParamSV = {
  controller: function(params){
    // Note that this stores all keys as strings...
    this.set = function(val){
      params.ss[params.key] = val.toUpperCase() || null
    }
  },
  
  view: function(ctrl, params){
    return m("div.modal", [
      m("label", params.text),
      m("input[type=text]", {
        onchange: m.withAttr("value", ctrl.set.bind(ctrl)),
        pattern : params.pattern || null,
        value   : params.ss[params.key]
      })
    ])
  }
};

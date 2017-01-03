//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */
/*global mx                                           */

var App = App || {};

App.HeaderBarComponent = {
  controller: function(vm){    
    this.toggleSettings = function(){      
      // Disable toggling if a required value has not been provided...
      for (var prop in vm.ss) { if (vm.ss[prop] === null) return }
      // Toggle the view state
      vm.ss.State = !vm.ss.State
    }
  },
  
  view: function(ctrl, vm){
    var title = (vm.ss.route || "-")+" / "+(vm.ss.grp_id || "-")+" / "+(vm.ss.blc_nr || "-")
    return m("header", { 
        className: vm.connection() ? 'connected' : 'disconnected' 
      }, [
      m("button", {
        onclick: ctrl.toggleSettings,
        square : true
      }, m.trust('=')),
      m("span.details", title || m.trust('&nbsp;'))
    ])
  }
};

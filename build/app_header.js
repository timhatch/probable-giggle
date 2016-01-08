/***********************************
* CODEKIT DECLARATIONS
***********************************/
/* global m                       */
/* global App                     */

window.App = window.App || {}

App.headerVC = {
  controller: function(){    
    this.toggleSettings = function(){
      var state = App.vm.vst 
      App.vm.vst = (!!state) ? false : true
    }
  },
  
  view: function(ctrl){
    return m("header", { 
        className: App.connectionStatus() ? 'connected' : 'disconnected' 
      }, [
      m("button", {
        onclick: ctrl.toggleSettings,
        square: true
      }, m.trust('&#9776;')),
      m("span.details", App.vm.ttl)
    ])
  }
}
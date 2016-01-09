/***********************************
* CODEKIT DECLARATIONS
***********************************/
/* global m                       */
/* global App                     */

window.App = window.App || {}

App.headerVC = {
  controller: function(){    
    this.toggleSettings = function(){      
      // Disable toggling if a required value has not been provided...
      for (var prop in App.viewModel) { if (App.viewModel[prop] === null) return }
      
      var state = App.viewModel.State
      App.viewModel.State = (!!state) ? false : true
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
      m("span.details", App.viewModel.WetNm || m.trust('&nbsp;'))
    ])
  }
}
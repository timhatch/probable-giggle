/***********************************
* CODEKIT DECLARATIONS
***********************************/
/* global m                       */
/* global App                     */

window.App = window.App || {}

App.headerVC = {
  controller: function(sessiondata){
    this.ss = sessiondata
    
    this.toggleSettings = function(){      
      // Disable toggling if a required value has not been provided...
      for (var prop in sessiondata) { if (sessiondata[prop] === null) return }
      
      // Change the view state
      var state = sessiondata.State
      sessiondata.State = (!!state) ? false : true
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
      m("span.details", ctrl.ss.WetNm || m.trust('&nbsp;'))
    ])
  }
}
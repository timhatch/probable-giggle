/***********************************
* CODEKIT DECLARATIONS
***********************************/
/* global m                       */
/* global App                     */

window.App = window.App || {}

App.headerVC = {
  controller: function(sessionState){
    this.ss = sessionState
    
    this.toggleSettings = function(){      
      // Disable toggling if a required value has not been provided...
      for (var prop in sessionState) { if (sessionState[prop] === null) return }
      
      // Change the view state
      var state = sessionState.State
      sessionState.State = (!!state) ? false : true
    }
  },
  
  view: function(ctrl){
    var ss = ctrl.ss
    return m("header", { 
        className: App.connectionStatus() ? 'connected' : 'disconnected' 
      }, [
      m("button", {
        onclick: ctrl.toggleSettings,
        square: true
      }, m.trust('&#9776;')),
      m("span.details", ss.WetNm || m.trust('&nbsp;'))
    ])
  }
}
//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/* global m                                            */
/* global mx                                           */

// @codekit-prepend "./n-settings.js"
// @codekit-prepend "./n-header.js"
// @codekit-prepend "./n-results.js"
// @codekit-prepend "./n-person.js"
// @codekit-prepend "./n-vm.js"

window.App = window.App || {}

// Store the connection status (in-memory)
App.connectionStatus = m.prop(true)
// Use session storage to contain view model parameters
App.sessionStorage   = mx.storage( 'session' , mx.SESSION_STORAGE )

App.SuperVC = {
  controller: function(){
    var defaults = {
      WetId : null, Route : null, GrpId : null,
      BlcNr : null,

      State : false, WetNm : false
    }
    
    // Symchronise memory and session storage on-load
    this.ss     = App.sessionStorage.get('AppState')
    if (!this.ss) { 
      this.ss = defaults
      App.sessionStorage.set('AppState', defaults) 
    } 

    this.person = App.Person
    this.vm     = App.VM(this.person, this.ss)
  },
  
  view: function(ctrl){
    var vm = ctrl.vm
    return [
      m.component(App.headerVC, vm),
      (!!vm.ss.State) ? m.component(App.ResultsVC, vm) : m.component(App.settingsVC, vm)
    ]
  }
}
m.mount(document.body, App.SuperVC)
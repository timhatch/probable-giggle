//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */
/*global mx                                           */

// @codekit-prepend "./personresult_model.js"
// @codekit-prepend "./headerbar_viewcontroller.js"
// @codekit-prepend "./personselector_viewcontroller.js"

// @codekit-prepend "./nexus_results_viewcontroller.js"
// @codekit-prepend "./nexus_settings_viewcontroller.js"
// @codekit-prepend "./n-vm.js"

var App = App || {}
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
    this.ss   = App.sessionStorage.get('n-appstate')
    if (!this.ss) { 
      this.ss = defaults
      App.sessionStorage.set('n-appstate', defaults) 
    } 

    this.personResult = App.PersonResult
    this.vm     = App.VM(this.personResult, this.ss)
  },
  
  view: function(ctrl){
    var vm = ctrl.vm
    return [
      m.component(App.HeaderVC, vm),
      (!!vm.ss.State) ? m.component(App.ResultsVC, vm) : m.component(App.settingsVC, vm)
    ]
  }
}
m.mount(document.body, App.SuperVC)
//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/* global m                       */
/* global mx                       */

// @codekit-prepend "./app-settings.js"
// @codekit-prepend "./app-header.js"
// @codekit-prepend "./app-results.js"
// @codekit-prepend "./app-person.js"

// Store the connection status (in-memory)
App.connectionStatus = m.prop(true)
// Use session storage to contain view model parameters
App.sessionStorage   = mx.storage( 'session' , mx.SESSION_STORAGE )
// Declare a view-model to store session variable (in-memory)
App.vm = {
  State: false,
  WetId: null,
  Route: null,
  GrpId: null,
  BlcNr: null,
  WetNm: false
}


App.SuperVC = {
  controller: function(){
    // Symchronise memory and session storage on-load
    var store = App.sessionStorage.get('AppState')
    if (!store) { App.sessionStorage.set('AppState', App.vm) } 
    else { App.vm = store }
    
  },
  view: function(ctrl){
    return [
      App.headerVC,
      (!!App.vm.State) ? m.component(App.ResultsVC, App.Person) : App.settingsVC
    ]
  }
}
m.mount(document.body, App.SuperVC)
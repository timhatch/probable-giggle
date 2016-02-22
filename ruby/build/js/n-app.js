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
  // View declaration  
  view: function(ctrl, vm){
    return [
      m.component(App.HeaderVC, vm),
      (!!vm.ss.State) ? m.component(App.ResultsVC, vm) : m.component(App.settingsVC, vm)
    ]
  }
}

App.init = function(){
  var model = App.PersonResult
  
  var defaults = {
        WetId : null, Route : null, GrpId : null, 
        BlcNr : null,
        State : false
      }
  
  var ss = App.sessionStorage.get('n-appstate')
      if (!ss) { 
        ss = defaults
        App.sessionStorage.set('n-appstate', defaults) 
      } 
  
  var vm = App.VM(model, ss)
  
  m.mount(document.body, m.component(App.SuperVC, vm))
}()

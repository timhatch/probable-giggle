//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/* global m                                            */
/* global mx                                           */

// @codekit-prepend "./m/personresult_model.js"
// @codekit-prepend "./m/personselector_viewcontroller.js"

// @codekit-prepend "./m/desktop_settings_viewcontroller.js"
// @codekit-prepend "./m/desktop_results_viewcontroller.js"
// @codekit-prepend "./m/m-vm.js"

var App = App || {}

// Store the connection status (in-memory)
App.connectionStatus = m.prop(true)
// Use session storage to contain view model parameters
App.sessionStorage   = mx.storage( 'session' , mx.SESSION_STORAGE )

App.SuperVC = {
  // View declaration  
  view: function(ctrl, vm){
    return [
      m.component(App.SettingsVC, vm),
      m.component(App.PersonSelectorView, vm),
      m('#tiles', [
        m.component(App.ResultsViewController, { vm: vm, colstart:  1, rows: 4 }),
        m.component(App.ResultsViewController, { vm: vm, colstart:  6, rows: 4 }),
        m.component(App.ResultsViewController, { vm: vm, colstart: 11, rows: 4 }),
        m.component(App.ResultsViewController, { vm: vm, colstart: 16, rows: 4 }),
        m.component(App.ResultsViewController, { vm: vm, colstart: 21, rows: 4 }),
        m.component(App.ResultsViewController, { vm: vm, colstart: 26, rows: 4 })
      ])
    ]
  }
}

App.init = function(){
  var model = App.PersonResult
  
  var defaults = {
        WetId : null, Route : null, GrpId : null, 
        State : false, WetNm : null
      }
  
  var ss = App.sessionStorage.get('m-appstate')
      if (!ss) { 
        ss = defaults
        App.sessionStorage.set('m-appstate', defaults) 
      } 
  
  var vm = App.VM(model, ss)
  
  m.mount(document.body, m.component(App.SuperVC, vm))
}()

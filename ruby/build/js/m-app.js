//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/* global m                                            */
/* global mx                                           */

// @codekit-prepend "./m/personresult_model.js"
// @codekit-prepend "./m/headerbar_viewcontroller.js"
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
      m.component(App.HeaderVC, vm),
      m.component(App.SettingsVC, vm),
      m.component(App.PersonSelectorView, vm),
      m('span.result', vm.result),
      m('#tiles', [
        vm.resArray.map(function(bloc, i) {
          return m.component(App.ResultsVC, { 
            vm: vm, 
            model: bloc
          }) 
        })
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

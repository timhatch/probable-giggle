//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/* global m                                            */
/* global mx                                           */

// @codekit-prepend "./routeresult_model.js"
// @codekit-prepend "./_desktop_settings_viewcontroller.js"
// @codekit-prepend "./_desktop_results_viewcontroller.js"
// @codekit-prepend "./_personresult_model.js"

// @codekit-prepend "./boulderresult_viewmodel.js"
// @codekit-prepend "./o-vm.js"

var App = App || {}

// Store the connection status (in-memory)
App.connectionStatus = m.prop(true)
// Use session storage to contain view model parameters
App.sessionStorage   = mx.storage( 'session' , mx.SESSION_STORAGE )

App.SuperVC = {
  controller: function(){
    var defaults = {
      WetId : null, Route : null, GrpId : null,
      comp  : {title: null}, 
    }

    this.ss  = App.sessionStorage.get('o-appstate')
    if (!this.ss) {
      this.ss = defaults
      App.sessionStorage.set('o-appstate', defaults)
    }

    this.model = App.RouteResult
    this.vm    = new App.VM(this.model, this.ss)        
  },   
  // View declaration  
  view: function(ctrl){
    var vm    = ctrl.vm
      , blocs = [1,2,3,4,5]
    
    return [
      m.component(App.SettingsVC, vm),
      m.component(App.TableViewController, { model: ctrl.model, blocs: blocs, type: "ResultsTable" }),
      m('button', { onclick : vm.save.bind(vm) }, 'Save All')
    ]
  }
}

m.mount(document.body, App.SuperVC)
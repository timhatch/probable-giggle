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
  controller: function(params){
    this.vm   = params.vm
    this.type = params.type
  },   
  // View declaration  
  view: function(ctrl){
    var vm      = ctrl.vm
      , blocs   = [1,2,3,4]

    return [
      m.component(App.SettingsVC, vm),
      m.component(App.RouterVC),
      m.component(App.TableViewController, { model: vm.rd, blocs: blocs, type: ctrl.type })
    ]
  }
}

//m.mount(document.body, App.SuperVC)
App.RouterVC = {
  view: function(){
    return m("#routes", [
      m("a[href='/']", { config: m.route }, "Startlist"),
      m("a[href='/re']", { config: m.route }, "Resultlist"),     
      m("a[href='/sc']", { config: m.route }, "Scoresheet")
    ])
  }
}

// INitialise the application
App.init = function(){  
  var model    = App.RouteResult
  
  var defaults = {
        WetId : null, Route : null,
        comp  : {title: null}, 
      }
  
  var ss  = App.sessionStorage.get('o-appstate')
  if (!ss) {
    ss = defaults
    App.sessionStorage.set('o-appstate', defaults)
  }
  
  var vm = new App.VM(model, ss)
  
  // Render the mithril route tree
  m.route.mode = "hash"
  m.route(document.body, "/", {
    "/"  : m.component(App.SuperVC, { vm: vm, type: "Starters"}),
    "/re": m.component(App.SuperVC, { vm: vm, type: "Results"}),
    "/sc": m.component(App.SuperVC, { vm: vm, type: "Scores"})
  })
}()

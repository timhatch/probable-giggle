//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/* global m                                            */
/* global mx                                           */

// @codekit-prepend "./personresult_model.js"
// @codekit-prepend "./headerbar_viewcontroller.js"
// @codekit-prepend "./personselector_viewcontroller.js"

// @codekit-prepend "./boulderresult_view model.js"

// @codekit-prepend "./desktop_settings_viewcontroller.js"
// @codekit-prepend "./desktop_results_viewcontroller.js"
// @codekit-prepend "./m-vm.js"

var App = App || {}

// Store the connection status (in-memory)
App.connectionStatus = m.prop(true)
// Use session storage to contain view model parameters
App.sessionStorage   = mx.storage( 'session' , mx.SESSION_STORAGE )

App.SuperVC = {
  controller: function(){
    var defaults = {
      WetId : null, Route : null, GrpId : null,
      State : false, WetNm : null
    }

    this.ss   = App.sessionStorage.get('m-appstate')
    //window.console.log(this.ss)
    if (!this.ss) {
      this.ss = defaults
      App.sessionStorage.set('m-appstate', defaults)
    }
        
    this.personResult = App.PersonResult
    this.vm     = new App.VM(this.personResult, this.ss)
  },   
  // View declaration  
  view: function(ctrl){
    var vm = ctrl.vm
    return [
      m.component(App.HeaderVC, vm),
      m.component(App.SettingsVC, vm),
      m.component(App.PersonSelectorView, vm),
      m('span.result', vm.result),
      m('#tiles', [
        vm.resArray.map(function(bloc) { 
          return m.component(App.ResultsVC, { model: bloc, addFn: vm.sumResults.bind(vm) }) 
        })
      ]),
      m('button', { onclick : vm.save.bind(vm) }, 'Submit')
    ]
  }
}
m.mount(document.body, App.SuperVC)
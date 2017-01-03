//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------

// @codekit-prepend "./n/personresult_model.js"
// @codekit-prepend "./n/headerbar_viewcontroller.js"
// @codekit-prepend "./n/personselector_viewcontroller.js"

// @codekit-prepend "./n/nexus_results_viewcontroller.js"
// @codekit-prepend "./n/nexus_settings_viewcontroller.js"
// @codekit-prepend "./n/nexus-viewmodel.js"

(function(m, document, App){
  var session, viewmodel, application
 
  // Fetch any stored application settings, if none exist then create them
  session  = App.sessionStorage.get('n-appstate')
  if (!session) { 
    session = { WetId : null, Route : null, GrpId : null, BlcNr : null, State : false } 
    App.sessionStorage.set('n-appstate', session) 
  } 
  
  // Create the Application ViewModel and render the application
  // The header component is rendered by default and then either the settings component
  // (if there are no settings in the session storage) or the results_input component
  // (if there are stored settings)
  viewmodel   = App.VM(session)
  application = {
    view: function(ctrl, viewmodel){
      return [
        m.component(App.HeaderVC, viewmodel),
        m.component(!!viewmodel.ss.State ? App.ResultsVC : App.settingsVC, viewmodel)
      ]
    }
  }
  
  // Mount the application 
  m.mount(document.body, m.component(application, viewmodel))
})(window.m, window.document, window.App)

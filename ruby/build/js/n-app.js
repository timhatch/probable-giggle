//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------

// @codekit-prepend "./n/personresult_model.js"
// @codekit-prepend "./n/headerbar_viewcontroller.js"
// @codekit-prepend "./n/personselector_viewcontroller.js"

// @codekit-prepend "./n/nexus_results_viewcontroller.js"
// @codekit-prepend "./n/nexus_settings_viewcontroller.js"
// @codekit-prepend "./n/nexus-viewmodel.js"

// (function(m, document, App){
//   // Create the Application ViewModel and render the application
//   // The header component is rendered by default and then either the settings component
//   // (if there are no settings in the session storage) or the results_input component
//   // (if there are stored settings)
//   var viewmodel   = App.ViewModel(99)
//   var application = {
//     view: function(ctrl, viewmodel){
//       return [
//         m.component(App.HeaderBarComponent, viewmodel),
//         m.component(!!viewmodel.ss.State ? App.ResultsInputComponent : 
//           App.SettingsPanelComponent, viewmodel)
//       ]
//     }
//   }
//   // Mount the application 
//   m.mount(document.body, m.component(application, viewmodel))
// })(window.m, window.document, window.App);

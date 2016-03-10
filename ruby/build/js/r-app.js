//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/* global m                                            */

var App = App || {}
 
App.RegistrationViewController = {
  // Application controller  
  controller: function(params){
    window.console.log('here')
//    this.wetid  = params.wetid
//    this.title  = params.title  
//  this.upload = function(e) {
//    e.preventDefault()
//    do stuff here to submit the file using m.request()  
//  }
  },   
  // View declaration  
  // For now use a hidden iframe to avoid redirection when submitting.
  // Alternatively overload the default onsubmit event
  view: function(ctrl){
    return [
      m("h2", "Registration File Upload"),
      m('form#1', { // onsubmit: ctrl.upload 
        action : '/registration', 
        enctype: 'multipart/form-data',
        target : 'response', 
        method : 'POST'
      }, [
        m('#registration', { textContent: 'Select a CSV file : ' }),
        m('input[type=file]', { name: 'file' }),
        m('input[type=submit]', { value: 'upload' })
      ]),
      m("h2", "Create Startlist"),
      m('form#2', {
        action : '/startlist/import', 
        enctype: 'multipart/form-data',
        target : 'response', 
        method : 'POST'
      }, [
        m('#starters', { textContent: 'Select a CSV file : ' }),
        m('input[type=text]', {name: 'wet_id', placeholder: 'wet_id'}),
        m('input[type=text]', {name: 'grp_id', placeholder: 'grp_id'}),
        m('input[type=text]', {name: 'route', placeholder: 'route'}),
        m('h3', "Disable the submit button unless wet_id, grp_id and route parameters have been set"),
        m('input[type=file]', { name: 'file' }),
        m('input[type=submit]', { value: 'upload' })
      ]),
      m('iframe#response', {style: "display:none"})
    ]
  }
}

m.mount(document.body, App.RegistrationViewController)
/***********************************
* CODEKIT DECLARATIONS
***********************************/
/* global m                       */

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
      m('form', { // onsubmit: ctrl.upload 
        action : '/registration', 
        enctype: 'multipart/form-data', 
        method : 'POST',
        target : '#response'
      }, [
        m('#upload', { textContent: 'Select a CSV file : ' }),
        m('input[type=file]', { name: 'file' }),
        m('input[type=submit]', { value: 'upload' }),
        m('iframe#response')
      ]),
      m("h2", "Create Startlist")
    ]
  }
}

m.mount(document.body, App.RegistrationViewController)
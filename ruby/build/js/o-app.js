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

    this.list = [{testname: "John", firstname: "John", lastname: "Jones"},{testname: "Eddie", firstname: "Eddie",lastname: "Smith"}]
    
    this.ss  = App.sessionStorage.get('o-appstate')
    //window.console.log(this.ss)
    if (!this.ss) {
      this.ss = defaults
      App.sessionStorage.set('o-appstate', defaults)
    }
    this.model = App.RouteResult
    this.vm    = new App.VM(this.model, this.ss)
        
    this.sorts = function() {
      var list = this.list
      return {
        onclick: function(e) {          
          var prop = e.target.getAttribute("data-sort-by") 
          if (!!prop) {
            var first = list[0]
            list.sort(function(a,b){
            //  return a.data[prop] > b.data[prop] ? 1 : a.data[prop] < b.data[prop] ? -1 : 0
              return a[prop] > b[prop] ? 1 : a[prop] < b[prop] ? -1 : 0
            })
            if (first === list[0]) list.reverse()
          }
        }
      }      
    }
    
    this.sorts2 = function() {
      var list = this.model.data
      return {
        onclick: function(e) {
          var prop = e.target.getAttribute("data-sort-by")
          if (!!prop) {
            window.console.log(prop)
            var first = list[0]
            list.sort(function(a,b){
              window.console.log(a[prop])
              return a[prop] > b[prop] ? 1 : a[prop] < b[prop] ? -1 : 0
            })
            if (first === list[0]) list.reverse()
          }
        }
      }
    }
    
        
//    this.routeResult = App.RouteResult
  },   
  // View declaration  
  view: function(ctrl){
    var vm    = ctrl.vm
      , blocs = [1,2,3,4,5]
//    window.console.log(ctrl.model)
//    return [
//      m.component(App.SettingsVC, vm),
//      m.component(App.TableViewController, { model: vm, blocs: blocs }),
//      m('button', { onclick : vm.save.bind(vm) }, 'Save All')
//    ]
    
    return [
      m.component(App.SettingsVC, vm),
      m.component(App.TableViewController, { model: ctrl.model, blocs: blocs }),
//      m("table", ctrl.sorts(), [
//        m.component(App.TestHeaderRow),
//        ctrl.list.map(function(person){
////          return m("tr", [
////            m("td", person.firstname),
////            m("td", person.lastname)
////          ])
//          // Works!!!
//          return App.TestFunction(person)
////          return m.component(App.TestContentRow, { model: person })
////          return m("tr", [
////              m.component(App.TestContentRow, { model: person }),
////              m.component(App.TestContentRow, { model: person })
////          ])
//        })
//      ]),
//      m("table", ctrl.sorts2(), [
//        m.component(App.HeaderRow),
//        ctrl.model.data.map(function(person) {
////          window.console.log(person) 
//          return m.component(App.ResultsVC, { model: person, blocs: blocs }) 
//        })
//      ]),
      m('button', { onclick : vm.save.bind(vm) }, 'Save All')
    ]
  }
}

App.TestFunction = function(person){
  return m("tr", [
    m("td", person.testname, {firstname: person.firstname}),
    m("td", person.lastname)
  ]) 
}
App.TestContentRow = {
  controller: function(params){
    this.person = params.model
  },
  
  view: function(ctrl){
    var person = ctrl.person
    return m("tr", [
      m("td", person.testname, {firstname: person.firstname}),
      m("td", person.lastname)
    ])
  }
}
App.TestHeaderRow = {
  view: function(){
    return     m("tr", [
      m("th[data-sort-by=firstname]", "Firstname"), 
      m("th[data-sort-by=lastname]", "Lastname")
    ])
  }
}
m.mount(document.body, App.SuperVC)
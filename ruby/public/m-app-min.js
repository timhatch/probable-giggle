//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */
/*global mx                                           */

var App = App || {};

App.PersonResult = { 
  //  Store the model directly as retrieved from the server (a plain JS object)
  //
  data        : {},
  
  //  Fetch a single set of results from the server
  //  params can take the form of:
  //  - wet_id, route, grp_id and start_order 
  //  - wet_id, route, per_id
  //
  fetch: function(params){
    return m.request({
      method : 'GET',
      url    : '/results/person',
      data   : params
    })
    .then(function(resp){
      this.data = resp
    }.bind(this))
  },
  
  //  Save results for a single person
  //  jsonString is a stringified JSON object in the form:
  //  "{\"p2\":\"a2\",\"p1\":\"a3b1t3\"}"
  //
  save: function(jsonString){
    window.console.log('save called')
    var params = {
      wet_id     : this.data.wet_id,
      route      : this.data.route,
      grp_id     : this.data.grp_id,
      start_order: this.data.start_order,
      result_json: jsonString
    }
    return m.request({
      method: 'PUT',
      url   : '/results/person',
      data  : params
    })
  }
};

//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */
/*global mx                                           */

var App = App || {};

App.HeaderVC = {
  controller: function(vm){
    this.ss = vm.ss
    
    this.toggleSettings = function(){      
      // Disable toggling if a required value has not been provided...
      for (var prop in vm.ss) { if (vm.ss[prop] === null) return }
      
      // Change the view state
      var state = vm.ss.State
      vm.ss.State = (!!state) ? false : true
    }
  },
  
  view: function(ctrl){
    return m("header", { 
        className: App.connectionStatus() ? 'connected' : 'disconnected' 
      }, [
      m("button", {
        onclick: ctrl.toggleSettings,
        square: true
      }, m.trust('&#9776;')),
      m("span.details", ctrl.ss.WetNm || m.trust('&nbsp;'))
    ])
  }
};

//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */

var App = App || {}

App.PersonSelectorView = {
  controller: function(vm){
    this.vm = vm
            
    this.incrementStarter = function(){
      var val = vm.start_order + 1
      vm.fetch(val)
    }
  },
  
  view: function(ctrl){
    var vm = ctrl.vm
    return m("div.search",[
      m("input[type=text]", {
        pattern : '[0-9]',
        onchange: m.withAttr('value', vm.fetch.bind(vm)),
        value   : vm.start_order 
      }),
      m("span.details", vm.fullname || m.trust('&nbsp;')),
      m("button", {
        square  : true,
        onclick : ctrl.incrementStarter.bind(ctrl)
      }, m.trust('&#8594;'))
    ])
  }
}

//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */
/*global mx                                           */

var App = App || {};

App.SettingsVC = {
  // Chnage this to vm, as the sessiondata is callable from the vm...
  controller: function(vm){
    this.ss = vm.ss
    
    this.fetch = function(){
      // Break if a required value has not been provided...
      // Note that we're not validating date here...
//      for (var prop in vm.ss) { if (vm.ss[prop] === null) return }

      // If all values have been provided, then fetch the competition ID from the server
      m.request({ 
        method: 'GET', 
        url   : '/competition',
        data  : { wet_id: vm.ss.WetId }
      })
      .then(function(resp){
        try {
          vm.ss.WetNm = resp.title
          vm.ss.State = true
          App.sessionStorage.set('m-appstate', vm.ss)
        }
        catch (err) {
          window.console.log('invalid response : '+err) 
        }
        vm.reset()
      })
      .then(function(){
        App.connectionStatus(true)
      })
      .then(null, function(){
        App.connectionStatus(false)
      })
    }
  },
  
  view: function(ctrl){
    return m("div#settings",[
      m.component(App.ParamSV, ctrl, { key: 'WetId', text: "competition", pattern: "[0-9]" }),
      m.component(App.ParamSV, ctrl, { key: 'Route', text: "round" }),
      m.component(App.ParamSV, ctrl, { key: 'GrpId', text: "category" }),
    ])
  }
};

App.ParamSV = {
  controller: function(ctrl, params){
    this.params = params
    this.ss     = ctrl.ss
    // Note that this stores all keys as strings...
    this.set = function(val){
      ctrl.ss[params.key] = val.toUpperCase() || null
      if (params.key === 'WetId') { ctrl.fetch() }
      else { App.sessionStorage.set('m-appstate', ctrl.ss) }
    }
  },
  
  view: function(ctrl){
    return m("div.modal", [
      m("input[type=text]", {
        placeholder: ctrl.params.text,
        onchange: m.withAttr("value", ctrl.set.bind(ctrl)),
        pattern : ctrl.params.pattern || null,
        value   : ctrl.ss[ctrl.params.key] || m.trust('')
      })
    ])
  }
};

//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */

var App = App || {}

App.ResultsVC = {
  // Controller, calling model and super's results aggregation function
  controller: function(params){
    this.model = params.model
    
    this.set = function(val){
      params.model.update(val)
      params.addFn()
    }
  },  
  // View declaration  
  view: function(ctrl){
    var result = ctrl.model.result
      , value  = result.t || (result.b ? 'b' : null)
    return m('.tile', [
      m('span.bloc', ctrl.model.id), 
      m('input[type=text].textbox', {
        value   : value,
        onchange: m.withAttr('value', ctrl.set.bind(ctrl))
      }),
      m('span.result', ctrl.model.displayResult)
    ])
  }  
}

//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/* global m                                            */

var App = App || {}

App.VM = function(model, sessiondata){
  return {
    ss          : sessiondata,
    // View-Model parameters and functions derived from the model
    //
    start_order : null, 
    fullname    : null, 
    result      : null,          

    resArray    : (function(){
      for (var i = 1, a = []; i <= 30; i++) { a.push(new App.BoulderResultVM(i)) }
      return a
    })(),

    sumResults: function(){
      var x = 0, y = 0, xa = 0
      this.resArray.forEach(function(boulderModel){
        if (boulderModel.result.t) { x  += 1; xa += boulderModel.result.t }
        if (boulderModel.result.t || boulderModel.result.b) { y  += 1 }
      })
      this.result = x+'t'+xa+' b'+y
    },
  
    parseModelData: function(model){
      this.start_order = model.data.start_order
      this.fullname    = model.data.lastname+', '+model.data.firstname
        
      this.resArray.forEach(function(boulderModel){
        var r = JSON.parse(model.data.result_json)[boulderModel.id]          
        if (!!r) boulderModel.parse(r)
      }.bind(this)) 
      this.sumResults()
    },
  
    // Construct query parameters from stored data on the competition, round and group
    // plus the provided start_order
    composeURLParams: function(val){
      var rounds = {"Q":0,"S":2,"F":3}
        , groups = {"M":6,"F":5,"MJ":84,"FJ":81,"MA":82,"FA":79,"MB":83,"FB":80}

      return {
        wet_id     : parseInt(sessiondata.WetId, 10),
        route      : rounds[sessiondata.Route],
        grp_id     : groups[sessiondata.GrpId],
        start_order: parseInt(val, 10)
      }
    },
//    fetch: function(val){ window.console.log('called fetch') },
    fetch: function(val){
      if (val === null) return 
      this.reset()
        
      var params  = this.composeURLParams(val)
        , promise = model.fetch(params)
    
      promise
        .then(function(){
          try { this.parseModelData(model) } 
          catch (err) { window.console.log(err) }      
        }.bind(this))
        .then(function(){ App.connectionStatus(true) })
        .then(null, function(){ App.connectionStatus(false) })
    },
  
    serialiseResults: function(){
      var tmp = {}
      this.resArray
        .filter(function(res){ return res.result.a !== null })
        .forEach(function(res){ tmp[res.id] = res.resultString })
      return JSON.stringify(tmp)
    },

    save: function(){
      var json = this.serialiseResults()
        , promise

      // Prevent a save occuring if no viewmodel has been instantiated
      if (!this.start_order) return

      promise = model.save(json)
      promise
        .then(function(){ App.connectionStatus(true) })
        .then(null, function(){ App.connectionStatus(false) })
    },
  
    reset: function(){
      window.console.log('reset called')
      this.start_order = null
      this.fullname    = null
      this.result      = null
      
      model.data = {}
      this.resArray.forEach(function(boulder){
        boulder.result = {a:null,b:null,c:null}
        boulder.displayResult = ''
        boulder.resultString  = null
      })
    }
  }
}

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


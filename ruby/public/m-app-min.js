//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */
/*global mx                                           */

var App = App || {};

App.PersonResult = { 
  //  Store the model directly as retrieved from the server (a plain JS object)
  //  Set wet_id === 999 to guard against data being entered without a specified comp'
  // 
  params      : { wet_id: 999 },
  data        : {},
  
  //  Fetch a single set of results from the server
  //  params can take the form of:
  //  - wet_id, route, grp_id and start_order 
  //  - wet_id, route, per_id
  //
  fetch: function(params){
    this.params = params
    return m.request({
      method : 'GET',
      url    : '/results/person',
      data   : params
    })
    .then(function(resp){
      try {
        this.data = resp
        this.objectifyResults()              
      } catch  (err) { 
        window.console.log(resp)
      }
    }.bind(this))
  },
  
  // Parse the results_json object from the string form returned (we're not using the 
  // Postgresql JSON extensions yet) into an actual JS object
  objectifyResults: function(){
    var json = this.data.result_json
//    window.console.log(json)
    try {
      var obj = JSON.parse(json)
        , str, val
      for (var boulder in obj) {
        var res = {a:null,b:null,t:null}
        for (var key in res) {
          str = key + "[0-9]{1,}"
          val = obj[boulder].match(str)
          res[key] = val ? parseInt(val[0].slice(1),10) : null
        }
        obj[boulder] = res
      }
      this.data.result_json = obj
      //return obj
    }
    catch (err) { window.console.log(err) }
  },

  stringifySingleResult: function(resID){
    var res = this.data.result_json[resID]
      , obj = {}, str = ""
    for (var key in res){
      if (res[key] !== null) str += (key+res[key])
    }
    obj[resID] = str
    return JSON.stringify(obj)
  },
    
  //  Save results for a single person
  //  jsonString is a stringified JSON object in the form:
  //  "{\"p2\":\"a2\",\"p1\":\"a3b1t3\"}"
  //
  save: function(jsonString){
  //  window.console.log('save called')
    var params         = this.params
    params.result_json = jsonString
    
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
    this.toggleSettings = function(){      
      // Disable toggling if a required value has not been provided...
      for (var prop in vm.ss) { if (vm.ss[prop] === null) return }
      
      // Change the view state
      var state = vm.ss.State
      vm.ss.State = (!!state) ? false : true
    }
  },
  
  view: function(ctrl, vm){
    var title = (vm.ss.Route || "-")+" / "+(vm.ss.GrpId || "-")+" / "+(vm.ss.BlcNr || "-")
    return m("header", { 
        className: App.connectionStatus() ? 'connected' : 'disconnected' 
      }, [
      m("button", {
        onclick: ctrl.toggleSettings,
        square: true
      }, m.trust('=')),
      m("span.details", title || m.trust('&nbsp;'))
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
            
    this.incrementStarter = function(){
      var val = vm.start_order + 1
      // No top
      if (vm.result.b > 0 && vm.result.t === null) { 
        vm.result.t = 0 
        vm.save()
      }
      // No bonus
      else if (vm.result.a > 0 && vm.result.b === null) { 
        vm.result.b = 0 
        vm.save()      
      }
      // Result manually zeroed
      else if (vm.result === 0) { 
        vm.result.a = vm.result.b = vm.result.t = null 
        vm.save()
      }
      
      // Fetch the next set of data 
      // TODO Add error handling to deal with running past the last climber...
      vm.fetch(val)
    }
  },
  
  view: function(ctrl, vm){
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
  view: function(ctrl, vm){
    return m("div#settings",[
      m.component(App.ParamSV, { vm: vm, key: 'WetId', text: "competition" }),
      m.component(App.ParamSV, { vm: vm, key: 'Route', text: "round" }),
      m.component(App.ParamSV, { vm: vm, key: 'GrpId', text: "category" }),
    ])
  }
};

App.ParamSV = {
  controller: function(params){
    // Note that this stores all keys as strings...
    this.set = function(val){
      params.vm.ss[params.key] = val.toUpperCase() || null
      App.sessionStorage.set('m-appstate', params.vm.ss)
      params.vm.reset()
    }
  },
  
  view: function(ctrl, params){
    return m("div.modal", [
      m("input[type=text]", {
        placeholder: params.text,
        onchange: m.withAttr("value", ctrl.set.bind(ctrl)),
        value   : params.vm.ss[params.key] || m.trust('')
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
    this.set = function(val){
      params.model.update(val)
      params.vm.save(params.model)
      // TODO: Save here!!!
      params.vm.sumResults()
    }
  },  
  // View declaration  
  view: function(ctrl, params){
    var result = params.model.result
      , value  = result.t || (result.b ? 'b' : null)
    return m('.tile', [
      m('span.bloc', params.model.id), 
      m('input[type=text].textbox', {
        value   : value,
        onchange: m.withAttr('value', ctrl.set.bind(ctrl))
      })
    ])
  }  
}

// Single Result Model / View
//
App.BoulderResultVM = function(id){
  this.id           = 'p'+id
  this.result       = {a:null,b:null,t:null}
}

App.BoulderResultVM.prototype = {
  // Set the model parameters from a passed value
  update: function(val){
    switch (val) {
    case 'b':
      this.result.t = 0
      this.result.a = this.result.a || 3
      this.result.b = this.result.b || 3
      break
    case '1':
    case '2':
    case '3':
      this.result.b = this.result.b || parseInt(val,10)
      this.result.t = this.result.a = parseInt(val,10)
      break
    default:
      this.result.t = this.result.b = this.result.a = null
    }
  }
}

//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/* global m                                            */

var App = App || {}

App.VM = function(model, sessiondata){
  return {
    model       : model,
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
      window.console.log("sumResults called")
      var x = 0, y = 0, xa = 0
      this.resArray.forEach(function(boulderModel){
        if (boulderModel.result.t) { x += 13; xa += (3 * boulderModel.result.t) }
        if (boulderModel.result.t || boulderModel.result.b) { y  += 1 }
      })
      this.result = (x - xa) + " b"+y
    },
  
    parseModelData: function(model){
      var o = {a:null,b:null,t:null} 
      
      this.start_order = model.data.start_order
      this.fullname    = model.data.lastname+', '+model.data.firstname        
      this.resArray.forEach(function(boulderModel){
        var r = model.data.result_json[boulderModel.id]
        boulderModel.result = (!!r) ? r : Object.assign({}, o)
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
  
    save: function(viewmodel){
      var obj = { result: null }
        , str = ""

      for (var key in viewmodel.result){
        if (viewmodel.result[key] !== null) str += (key+viewmodel.result[key])
      }
      obj.result = str
            
      str = JSON.stringify(obj)
      str = str.replace("result",viewmodel.id)
      model.save(str)
//      promise = model.save(json)
//      promise
//        .then(function(){ App.connectionStatus(true) })
//        .then(null, function(){ App.connectionStatus(false) })
    },
  
    reset: function(){
      this.start_order = null
      this.fullname    = null
      this.result      = null
      
      this.resArray.forEach(function(boulder){
        boulder.result = Object.assign({},{a:null,b:null,c:null})
      })
    }
  }
}

//for (var attrname in obj2) { obj1[attrname] = obj2[attrname]; }

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



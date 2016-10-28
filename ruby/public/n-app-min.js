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
    window.console.log("called with ")
    window.console.log(params)
    this.params = params
    return m.request({
      method : 'GET',
      url    : '/results/person',
      data   : params
    })
    .then(function(resp){
      try {
        window.console.log(resp)
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

App.ResultsVC = {
  controller: function(vm){
    
    this.changeAttempts = function(e){
      var i    = (e.type === 'swipedown') ? 1 : -1
        , atts = vm.result.a + i
      
      vm.result.a = (atts >= 0) ? atts : 0
      vm.save()
      m.redraw(true)
    }
  },
  
  view: function(ctrl, vm){
    return m("div#results", {
      config  : m.touchHelper({
        'swipedown' : ctrl.changeAttempts.bind(ctrl),
        'swipeup'   : ctrl.changeAttempts.bind(ctrl)
      })
    }, [
      m.component(App.PersonSelectorView, vm),
      m.component(App.AttemptsView, { vm: vm, text: "Tops" }),
      m.component(App.AttemptsView, { vm: vm, text: "Bonus" }),
      m.component(App.AttemptsView, { vm: vm, text: "Attempts" })
    ])
  }
}

App.AttemptsView = {
  controller: function(params){
    
    this.changeValue = function(e){
      var prop = params.text[0].toLowerCase()
      // TODO: Disable swipefleft on attepts field...
      if (e.type === 'swiperight') { params.vm.setResult(prop) }
      if (e.type === 'swipeleft')  { params.vm.resetValues(prop) }
      
      params.vm.save()
      m.redraw(true)
    }
  },
  
  view: function(ctrl, params){
    var prop = params.text[0].toLowerCase()
      , val  = params.vm.result[prop]

    return m("div.row", {
      config: m.touchHelper({
        'swiperight' : ctrl.changeValue.bind(ctrl),
        'swipeleft'  : ctrl.changeValue.bind(ctrl)
      })
    }, [
      m("div.list", params.text),
      m("div.round", (!val) ? "-" : val)
    ])
  }
}

//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */
/*global mx                                           */

var App = App || {};

App.settingsVC = {
  // Chnage this to vm, as the sessiondata is callable from the vm...
  controller: function(vm){
    
    this.fetch = function(){
      // Break if a required value has not been provided...
      // Note that we're not validating date here...
      for (var prop in vm.ss) { if (vm.ss[prop] === null) return }
      
      // Get the first climber
      // Need to fix this, modify vm.fetch to use a promise... 
      vm.fetch(1) 
      vm.ss.State = true
      App.sessionStorage.set('n-appstate', vm.ss)
    }
  },
  
  view: function(ctrl, vm){
    return m("div#settings",[
      m.component(App.ParamSV, { ss : vm.ss, key: 'WetId', text: "competition", pattern: "[0-9]" }),
      m.component(App.ParamSV, { ss : vm.ss, key: 'Route', text: "round" }),
      m.component(App.ParamSV, { ss : vm.ss, key: 'GrpId', text: "category" }),
      m.component(App.ParamSV, { ss : vm.ss, key: 'BlcNr', text: "boulder", pattern: "[0-9]" }),
      m("button.save", { 
        type    : "primary", 
        outline : true, 
        upper   : true,
        onclick : ctrl.fetch.bind(ctrl)
      }, "save")
    ])
  }
};

App.ParamSV = {
  controller: function(params){
    // Note that this stores all keys as strings...
    this.set = function(val){
      params.ss[params.key] = val.toUpperCase() || null
    }
  },
  
  view: function(ctrl, params){
    return m("div.modal", [
      m("label", params.text),
      m("input[type=text]", {
        onchange: m.withAttr("value", ctrl.set.bind(ctrl)),
        pattern : params.pattern || null,
        value   : params.ss[params.key]
      })
    ])
  }
};

//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */
/*global mx                                           */

var App = App || {};

App.VM = function(model, sessiondata){  
  return {
    model       : model,
    ss          : sessiondata,
    // View-Model parameters and functions derived from the model
    //
    start_order : null,
    fullname    : null, 
    result      : {a: null,b: null,t: null},
    
    setResult: function(attr){
      if (!this.result[attr]) {
        this.result[attr] = this.result.a
        if (attr === 't' && !this.result.b) this.result.b = this.result.a
      }
    },
  
    resetValues: function(attr){
      if (attr === 'a') return
      // Not sure the if test is needed?
      if (!!this.result[attr]) this.result[attr] = 0
    },
  
    // Construct query parameters from stored data on the competition, round and group
    // plus the provided start_order
    composeURLParams: function(val){
      var rounds = {"QA":0, "QB":1,"S":2,"F":3,"SF":4}
        , groups = {"M":6,"F":5,"MJ":84,"FJ":81,"MA":82,"FA":79,"MB":83,"FB":80}

      return {
        wet_id     : parseInt(sessiondata.WetId, 10),
        route      : rounds[sessiondata.Route],
        grp_id     : groups[sessiondata.GrpId],
        start_order: parseInt(val, 10) || 1          
      }
    },
    
    fetch: function(val){
      var params  = this.composeURLParams(val)
        , promise = model.fetch(params)
    
      promise.then(function(){
        try {
          var key          = 'p' + String(parseInt(sessiondata.BlcNr, 10))
          this.result      = model.data.result_json[key] || {a: null,b: null,t: null}
          this.start_order = model.data.start_order
          this.fullname    = model.data.lastname+', '+model.data.firstname 
        }
        catch (err) { window.console.log(err) }
      }.bind(this))
      .then(function(){ App.connectionStatus(true) })
      .then(null, function(){ App.connectionStatus(false) })      
    },
  
    serialiseResults: function(){
      var key = 'p' + String(parseInt(sessiondata.BlcNr, 10))
        , obj = {}, str = ''
       
      for (var prop in this.result) {
        if (this.result[prop] !== null) str += (prop+this.result[prop])
      }
      window.console.log(str)
      obj[key] = str
      return JSON.stringify(obj)
    },

    save: function(){
      var key = 'p' + String(parseInt(sessiondata.BlcNr, 10))
      model.data.result_json[key] = this.result
      
      // TODO: Add code here to save the model (if it has changed, in particular setting "b0")
      var json    = this.serialiseResults()
        , promise

      // Prevent a save occuring if no viewmodel has been instantiated
      if (!this.start_order) return

      // Otherwise save any results data
      promise = model.save(json)
      promise
      .then(function(){ App.connectionStatus(true) })
      .then(null, function(){ App.connectionStatus(false) })
    },
    
    reset: function(){
      this.start_order = null
      this.fullname    = null 
      this.result      = {a: null,b: null,t: null}
      
      model.data = {}
    }
  }
};


//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */
/*global mx                                           */

// @codekit-prepend "./n/personresult_model.js"
// @codekit-prepend "./n/headerbar_viewcontroller.js"
// @codekit-prepend "./n/personselector_viewcontroller.js"

// @codekit-prepend "./n/nexus_results_viewcontroller.js"
// @codekit-prepend "./n/nexus_settings_viewcontroller.js"
// @codekit-prepend "./n/n-vm.js"

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
      (!!vm.ss.State) ? m.component(App.ResultsVC, vm) : m.component(App.settingsVC, vm)
    ]
  }
}

App.init = function(){
  var model = App.PersonResult
  
  var defaults = {
        WetId : null, Route : null, GrpId : null, 
        BlcNr : null,
        State : false
      }
  
  var ss = App.sessionStorage.get('n-appstate')
      if (!ss) { 
        ss = defaults
        App.sessionStorage.set('n-appstate', defaults) 
      } 
  
  var vm = App.VM(model, ss)
  
  m.mount(document.body, m.component(App.SuperVC, vm))
}()



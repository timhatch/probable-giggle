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
  //  params take the form of:
  //  - wet_id, route, grp_id and start_order 
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
        window.console.log(resp)
        this.data = resp
      } catch  (err) { 
        window.console.log(err)
      }
    }.bind(this))
  },
  
  //  Save results for a single person
  //
  save: function(params){
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
      // Toggle the view state
      vm.ss.State = !vm.ss.State
    }
  },
  
  view: function(ctrl, vm){
    var title = (vm.ss.Route || "-")+" / "+(vm.ss.GrpId || "-")+" / "+(vm.ss.BlcNr || "-")
    return m("header", { 
        className: vm.connection() ? 'connected' : 'disconnected' 
      }, [
      m("button", {
        onclick: ctrl.toggleSettings,
        square : true
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
    // If the "forward' button is pressed, then
    // (a) change the value of the bonus/top field to indicate that attempts have finished
    // or zero out the result
    this.incrementStarter = function(){
      var val = vm.start_order + 1
      // No top
      if (vm.result.b > 0 && vm.result.t === null) { 
        vm.result.t = 0; vm.save()
      }
      // No bonus
      else if (vm.result.a > 0 && vm.result.b === null) { 
        vm.result.b = 0; vm.save()
      }
      // Result manually zeroed
      else if (vm.result.a === null) {
        vm.result.a = vm.result.b = vm.result.t = null; vm.save()
      }
      // window.console.log(vm.result)
      // (b) save the data, and fetch the next set of data
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
  controller: function(tablet_vm){
    
    this.changeAttempts = function(e){
      var i    = (e.type === 'swipedown') ? 1 : -1
      var atts = tablet_vm.result.a + i

      tablet_vm.result.a = (atts > 0) ? atts : null 
      tablet_vm.save()
      m.redraw(true)
    }
  },
  
  view: function(ctrl, tablet_vm){
    return m("div#results", {
      config  : m.touchHelper({
        'swipedown' : ctrl.changeAttempts.bind(ctrl),
        'swipeup'   : ctrl.changeAttempts.bind(ctrl)
      })
    }, [
      m.component(App.PersonSelectorView, tablet_vm),
      m.component(App.AttemptsView, { vm: tablet_vm, text: "Tops" }),
      m.component(App.AttemptsView, { vm: tablet_vm, text: "Bonus" }),
      m.component(App.AttemptsView, { vm: tablet_vm, text: "Attempts" })
    ])
  }
}

// View module for a touch-driven scorer
// Comprises a top level div element which respons to swipe left and right events
// with two sub-views, one containing a descriptor and the second a display div
// displaying the number of attempts
//
App.AttemptsView = {
  controller: function(params){
    
    this.changeValue = function(e){
      var prop = params.text[0].toLowerCase()

      if (e.type === 'swiperight') { params.vm.setValue(prop) }
      if (e.type === 'swipeleft')  { params.vm.clearValue(prop) }
      
      params.vm.save()
      m.redraw(true)
    }
  },
  
  view: function(ctrl, params){
    var prop = params.text[0].toLowerCase()
    var val  = params.vm.result[prop]

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

//  -----------------------------------------------------
//  CODEKIT DECLARATIONS
//  -----------------------------------------------------
/*global m                                            */
/*global mx                                           */

var App = App || {};

App.sessionStorage   = mx.storage( 'session' , mx.SESSION_STORAGE )

App.VM = function(){ 

  var sessiondata = App.sessionStorage.get('n-appstate')
  if (!sessiondata) {
    sessiondata = { WetId : null, Route : null, GrpId : null, BlcNr : null, State : false }
    App.sessionStorage.set('n-appstate', sessiondata)
  }

  return {
    connection  : m.prop(true),
    model       : App.PersonResult,
    ss          : sessiondata,
    
    // View-Model parameters and functions derived from the model
    start_order : null,
    fullname    : null, 
    result      : { a: null, b: null, t: null },
    // Set or unset results
    
    // setValue allows a result attribute to be set only once, i.e.
    // if the existing value is null (or zero), set the value of the attribute to
    // equal the current number of attempts.
    // If the attribute in question is a "top" and no "bonus" has been recorded, then
    // automatically set the bonus as well
    //
    setValue: function(attr){
      if (!this.result[attr]) {
        this.result[attr] = this.result.a
        if (attr === 't' && !this.result.b) {
          this.result.b = this.result.a
        }
      }
    },

    // clearValue() unsets any existing data 
    clearValue: function(attr){
      if (!!this.result[attr]) this.result[attr] = null
    },
  
    // Construct query parameters from stored data on the competition, round and group
    // plus the provided start_order
    composeURLParams: function(query){
      var rounds = {"QA":0, "QB":1,"S":2,"F":3,"SF":4}
      var groups = {"M":6,"F":5,"MJ":84,"FJ":81,"MA":82,"FA":79,"MB":83,"FB":80,"TM":63,"TF":284}
      
      return Object.assign({
        wet_id : parseInt(this.ss.WetId, 10),
        route  : rounds[this.ss.Route],
        grp_id : groups[this.ss.GrpId]
      }, query)
    },
    
    // Fetch a model from the server
    fetch: function(val){
      var params  = this.composeURLParams({ start_order: parseInt(val, 10) || 1 })
      
      this.model.fetch(params)
      .then(function(){
        try {
          // If the model doesn't exist (e.g. we've entered an ineligible startnumber)
          // theh reset the model and only otherwise process the data
          if (!this.model.data) { this.reset() } 
          else {
            var key          = 'p' + String(parseInt(this.ss.BlcNr, 10))
            this.result      = this.model.data.result_jsonb[key] || { a: null, b: null, t: null }
            this.start_order = this.model.data.start_order
            this.fullname    = this.model.data.lastname+', '+this.model.data.firstname
          }
        }
        catch (err) { window.console.log(err) }
      }.bind(this))
      .then(function(){ this.connection(true) }.bind(this))
      .then(null, function(){ this.connection(false) }.bind(this))      
    },
    
    // Save data back to the server
    save: function(){
      var key, params
      // Prevent a save occuring if no viewmodel has been instantiated
      if (!this.start_order) return
      // Create the parameters to save back to the server
      // TODO: Computed property names (ESNext) breaks Uglify.js
      // Can fix, e.g. var o = {}; o[key] = this.result
      key    = 'p' + String(parseInt(this.ss.BlcNr, 10))
      params = this.composeURLParams({
        per_id      : this.model.data.per_id,
        result_jsonb: { [key] : this.result }
      });
      // Send the data back
      this.model.save(params) 
      .then(function(){ this.connection(true) }.bind(this))
      .then(null, function(){ this.connection(false) }.bind(this))
    },
    
    // Reset the viewmodel
    reset: function(){
      this.start_order = null
      this.fullname    = null 
      this.result      = { a: null, b: null, t: null }
      
      this.model.data = {}
    }
  }
}();


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
  // Create the Application ViewModel and render the application
  // The header component is rendered by default and then either the settings component
  // (if there are no settings in the session storage) or the results_input component
  // (if there are stored settings)
  var viewmodel   = App.VM
  var application = {
    view: function(ctrl, viewmodel){
      return [
        m.component(App.HeaderVC, viewmodel),
        m.component(!!viewmodel.ss.State ? App.ResultsVC : App.settingsVC, viewmodel)
      ]
    }
  }
  // Mount the application 
  m.mount(document.body, m.component(application, viewmodel))
})(window.m, window.document, window.App);



// TODO:  Note that the only difference between PersonResult and RouteResult is the url
//        May be possible to unify the code base
//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */
/*global mx                                           */

var App = App || {};

App.RouteResult = { 
  //  Store the model directly as retrieved from the server (a plain JS object)
  //
  params      : {},
  data        : [],
  
  //  Fetch a single set of results from the server
  //  params can take the form of:
  //  - wet_id, route, grp_id and start_order 
  //  - wet_id, route, per_id
  //
  fetch: function(params){
    this.params = params

    return m.request({
      method : 'GET',
      url    : '/results/route',
      data   : params
    })
    .then(function(resp){
      try {
        this.data = resp.map(function(result){
          var person    = new App.PersonResult(result.start_order)
          person.params = Object.assign({start_order: result.start_order}, params)
          person.data   = result
          return person
        })
      }
      catch (err) { window.console.log(err) }
    }.bind(this))
  },
  
  updateResults: function(){
    var params = this.params   
    return m.request({
      method : 'GET',
      url    : '/results/route',
      data   : params
    })
    .then(function(resp){
      try {
        resp.forEach(function(result){
          this.data.find(function(res){ return (res.data.per_id === result.per_id) })
          .update(result)
        }.bind(this))
      }
      catch (err) { window.console.log(err) }
    }.bind(this))
  },
    

  //
  save: function(){

  }
};


//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */
/*global mx                                           */

var App = App || {};

App.SettingsVC = {
  // Chnage this to vm, as the sessiondata is callable from the vm...
  view: function(ctrl, vm){
    return m("div#settings",[
      m("header", { className: App.connectionStatus() ? 'connected' : 'disconnected' }, 
        vm.ss.comp.title || m.trust('&nbsp;')
      ),
      m.component(App.ParamSV, { vm: vm, key: 'WetId', text: "competition" }),
      m.component(App.ParamSV, { vm: vm, key: 'Route', text: "round" }),
      m.component(App.ParamSV, { vm: vm, key: 'GrpId', text: "category" })
    ])
  }
};

App.ParamSV = {
  controller: function(params){
    // Note that this stores all keys as strings...
    this.set = function(val){
      params.vm.ss[params.key] = val.toUpperCase() || null
      switch (params.key) {
      case 'WetId':
        params.vm.fetchCompetition()
        break
      case 'GrpId':
        params.vm.fetch()
        break
      default:
        App.sessionStorage.set('o-appstate', params.vm.ss)
      }
    }
  },
  
  view: function(ctrl, params){
    return m("span.modal", [
      m("label", params.text),
      m("input[type=text]", {
        onchange: m.withAttr("value", ctrl.set.bind(ctrl)),
        pattern : params.pattern || null,
        value   : params.vm.ss[params.key] || m.trust('')
      })
    ])
  }
}

//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */

var App = App || {}

App.TableViewController = {
  controller: function(){
        
    this.delete = function(){
      alert('starter deletion not yet implemented')
    }
    
    this.sorts = function(list){
      return {
        onclick: function(e){
          var prop = e.target.getAttribute("data-sort-by")
          if (!!prop) {
            var first = list[0]
            list.sort(function(a,b){
              return a.data[prop] > b.data[prop] ? 1 : a.data[prop] < b.data[prop] ? -1 : 0
            })
            if (first === list[0]) list.reverse()
          }
        }
      }
    }
  },
  
  view: function(ctrl, params){
    var list  = params.vm.rd.data
      , blocs = params.vm.blocs
    return m("table", ctrl.sorts(list), [
      App[params.type].createHeaderRow(blocs),
      list.map(function(person){
        var _params = {vm: params.vm, person: person }
        return App[params.type].createContentRow(ctrl, _params)
      })
    ])
  }
}

App.Results = {
  createHeaderRow: function(blocs){
    return m("tr", [
      m("th[data-sort-by=result_rank]", "Rk"),
      m("th[data-sort-by=lastname].w12.left", "Lastname"),
      m("th[data-sort-by=firstname].w09.left", "Firstname"),
      m("th[data-sort-by=nation]", "IOC "),
      m("th[data-sort-by=start_order]", "Sn "),
//      m("th[data-sort-by=per_id]", "UUID"),
      m("th.w48.flex", [
        blocs.map(function(bloc_nr){
          return m(".bloc", m.trust("p"+bloc_nr))
        })        
      ]),
      m("th.w09", "Result"),
    ])
  },

  createContentRow: function(ctrl, _params){
    var vm   = _params.vm
      , data = _params.person.data
    return m("tr", [
      m("td", data.result_rank || m.trust(''), { result_rank: data.result_rank }),
      m("td.w12.left", data.lastname),
      m("td.w09.left", data.firstname),
      m("td", data.nation),
      m("td", data.start_order),
//      m("td", data.per_id),
      m("td.w48.flex",[
        vm.blocs.map(function(bloc_nr){
          var id  ='p'+bloc_nr
            , who = _params.person
          return m(".bloc", { key: data.per_id+"."+bloc_nr }, [
            m.component(this.AttemptsSubView, { vm: vm, person: who, id: id, datatype: "b" }),
            m.component(this.AttemptsSubView, { vm: vm, person: who, id: id, datatype: "t" })
          ]
        )}.bind(this))       
      ]),
      m("td.w09", data.result)
    ])
  },
  
  AttemptsSubView: {
    controller: function(params){
      this.responseStatus   = m.prop(true)
      // For a given boulder ("id") get the value of an associated property
      // e.g. attempts/bonus/top ("prop")
      this.getPropertyValue = function(id, prop){
        var result = params.person.data.result_jsonb
        return (!!result[id]) ? result[id][prop] : null
      }
      
      // Reset the result value when a change is made. Show it again when the server is updated
      // Create the result if it doesnt already exist
      // TODO - Highlight changes by adjusting the color of the 
      this.set = function(value){
        var intValue 
        var result = params.person.data.result_jsonb
        
        // If there is no  pre-existing result, create one
        if (!result[params.id]) { 
          result[params.id] = {a:0} 
        }
        
        // Discard non-numeric inputs
        intValue = parseInt(value,10)
        intValue = isNaN(intValue) ? null : intValue
        
        // Update the results
        result[params.id][params.datatype] = this.prop = intValue        
        result[params.id].a = Math.max(result[params.id].a, this.prop)
        
        // Stringify and then save the result
        params.person.save(params.id, result[params.id])
        .then(function(){
          params.vm.rd.updateResults()
          this.responseStatus(true)
        }.bind(this))
        .then(null,function(){this.responseStatus(false)}.bind(this))
      }
    },
  
    view: function(ctrl, params){
      var data = params.person.data
        , val  = ctrl.getPropertyValue(params.id, params.datatype)
      return m("input[type=text]", {
        key        : data.per_id+"."+params.id+params.datatype,
        placeholder: params.datatype, 
        value      : isNaN(val) ? m.trust("") : val,
        className  : ctrl.responseStatus() ? "connected" : "disconnected",
        onchange   : m.withAttr("value", ctrl.set.bind(ctrl)) 
      })
    }
  }
}

App.Starters = {
  createHeaderRow: function(){
    return m("tr", [
      m("th[data-sort-by=start_order]", "Sn"),
      m("th[data-sort-by=lastname].w12.left", "Lastname"),
      m("th[data-sort-by=firstname].w09.left", "Firstname"),
      m("th[data-sort-by=nation]", "IOC"),
      m("th[data-sort-by=per_id]", "ID"),
      m("th[data-sort-by=rank_prev_heat]", "Prev Heat"),
      m("th", m.trust(""))      
    ])
  },

  createContentRow: function(ctrl, _params){
    var who  = _params.person
      , data = _params.person.data
    return m("tr", [
      m("td", data.start_order),
      m("td.w12.left", data.lastname),
      m("td.w09.left", data.firstname),
      m("td", data.nation),
      m("td", data.per_id),
      m("td", data.rank_prev_heat || m.trust("NA")),
      m("td", [ m("button[outline=true].icon-trash-empty", { onclick: ctrl.delete.bind(who) }) ])
    ])
  }  
}

App.Scores = {
  createHeaderRow: function(){
    return m("tr", [
      m("th[data-sort-by=start_order]", "Sn"),
      m("th.w12.left", "Lastname"),
      m("th.w09.left", "Firstname"),
      m("th", "IOC"),
//      m("th", "UUID"),
      m("th.w48", "Score"),
      m("th.w09", "Result")      
    ])
  },

  createContentRow: function(ctrl, _params){
    var data = _params.person.data
    return m("tr", [
      m("td", data.start_order),
      m("td.w12.left", data.lastname),
      m("td.w09.left", data.firstname),
      m("td", data.nation),
//      m("td", data.per_id),
      m("td.w48"),
      m("td.w09")
    ])
  }  
}


//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */

var App = App || {}

App.PersonResult = function(uuid){
  this.id     = uuid
  this.params = {}
  this.data   = {}
} 

App.PersonResult.prototype = {
  //  Fetch a single set of results from the server
  //  params can take the form of:
  //  - wet_id, route, grp_id and start_order 
  //  - wet_id, route, per_id
  //
  // TODO: Untested!! THink this.params = params doesn't work as 
  fetch: function(){

  },
  
  update: function(result){
    this.data.result       = result.result
    this.data.result_rank  = result.result_rank
    this.data.sort_values  = result.sort_values
    this.data.result_jsonb = result.result_jsonb
  },
  
  //  Save results for a single person
  //
  save: function(key, value){
    var params = {
      wet_id: this.data.wet_id,
      grp_id: this.data.grp_id,
      route:  this.data.route,
      per_id: this.data.per_id,
      result_jsonb: { [key]: value }
    }
    window.console.log(params)
    return m.request({
      method: 'PUT',
      url   : '/results/person',
      data  : params
    })
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
    rd          : model,
    blocs       : [1,2,3,4],
    
    // Construct query parameters from stored data on the competition, round and group
    // plus the provided start_order
    composeURLParams: function(){
      var rounds = {"QA":0, "QB":1,"S":2,"F":3,"SF":4}
      var groups = {
          "M":6,"F":5,"MJ":84,"FJ":81,"MA":82,"FA":79,"MB":83,"FB":80,"TM":63,"TF":284,"TO":120
        }

      return {
        wet_id : parseInt(sessiondata.WetId, 10) || 0,
        route  : rounds[sessiondata.Route] || 0,
        grp_id : groups[sessiondata.GrpId] || 1
      }
    },

    //
    //
    fetch: function(val){
      var params = this.composeURLParams()
      
      this.rd.fetch(params)
      .then(function(){ App.connectionStatus(true) })
      .then(null, function(){ App.connectionStatus(false) })
    },
  
    fetchCompetition: function(){
      var w = this.ss.WetId
      m.request({ 
        method: 'GET', 
        url   : '/competition',
        data  : { wet_id: w }
      })
      .then(function(resp){
        try {
          this.ss.comp  = resp
          App.sessionStorage.set('o-appstate', this.ss)          
        }
        catch (err) { window.console.log('invalid response : '+err) }
        this.reset()
      }.bind(this))
      .then(function(){ App.connectionStatus(true) })
      .then(null, function(){ App.connectionStatus(false) })
    },
  
    reset: function(){

    }
  }
}


//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/* global m                                            */
/* global mx                                           */

// @codekit-prepend "./o/routeresult_model.js"
// @codekit-prepend "./o/_desktop_settings_viewcontroller.js"
// @codekit-prepend "./o/_desktop_results_viewcontroller.js"
// @codekit-prepend "./o/_personresult_model.js"
// @codekit-prepend "./o/desktop_viewmodel.js"

var App = App || {}

// Store the connection status (in-memory)
App.connectionStatus = m.prop(true)
// Use session storage to contain view model parameters
App.sessionStorage   = mx.storage( 'session' , mx.SESSION_STORAGE )

App.SuperVC = {
  // View declaration  
  view: function(ctrl, params){
    return [
      m.component(App.SettingsVC, params.vm),
      m.component(App.RouterVC),
      m.component(App.TableViewController, { vm: params.vm, type: params.type })
    ]
  }
}

App.RouterVC = {
  view: function(){
    return m("#routes", [
      m("a[href='/']", { config: m.route }, "Startlist"),
      m("a[href='/re']", { config: m.route }, "Resultlist"),     
      m("a[href='/sc']", { config: m.route }, "Scoresheet")
    ])
  }
}

// Initialise the application
App.init = function(){
  // Initialise a model  
  var model    = App.RouteResult
  
  // Initialise default values for the stored application state
  var defaults = {
        WetId : null, Route : null,
        comp  : {title: null}, 
      }
  
  // Fetch (or initialise) sessionStorage
  var ss  = App.sessionStorage.get('o-appstate')
  if (!ss) {
    ss = defaults
    App.sessionStorage.set('o-appstate', defaults)
  }
  
  // Create a new viewmodel object
  var vm = new App.VM(model, ss)
  
  // Render the mithril route tree
  m.route.mode = "hash"
  m.route(document.body, "/", {
    "/": m.component(App.SuperVC, { vm: vm, type: "Starters"}),
    "/re": m.component(App.SuperVC, { vm: vm, type: "Results"}),
    "/sc": m.component(App.SuperVC, { vm: vm, type: "Scores"})
  })
}()



//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/* global m                       */
/* global mx                       */

// @codekit-prepend "./app_settings.js"
// @codekit-prepend "./app_header.js"

App.ResultsVC = {
  controller: function(){
    
    this.changeAttempts = function(e){
      var i = (e.type === 'swipedown') ? 1 : -1
        , a = App.climberModel.a + i
      
      App.climberModel.a = (a >= 0) ? a : 0
      App.climberModel.save()
      m.redraw(true)
      window.console.log(App.climberModel)
    }
  },
  
  view: function(ctrl){
    return m("div#results", {
      config  : m.touchHelper({
        'swipedown' : ctrl.changeAttempts.bind(ctrl),
        'swipeup'   : ctrl.changeAttempts.bind(ctrl)
      })
    }, [
      m.component(App.searchSV),
      m.component(App.attemptsSV, { text: "Tops" }),
      m.component(App.attemptsSV, { text: "Bonus" }),
      m.component(App.attemptsSV, { text: "Attempts" })
    ])
  }
}

App.searchSV = {
  controller: function(){
    this.model = App.climberModel
        
    this.incrementStarter = function(){
      var val = this.model.start_order += 1
      this.model.fetch(val)
    }
  },
  
  view: function(ctrl){
    var model = ctrl.model
    return m("div.search",[
      m("input[type=text]", {
        pattern : '[0-9]',
        onchange: m.withAttr('value', model.fetch.bind(model)),
        value   : model.start_order
      }),
      m("span.details", model.fullname || m.trust('&nbsp;')),
      m("button", {
        square  : true,
        onclick : ctrl.incrementStarter.bind(ctrl)
      }, m.trust('&#8594;'))
    ])
  }
}

App.attemptsSV = {
  controller: function(params){
    this.prop = params.text[0].toLowerCase()
    
    this.changeValue = function(e){
      // Put all redraws inside test loops to avoid unnecessary calls
      var val = App.climberModel[this.prop]
      // Update the attempt values following a right swipe
      if (e.type === 'swiperight' && !val) {
        App.climberModel[this.prop] = App.climberModel.a
        if (this.prop === 't' && !App.climberModel.b) {
          App.climberModel.b = App.climberModel.a
        } 
      }
      // Reset the attempt values following a left swipe
      if (e.type === 'swipeleft' && !!val) {
        App.climberModel[this.prop] = 0
      }
      // Save and redraw
      App.climberModel.save()
      m.redraw(true)
    }
  },
  
  view: function(ctrl, params){
    var val = App.climberModel[ctrl.prop]

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

App.vm = {
  vst : false,
  wid : null,
  rnd : null,
  grp : null,
  prb : null,
  ttl : "? / ? / ? / ?"
}

App.climberModel = { 
  a           : null, 
  b           : null, 
  t           : null, 

  start_order : null,
  fullname    : null,
  result_json : null,
  
  composeURI: function(value){
    var rounds = {"Q":0,"S":2,"F":3}
      , groups = {"M":6,"F":5,"MJ":84,"FJ":81,"MA":82,"FA":79,"MB":83,"FB":80}
    
      return {
      "wet_id"     : App.vm.wid,
      "route"      : rounds[App.vm.rnd],
      "grp_id"     : groups[App.vm.grp],
      "start_order": value
    }
  },
    
  fetch: function(val){
    // TODO add code here to deal with (a) No value provided or (b) Value greater than number of starters
    // if (!val) return
    window.console.log('in function fetch ' + val)
    this.start_order = parseInt(val, 10) || null
  },
  
  save: function(){
    var self = this
      , data = self.composeURI(value)
    
    data.result_json = {}
    
    m.request({
      method: 'PUT',
      url   : './climber/single',
      data  : data
    })
    .then(App.connectionStatus(true), App.connectionStatus(false))
  } 
}

App.connectionStatus = m.prop(true)

App.ss = mx.storage( 'session' , mx.SESSION_STORAGE )

App.SuperVC = {
  controller: function(){
    // Symchronise memory and session storage on-load
    var store = App.ss.get('AppState')
    if (!store) { App.ss.set('AppState', App.vm) } 
    else { App.vm = store }
    
  },
  view: function(ctrl){
    return [
      App.headerVC,
      (!!App.vm.vst) ? App.ResultsVC : App.settingsVC
    ]
  }
}
m.mount(document.body, App.SuperVC)
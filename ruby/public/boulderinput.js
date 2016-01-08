/***********************************
* CODEKIT DECLARATIONS
***********************************/
/* global m                       */

var App = App || {}


App.HeaderVC = {
  controller: function(){
    this.title = m.prop(null)
    
    this.toggleSettings = function(){
      window.console.log('toggle settings button')
    }
  },
  
  view: function(ctrl){
    return m("header", { className: App.connection ? 'blue' : 'red' }, [
      m("button", {
        onclick: ctrl.toggleSettings.bind(ctrl),
        square: true
      }, m.trust('&#9776;')),
      m("span.details", App.vm.ttl)
    ])
  }
}

App.ResultsVC = {
  controller: function(){
    this.test = function(e){
      window.console.log("clicked")
    }
  },
  
  view: function(ctrl){
    return m("div#results", {
      onclick: ctrl.test.bind(ctrl)
    }, [
      m.component(App.SearchVC),
      m.component(App.AttemptsVC, { ResParam: "tops", CellName: "Tops" }),
      m.component(App.AttemptsVC, { ResParam: "bons", CellName: "Bonus" }),
      m.component(App.AttemptsVC, { ResParam: "atts", CellName: "Attempts" })
    ])
  }
}

App.SearchVC = {
  controller: function(params){
    
    this.fetch = function(val){
      window.console.log("Get Next Competitor - replace with a call out to the viewmodel "+val)
    }
  },
  
  view: function(ctrl){
    return m("div.search",[
      m("input[type=text]", {
        pattern : '[0-9]',
        onchange: m.withAttr('value', ctrl.fetch.bind(ctrl))
      }),
      m("span.details", "Bacher, Barbara"),
      m("button", {
        square  : true,
        onclick : ctrl.fetch.bind(ctrl) 
      }, m.trust('&#8594;'))
    ])
  }
}

App.AttemptsVC = {
  controller: function(params){
    this.param = params.CellName
    this.value = m.prop(null)
    
    this.changeValue = function(e){
      var i = (e.type === 'swiperight') ? 1 : -1
        , a = this.value() + i 
      
      this.value((a >= 0) ? a : 0)
      m.redraw(true)      
    }
  },
  
  view: function(ctrl){
    var val = (ctrl.value() === null) ? "-" : ctrl.value()
    return m("div.row", [
      m("div.list", ctrl.param),
      m("div.round", val)
    ])
  }
}

App.SettingsVC = {
  controller: function(){

    
    this.fetch = function(){
      // Break if a required value has not been provided...
      // Note that we're not validating date here...
      for (var prop in App.vm) { 
        if (App.vm[prop] === null) {
          window.console.log(prop)
          return
        } 
      }

      m.request({ method: 'GET', url: '/competition',
        data: { wet_id: App.vm.wid }
      })
      .then(function(resp){
        App.connection = true
        try {
          window.console.log('in try')
          var title = resp.title || '-'
          title +=  ' / '+ App.vm.rnd + ' / ' + App.vm.grp + ' / ' + App.vm.prb 
          App.vm.ttl = title
          App.vm.vst = true
          App.ss.set('AppState', App.vm)
          // Colorise the headerbar
        }
        catch (err) { window.console.log('in catch') }
      })
      .then(null, function(err){ 
        // Colorise the headerbar
        App.connection = false
        window.console.log('in fail') 
      })
    }
  },
  view: function(ctrl){
    return m("div#settings",[
      m.component(App.VMParamVC, { key: 'wid', labelText: "competition", pattern: "[0-9]" }),
      m.component(App.VMParamVC, { key: 'rnd', labelText: "round" }),
      m.component(App.VMParamVC, { key: 'grp', labelText: "category" }),
      m.component(App.VMParamVC, { key: 'prb', labelText: "boulder", pattern: "[0-9]" }),
      m("button.save", { 
        type    : "primary", 
        outline : true, 
        upper   : true,
        onclick : ctrl.fetch.bind(ctrl)
      }, "save")
    ])
  }
}

App.VMParamVC = {
  controller: function(params){
    this.params = params

    this.set = function(val){ 
      App.vm[params.key] = val.toUpperCase() || null
    }
  },
  
  view: function(ctrl){
    var params = ctrl.params
    return m("div.modal", [
      m("label", params.labelText),
      m("input[type=text]", {
        onchange: m.withAttr("value", ctrl.set.bind(ctrl)),
        pattern : params.pattern || null,
        value   : App.vm[params.key]//,
        //style   : (App.vm[params.key] === null) ? 'background-color:yellow' : 'none'
      })
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
App.connection = true

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
      App.HeaderVC,
      (!!App.vm.vst) ? App.ResultsVC : App.SettingsVC
    ]
  }
}
m.mount(document.body, App.SuperVC)
/***********************************
* CODEKIT DECLARATIONS
***********************************/
/* global m                       */
/* global App                     */

window.App = window.App || {}

App.VM = function(model){
  return {
  
    // View-Model parameters and functions to link the App.Person model
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
      // Not sure the if test is needed?
      if (attr === 'a') return
      if (!!this.result[attr]) this.result[attr] = 0
    },
  
    serialise: function(){
      var key = 'p' + String(parseInt(App.viewModel.BlcNr, 10))
        , obj = {}, str = ''
      for (var prop in this.result) {
        if (!!this.result[prop]) str += (prop+this.result[prop])
      }
      obj[key] = str
      return JSON.stringify(obj)
    },
  
    fetch: function(val){
      var resp = model.fetch(val)
    
      resp.then(function(){
        var obj = model.resultJSON
          , key = 'p' + String(parseInt(App.viewModel.BlcNr, 10))
        for (var prop in this.result) {
          var str = prop + "[0-9]{1,}"
            , v   = obj[key].match(str) || null
          this.result[prop] = v ? parseInt(v[0].slice(1),10) : null
        }
        this.fullname    = model.fullname
        this.start_order = model.start_order
      }.bind(this))
    },
  
    save: function(){
      var val = this.serialise()
      model.save(val)
    }
  }
}

App.ResultsVC = {
  controller: function(model){
    this.vm = App.VM(model)
    
    this.changeAttempts = function(e){
      var i    = (e.type === 'swipedown') ? 1 : -1
        , atts = this.vm.result.a + i
      
      this.vm.result.a = (atts >= 0) ? atts : 0
      this.vm.save()
      m.redraw(true)
    }
  },
  
  view: function(ctrl){
    var vm = ctrl.vm
    return m("div#results", {
      config  : m.touchHelper({
        'swipedown' : ctrl.changeAttempts.bind(ctrl),
        'swipeup'   : ctrl.changeAttempts.bind(ctrl)
      })
    }, [
      m.component(App.searchSV, vm),
      m.component(App.attemptsSV, vm, { text: "Tops" }),
      m.component(App.attemptsSV, vm, { text: "Bonus" }),
      m.component(App.attemptsSV, vm, { text: "Attempts" })
    ])
  }
}

App.searchSV = {
  controller: function(vm){        
    this.incrementStarter = function(){
      var val = vm.start_order + 1
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

App.attemptsSV = {
  controller: function(vm, params){
    this.prop = params.text[0].toLowerCase()
    
    this.changeValue = function(e){
      // TODO: Disable swipefleft on attepts field...
      if (e.type === 'swiperight') { vm.setResult(this.prop) }
      if (e.type === 'swipeleft')  { vm.resetValues(this.prop) }
      
      vm.save()
      m.redraw(true)
    }
  },
  
  view: function(ctrl, vm, params){
    var val = vm.result[ctrl.prop]

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
/***********************************
* CODEKIT DECLARATIONS
***********************************/
/* global m                       */
/* global App                     */

window.App = window.App || {}

App.ResultsVC = {
  controller: function(vm){
    this.vm = vm
    
    this.changeAttempts = function(e){
      var i    = (e.type === 'swipedown') ? 1 : -1
        , atts = vm.result.a + i
      
      vm.result.a = (atts >= 0) ? atts : 0
      vm.save()
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
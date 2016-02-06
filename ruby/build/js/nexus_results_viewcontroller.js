//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */
/*global mx                                           */

var App = App || {};

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
      m.component(App.PersonSelectorView, vm),
      m.component(App.AttemptsView, vm, { text: "Tops" }),
      m.component(App.AttemptsView, vm, { text: "Bonus" }),
      m.component(App.AttemptsView, vm, { text: "Attempts" })
    ])
  }
}

App.AttemptsView = {
  controller: function(vm, params){
    this.prop   = params.text[0].toLowerCase()
    this.vm     = vm
    this.params = params
    
    this.changeValue = function(e){
      // TODO: Disable swipefleft on attepts field...
      if (e.type === 'swiperight') { vm.setResult(this.prop) }
      if (e.type === 'swipeleft')  { vm.resetValues(this.prop) }
      
      vm.save()
      m.redraw(true)
    }
  },
  
  view: function(ctrl){
    var val = ctrl.vm.result[ctrl.prop]

    return m("div.row", {
      config: m.touchHelper({
        'swiperight' : ctrl.changeValue.bind(ctrl),
        'swipeleft'  : ctrl.changeValue.bind(ctrl)
      })
    }, [
      m("div.list", ctrl.params.text),
      m("div.round", (!val) ? "-" : val)
    ])
  }
}
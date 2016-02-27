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
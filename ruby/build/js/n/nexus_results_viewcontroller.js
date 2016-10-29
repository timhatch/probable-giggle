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

/***********************************
* CODEKIT DECLARATIONS
***********************************/
/* global m                       */
/* global App                     */

window.App = window.App || {}

App.ResultsVC = {
  controller: function(model){
    this.changeAttempts = function(e){
      var i = (e.type === 'swipedown') ? 1 : -1
      model.incrementAttempts(i)
      m.redraw(true)
    }
  },
  
  view: function(ctrl, model){
    return m("div#results", {
      config  : m.touchHelper({
        'swipedown' : ctrl.changeAttempts.bind(ctrl),
        'swipeup'   : ctrl.changeAttempts.bind(ctrl)
      })
    }, [
      m.component(App.searchSV, model),
      m.component(App.attemptsSV, model, { text: "Tops" }),
      m.component(App.attemptsSV, model, { text: "Bonus" }),
      m.component(App.attemptsSV, model, { text: "Attempts" })
    ])
  }
}

App.searchSV = {
  controller: function(model){        
    this.incrementStarter = function(){
      var val = model.start_order + 1
      model.fetch(val)
    }
  },
  
  view: function(ctrl, model){
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
  controller: function(model, params){
    this.prop = params.text[0].toLowerCase()
    
    this.changeValue = function(e){
      if (e.type === 'swiperight') { model.setResult(this.prop) }
      if (e.type === 'swipeleft')  { model.resetResult(this.prop) }
      
      model.save()
      m.redraw(true)
    }
  },
  
  view: function(ctrl, model, params){
    var val = model.result[ctrl.prop]

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
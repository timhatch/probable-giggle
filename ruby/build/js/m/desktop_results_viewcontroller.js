//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */

var App = App || {}

App.ResultsVC = {
  // Controller, calling model and super's results aggregation function
  controller: function(params){
    this.set = function(val){
      params.model.update(val)
      params.vm.save(params.model)
      // TODO: Save here!!!
      params.vm.sumResults()
    }
  },  
  // View declaration  
  view: function(ctrl, params){
    var result = params.model.result
      , value  = result.t || (result.b ? 'b' : null)
    return m('.tile', [
      m('span.bloc', params.model.id), 
      m('input[type=text].textbox', {
        value   : value,
        onchange: m.withAttr('value', ctrl.set.bind(ctrl))
      })
    ])
  }  
}

// Single Result Model / View
//
App.BoulderResultVM = function(id){
  this.id           = 'p'+id
  this.result       = {a:null,b:null,t:null}
}

App.BoulderResultVM.prototype = {
  // Set the model parameters from a passed value
  update: function(val){
    switch (val) {
    case 'b':
      this.result.t = 0
      this.result.a = this.result.a || 3
      this.result.b = this.result.b || 3
      break
    case '1':
    case '2':
    case '3':
      this.result.b = this.result.b || parseInt(val,10)
      this.result.t = this.result.a = parseInt(val,10)
      break
    default:
      this.result.t = this.result.b = this.result.a = null
    }
  }
}
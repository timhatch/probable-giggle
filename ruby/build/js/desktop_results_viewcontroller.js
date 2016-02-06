//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */

var App = App || {}

App.ResultsVC = {
  // Controller, calling model and super's results aggregation function
  controller: function(params){
    this.model = params.model
    
    this.set = function(val){
      params.model.update(val)
      params.addFn()
    }
  },  
  // View declaration  
  view: function(ctrl){
    var result = ctrl.model.result
      , value  = result.t || (result.b ? 'b' : null)
    return m('.tile', [
      m('span.bloc', ctrl.model.id), 
      m('input[type=text].textbox', {
        value   : value,
        onchange: m.withAttr('value', ctrl.set.bind(ctrl))
      }),
      m('span.result', ctrl.model.displayResult)
    ])
  }  
}
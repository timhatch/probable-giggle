//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */

var App = App || {}

App.ResultsViewController = {
  view: function(ctrl, params){
    var createResultCells = function(x, y){
      for (var i = x, a = []; i <= x+y; i++){
        a.push(m.component(App.ResultCell, { vm: params.vm, key: "p"+i }))
      }
      return a
    }
    return m("div", [ 
      createResultCells(params.colstart, params.rows), 
      // m("div", "partial result")
    ])
  }
}

App.ResultCell = {
  controller: function(params){
    this.parse = function(val){
      var result = {a:null,b:null,t:null}
      switch (val) {
      case 'b':
        result.t = 0
        result.a = result.a || 3
        result.b = result.b || 3
        break
      case '1':
      case '2':
      case '3':
        result.b = result.b || parseInt(val,10)
        result.t = result.a = parseInt(val,10)
        break
      default:
        result.t = result.b = result.a = null
      }
      return result
    },
    
    this.set = function(val){
      var temp   = {}
        , target = params.vm.model.data.result_json
        , json
      Object.defineProperty(temp, params.key, { value : null })
      Object.assign(target, temp)
      target[params.key] = this.parse(val)
      
      json = params.vm.model.stringifySingleResult(params.key)
      params.vm.model.save(json)
      params.vm.sumResults()
    }
  },
  
  view: function(ctrl, params){
    var resultsArray = params.vm.model.data.result_json
      , result       = (typeof resultsArray[params.key] === "undefined") ? 
        {a:null,b:null,t:null} : resultsArray[params.key]
      , value        = result.t || (result.b ? "b" : null)
    return m("div.resultrow", [
      m("label", params.key),
      m("input[type=text]", { 
        value   : value,
        onchange: m.withAttr("value", ctrl.set.bind(ctrl))
      })
    ])
  }
}
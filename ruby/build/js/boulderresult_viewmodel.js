//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */

var App = App || {}

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
      this.result.t = this.result.b = this.result.a = 0
    }
  }
}
//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */

var App = App || {}

// Single Result Model / View
//
App.BoulderResultVM = function(id){
  this.id           = 'p'+id
  this.result       = {a:null,b:null,c:null}
  this.displayResult = ''
}

App.BoulderResultVM.prototype = {
  
  // Set the model parameters from a results string
  parse: function(str){
    var t = str.match("t[0-9]{1,}") || null
      , b = str.match("b[0-9]{1,}") || null
      , a = str.match("a[0-9]{1,}") || null
    this.result.a     = a ? parseInt(a[0].slice(1),10) : null
    this.result.b     = b ? parseInt(b[0].slice(1),10) : null
    this.result.t     = t ? parseInt(t[0].slice(1),10) : null
    this.setResultString()
  },
  
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
    this.setResultString()
  },
    
  setResultString: function(){
    var t = !!this.result.t ? 't'+this.result.t : ''
      , b = !!this.result.b ? 'b'+this.result.b : ''
      , a = !!this.result.a ? 'a'+this.result.a : ''
    this.displayResult = t + (b[0] || '')
    this.resultString  = a+b+t
  }
}
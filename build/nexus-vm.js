/***********************************
* CODEKIT DECLARATIONS
***********************************/
/* global m                       */
/* global App                     */

window.App = window.App || {}

App.VM = function(model){  
  return {
    // View-Model parameters and functions to link the App.Person model
    start_order : null,
    fullname    : null, 
    result      : {a: null,b: null,t: null},

    setResult: function(attr){
      if (!this.result[attr]) {
        this.result[attr] = this.result.a
        if (attr === 't' && !this.result.b) this.result.b = this.result.a
      }
    },
  
    resetValues: function(attr){
      // Not sure the if test is needed?
      if (attr === 'a') return
      if (!!this.result[attr]) this.result[attr] = 0
    },
  
    serialise: function(){
      var vm  =  App.sessionStorage.get('AppState')
        , key = 'p' + String(parseInt(vm.BlcNr, 10))
        , obj = {}, str = ''
      
      for (var prop in this.result) {
        if (!!this.result[prop]) str += (prop+this.result[prop])
      }
      obj[key] = str
      return JSON.stringify(obj)
    },
  
    fetch: function(val){
      var resp = model.fetch(val)
    
      resp.then(function(){
        var vm  =  App.sessionStorage.get('AppState')
          , obj = model.resultJSON
          , key = 'p' + String(parseInt(vm.BlcNr, 10))
        for (var prop in this.result) {
          var str = prop + "[0-9]{1,}"
            , v   = obj[key].match(str) || null
          this.result[prop] = v ? parseInt(v[0].slice(1),10) : null
        }
        this.start_order = model.start_order
        this.fullname    = model.fullname
      }.bind(this))
    },
  
    save: function(){
      model.save(this.serialise())
    }
  }
}
//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/* global m                                            */

var App = App || {}

App.VM = function(model, sessiondata){
  return {
    ss          : sessiondata,
    rd          : model,
    blocs       : [1,2,3,4],
    
    // Construct query parameters from stored data on the competition, round and group
    // plus the provided start_order
    composeURLParams: function(){
      var rounds = {"QA":0, "QB":1,"S":2,"F":3,"SF":4}
      var groups = {
          "M":6,"F":5,"MJ":84,"FJ":81,"MA":82,"FA":79,"MB":83,"FB":80,"TM":63,"TF":284,"TO":120
        }

      return {
        wet_id : parseInt(sessiondata.WetId, 10) || 0,
        route  : rounds[sessiondata.Route] || 0,
        grp_id : groups[sessiondata.GrpId] || 1
      }
    },

    //
    //
    fetch: function(val){
      var params = this.composeURLParams()
      
      this.rd.fetch(params)
      .then(function(){ App.connectionStatus(true) })
      .then(null, function(){ App.connectionStatus(false) })
    },
  
    fetchCompetition: function(){
      var w = this.ss.WetId
      m.request({ 
        method: 'GET', 
        url   : '/competition',
        data  : { wet_id: w }
      })
      .then(function(resp){
        try {
          this.ss.comp  = resp
          App.sessionStorage.set('o-appstate', this.ss)          
        }
        catch (err) { window.console.log('invalid response : '+err) }
        this.reset()
      }.bind(this))
      .then(function(){ App.connectionStatus(true) })
      .then(null, function(){ App.connectionStatus(false) })
    },
  
    reset: function(){

    }
  }
}

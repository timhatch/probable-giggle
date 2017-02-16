//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */

var App = App || {}

App.PersonResult = function(uuid){
  this.id     = uuid
  this.params = {}
  this.data   = {}
} 

App.PersonResult.prototype = {
  //  Fetch a single set of results from the server
  //  params can take the form of:
  //  - wet_id, route, grp_id and start_order 
  //  - wet_id, route, per_id
  //
  // TODO: Untested!! THink this.params = params doesn't work as 
  fetch: function(){

  },
  
  update: function(result){
    this.data.result       = result.result
    this.data.result_rank  = result.result_rank
    this.data.sort_values  = result.sort_values
    this.data.result_jsonb = result.result_jsonb
  },
  
  //  Save results for a single person
  //
  save: function(key, value){
    var params = {
      wet_id: this.data.wet_id,
      grp_id: this.data.grp_id,
      route:  this.data.route,
      per_id: this.data.per_id,
      result_jsonb: { [key]: value }
    }
    // window.console.log(params)
    return m.request({
      method: 'PUT',
      url   : '/results/person',
      data  : params
    })
  }
}

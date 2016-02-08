// TODO:  Note that the only difference between PersonResult and RouteResult is the url
//        May be possible to unify the code base
//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */
/*global mx                                           */

var App = App || {};

App.RouteResult = { 
  //  Store the model directly as retrieved from the server (a plain JS object)
  //
  params      : {},
  data        : {},
  
  //  Fetch a single set of results from the server
  //  params can take the form of:
  //  - wet_id, route, grp_id and start_order 
  //  - wet_id, route, per_id
  //
  fetch: function(params){
    this.params = params
    return m.request({
      method : 'GET',
      url    : '/results/route',
      data   : params
    })
    .then(function(resp){
      window.console.log(this.data)
      this.data = resp
      window.console.log(this.data)
    }.bind(this))
  },
    
  //  Save results for a single person
  //  jsonString is a stringified JSON object in the form:
  //  "{\"p2\":\"a2\",\"p1\":\"a3b1t3\"}"
  //
  save: function(jsonString){
  //  window.console.log('save called')
    var params         = this.params
    params.result_json = jsonString
    return m.request({
      method: 'PUT',
      url   : '/results/route',
      data  : params
    })
  }
};
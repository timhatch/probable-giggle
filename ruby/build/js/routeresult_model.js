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
  data        : [],
  
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
      try {
        this.data = resp.map(function(result){
          var person    = new App.PersonResult(result.start_order)
          person.params = Object.assign({start_order: result.start_order}, params)
          person.data   = result
          person.objectifyResults()
          return person
        })
      }
      catch (err) { window.console.log(err) }
    }.bind(this))
  },
  
  updateResults: function(){
    var params = this.params   
    return m.request({
      method : 'GET',
      url    : '/results/route',
      data   : params
    })
    .then(function(resp){
      try {
        resp.forEach(function(result){
          this.data.find(function(res){ return (res.data.per_id === result.per_id) })
          .update(result)
        }.bind(this))
      }
      catch (err) { window.console.log(err) }
    }.bind(this))
  },
    
  //  NOTE: NOT IMPLEMENTED
  //  Save results for a single person
  //  jsonString is a stringified JSON object in the form:
  //  "{\"p2\":\"a2\",\"p1\":\"a3b1t3\"}"
  //
  save: function(){
//    var params     = this.params
//    params.results = jsonString
//    window.console.log(params)

//    return m.request({
//      method: 'PUT',
//      url   : '/results/route',
//      data  : params
//    })
  }
};
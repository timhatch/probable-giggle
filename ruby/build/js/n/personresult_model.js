//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */
/*global mx                                           */

var App = App || {};

App.PersonResult = { 
  //  Store the model directly as retrieved from the server (a plain JS object)
  //  Set wet_id === 999 to guard against data being entered without a specified comp'
  // 
  params      : { wet_id: 999 },
  data        : {},
  
  //  Fetch a single set of results from the server
  //  params take the form of:
  //  - wet_id, route, grp_id and start_order 
  //
  fetch: function(params){
    this.params = params
    return m.request({
      method : 'GET',
      url    : '/results/person',
      data   : params
    })
    .then(function(resp){
      try {
        window.console.log(resp)
        this.data = resp
      } catch  (err) { 
        window.console.log(err)
      }
    }.bind(this))
  },
  
  //  Save results for a single person
  //
  save: function(params){
    return m.request({
      method: 'PUT',
      url   : '/results/person',
      data  : params
    })
  }
};

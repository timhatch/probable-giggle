/***********************************
* CODEKIT DECLARATIONS
***********************************/
/* global m                       */
/* global App                     */

window.App = window.App || {}

App.Person = { 
  //  Store the model directly as retrieved from the server (a plain JS object)
  //
  data        : {},
  
  //  Fetch a single set of results from the server
  //  params can take the form of:
  //  - wet_id, route, grp_id and start_order 
  //  - wet_id, route, per_id
  //
  fetch: function(params){
    return m.request({
      method : 'GET',
      url    : '/results/person',
      data   : params
    })
    .then(function(resp){
      this.data = resp
    }.bind(this))
  },
  
  //  Save results for a single person
  //  jsonString is a stringified JSON object in the form:
  //  "{\"p2\":\"a2\",\"p1\":\"a3b1t3\"}"
  //
  save: function(jsonString){
    window.console.log('save called')
    var params = {
      wet_id     : this.data.wet_id,
      route      : this.data.route,
      grp_id     : this.data.grp_id,
      start_order: this.data.start_order,
      result_json: jsonString
    }
    return m.request({
      method: 'PUT',
      url   : '/results/person',
      data  : params
    })
  }
}
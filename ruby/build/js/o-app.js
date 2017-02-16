//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/* global m                                            */

// @codekit-prepend "./o/_desktop_results_viewcontroller.js"
// @codekit-prepend "./o/_personresult_model.js"

var App = App || {}

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
          window.console.log(result)
          var person    = new App.PersonResult(result.start_order)
          person.params = Object.assign({start_order: result.start_order}, params)
          person.data   = result
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
  }
};



var vm = {
  rd: App.RouteResult, 
  ss: { WetId : null, Route : null, comp  : {title: null}}, 
}

m.mount(document.body, m.component(App.TableViewController, { vm: vm }) )

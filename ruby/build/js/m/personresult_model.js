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
  data        : { result_json: {} },
  
  //  Fetch a single set of results from the server
  //  params can take the form of:
  //  - wet_id, route, grp_id and start_order 
  //  - wet_id, route, per_id
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
        this.data = resp
        this.objectifyResults()              
      } catch  (err) { 
        window.console.log(resp)
      }
    }.bind(this))
  },
  
  // Parse the results_json object from the string form returned (we're not using the 
  // Postgresql JSON extensions yet) into an actual JS object
  objectifyResults: function(){
    var json = this.data.result_json
//    window.console.log(json)
    try {
      var obj = JSON.parse(json)
        , str, val
      for (var boulder in obj) {
        var res = {a:null,b:null,t:null}
        for (var key in res) {
          str = key + "[0-9]{1,}"
          val = obj[boulder].match(str)
          res[key] = val ? parseInt(val[0].slice(1),10) : null
        }
        obj[boulder] = res
      }
      this.data.result_json = obj
      //return obj
    }
    catch (err) { window.console.log(err) }
  },

  stringifySingleResult: function(resID){
    var res = this.data.result_json[resID]
      , obj = {}, str = ""
    for (var key in res){
      if (res[key] !== null) str += (key+res[key])
    }
    obj[resID] = str
    return JSON.stringify(obj)
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
      url   : '/results/person',
      data  : params
    })
  }
};
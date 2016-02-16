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
  fetch: function(params){
    this.params = params
    return m.request({
      method : 'GET',
      url    : '/results/person',
      data   : params
    })
    .then(function(resp){
      this.data = resp
//      this.objectifyResults(resp.result_json)
//      window.console.log()
    }.bind(this))
  },
  
  // Parse the results_json object from the string form returned (we're not using the 
  // Postgresql JSON extensions yet) into an actual JS object
  objectifyResults: function(json){
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
      return obj
    }
    catch (err) { window.console.log(err) }
  },
  
//  stringifyResults: function(results){
//    var obj = {}
//    for (var boulderID in results) {
//      window.console.log(boulderID)
//      var result = results[boulderID], str = ''
//      obj[boulderID] = boulderID
//      for (var key in result) {
//        if (!!result[key]) str += (key+result[key])
//      }
//      obj[boulderID] = str
//    }
//    return obj
//  },
//  
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
    var params         = this.params
    params.result_json = jsonString
    
//    window.console.log(params)
    return m.request({
      method: 'PUT',
      url   : '/results/person',
      data  : params
    })
  }
}
//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */

var blocs = [1,2,3,4]

var sortTable = function(list){
  return {
    onclick: function(e){
      var prop = e.target.getAttribute('data-sort-by')
      if (!!prop) {
        var first = list[0]
        list.sort(function(a, b){
          if (a[prop] > b[prop]) return 1
          if (a[prop] < b[prop]) return -1
          return 0
        })
        if (first === list[0]) list.reverse()
      }
    }
  }
}

var createHeaderRow = function(){
  return m("tr", [
    m('th',          { 'data-sort-by': 'result_rank' }, "Rk"),
    m('th.w12.left', { 'data-sort-by': 'lastname' }, "Lastname"),
    m('th.w09.left', { 'data-sort-by': 'firstname' }, "Firstname"),
    m('th',          { 'data-sort-by': 'nation' }, "IOC  "),
    m('th',          { 'data-sort-by': 'start_order' }, "Sn "),
    m('th.w48.flex', [
      blocs.map(function(bloc_nr){ return m(".bloc", m.trust("p"+bloc_nr)) })        
    ]),
    m("th.w09", "Result"),
  ])
}

var createContentRow = function(person){
  return m("tr", [
    m("td", { result_rank: person.result_rank }, person.result_rank || m.trust('') ),
    m("td.w12.left", person.lastname),
    m("td.w09.left", person.firstname),
    m("td", person.nation),
    m("td", person.start_order),
    m("td.w48.flex",[
      blocs.map(function(bloc_nr){
        return m(".bloc", { key: person.per_id+"."+bloc_nr }, [
          m.component(App.AttemptsSubView, { person: person, id: 'p'+bloc_nr, datatype: "b" }),
          m.component(App.AttemptsSubView, { person: person, id: 'p'+bloc_nr, datatype: "t" })
        ]
      )}.bind(this))       
    ]),
    m("td.w09", person.result)
  ])
}


var App = App || {}

App.TableViewController = {
  controller: function(params){
    params.vm.fetch({ wet_id: 99, route: 2, grp_id: 5 })
  },
  
  view: function(ctrl, params){
    var list  = params.vm.data
    // window.console.log(list)
    return m("table", sortTable(list), [
      createHeaderRow(),
      list.map(function(person){
        return createContentRow(person)
      })
    ])
  }
}

App.AttemptsSubView = {}

App.AttemptsSubView.controller = function(params){
  window.console.log(params)
  // For a given boulder ("id") get the value of an associated property
  // e.g. attempts/bonus/top ("prop")
  this.getPropertyValue = function(id, prop){
    var result = params.person.result_jsonb || {}
    return (!!result[id]) ? result[id][prop] : null
  }
  
  // Reset the result value when a change is made. Show it again when the server is updated
  // Create the result if it doesnt already exist
  // TODO - Highlight changes by adjusting the color of the 
  this.set = function(value){
    var intValue 
    var result = params.person.result_jsonb
    
    // If there is no pre-existing result, create one
    if (!result[params.id]) result[params.id] = { a: 0 } 
    
    // Discard non-numeric inputs
    intValue = parseInt(value,10)
    intValue = isNaN(intValue) ? null : intValue
    
    // Update the results
    result[params.id][params.datatype] = this.prop = intValue        
    result[params.id].a = Math.max(result[params.id].a, this.prop)
    
    // Stringify and then save the result
    // params.person.save(params.id, result[params.id])
    // .then(function(){
    //   params.vm.rd.updateResults()
    // }.bind(this))
  }
}
  
 App.AttemptsSubView.view = function(ctrl, params){
  var val  = ctrl.getPropertyValue(params.id, params.datatype)
  return m("input[type=text]", {
    key        : params.person.per_id+"."+params.id+params.datatype,
    placeholder: params.datatype, 
    value      : isNaN(val) ? m.trust("") : val,
    className  : "connected",
    onchange   : m.withAttr("value", ctrl.set.bind(ctrl)) 
  })
}




//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/* global m                                            */

// @codekit-prepend "./o/_desktop_results_viewcontroller.js"

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
  fetch: function(params){
    return m.request(        {
      method : 'GET',
      url    : '/results/route',
      data   : params
    })
    .then(function(resp){
      this.data = resp
    }.bind(this))
  },
  
  updateResults: function(){
  }
  //   var params = this.params   
  //   return m.request({
  //     method : 'GET',
  //     url    : '/results/route',
  //     data   : params
  //   })
  //   .then(function(resp){
  //     try {
  //       resp.forEach(function(result){
  //         this.data.find(function(res){ return (res.data.per_id === result.per_id) })
  //         .update(result)
  //       }.bind(this))
  //     }
  //     catch (err) { window.console.log(err) }
  //   }.bind(this))
  // }
};



var vm = {
  rd: App.RouteResult 
}

m.mount(document.body, m.component(App.TableViewController, { vm: App.RouteResult }) )



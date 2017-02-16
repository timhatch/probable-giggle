//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */

var sortTable = function(list){
  return {
    onclick: function(e){
      var prop = e.target.getAttribute('data-sort-by')
      if (!!prop) {
        var first = list[0]
        list.sort(function(a,b){
          return a.data[prop] > b.data[prop] ? 1 : a.data[prop] < b.data[prop] ? -1 : 0
        })
      if (first === list[0]) list.reverse()
      }
    }
  }
}

var blocs = [1,2,3,4]

var createHeaderRow = function(){
  return m("tr", [
    m('th', { 'data-sort-by': 'result_rank' }, "Rk"),
    m('th', { 'data-sort-by': 'lastname', class: 'w12 left' }, "Lastname"),
    m('th', { 'data-sort-by': 'firstname', class: 'w09 left' }, "Firstname"),
    m('th', { 'data-sort-by': 'nation' }, "IOC  "),
    m('th', { 'data-sort-by': 'start_order' }, "Sn "),
    m('th.w48.flex', [
      blocs.map(function(bloc_nr){
        return m(".bloc", m.trust("p"+bloc_nr))
      })        
    ]),
    m("th.w09", "Result"),
  ])
}

var createContentRow = function(_params){
  var vm   = _params.vm
  var data = _params.person.data
  return m("tr", [
    m("td", data.result_rank || m.trust(''), { result_rank: data.result_rank }),
    m("td.w12.left", data.lastname),
    m("td.w09.left", data.firstname),
    m("td", data.nation),
    m("td", data.start_order),
    m("td", data.per_id),
    m("td.w48.flex",[
      blocs.map(function(bloc_nr){
        var id  ='p'+bloc_nr
        var who = _params.person
        return m(".bloc", { key: data.per_id+"."+bloc_nr }, [
          m.component(App.AttemptsSubView, { vm: vm, person: who, id: id, datatype: "b" }),
          m.component(App.AttemptsSubView, { vm: vm, person: who, id: id, datatype: "t" })
        ]
      )}.bind(this))       
    ]),
    m("td.w09", data.result)
  ])
}


var App = App || {}

App.TableViewController = {
  controller: function(params){
    params.vm.rd.fetch({ wet_id: 99, route: 2, grp_id: 5 })
    
  },
  
  view: function(ctrl, params){
    var list  = params.vm.rd.data
    return m("table", sortTable(list), [
      createHeaderRow(),
      list.map(function(person){
        return createContentRow({vm: params.vm, person: person })
      })
    ])
  }
}

App.AttemptsSubView = {
    controller: function(params){
      // For a given boulder ("id") get the value of an associated property
      // e.g. attempts/bonus/top ("prop")
      this.getPropertyValue = function(id, prop){
        var result = params.person.data.result_jsonb || {}
        return (!!result[id]) ? result[id][prop] : null
      }
      
      // Reset the result value when a change is made. Show it again when the server is updated
      // Create the result if it doesnt already exist
      // TODO - Highlight changes by adjusting the color of the 
      this.set = function(value){
        var intValue 
        var result = params.person.data.result_jsonb
        
        // If there is no  pre-existing result, create one
        if (!result[params.id]) { 
          result[params.id] = {a:0} 
        }
        
        // Discard non-numeric inputs
        intValue = parseInt(value,10)
        intValue = isNaN(intValue) ? null : intValue
        
        // Update the results
        result[params.id][params.datatype] = this.prop = intValue        
        result[params.id].a = Math.max(result[params.id].a, this.prop)
        
        // Stringify and then save the result
        params.person.save(params.id, result[params.id])
        .then(function(){
          params.vm.rd.updateResults()
        }.bind(this))
      }
    },
  
    view: function(ctrl, params){
      var data = params.person.data
        , val  = ctrl.getPropertyValue(params.id, params.datatype)
      return m("input[type=text]", {
        key        : data.per_id+"."+params.id+params.datatype,
        placeholder: params.datatype, 
        value      : isNaN(val) ? m.trust("") : val,
        className  : "connected",
        onchange   : m.withAttr("value", ctrl.set.bind(ctrl)) 
      })
    }
  }


//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */

var App = App || {}

App.TableViewController = {
  controller: function(){
        
    this.delete = function(){
      alert('starter deletion not yet implemented')
    }
    
    this.sorts = function(list){
      return {
        onclick: function(e){
          var prop = e.target.getAttribute("data-sort-by")
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
  },
  
  view: function(ctrl, params){
    var list  = params.vm.rd.data
      , blocs = params.vm.blocs
    return m("table", ctrl.sorts(list), [
      App[params.type].createHeaderRow(blocs),
      list.map(function(person){
        var _params = {vm: params.vm, person: person }
        return App[params.type].createContentRow(ctrl, _params)
      })
    ])
  }
}

App.Results = {
  createHeaderRow: function(blocs){
    return m("tr", [
      m("th[data-sort-by=result_rank]", "Rk"),
      m("th[data-sort-by=lastname].w12.left", "Lastname"),
      m("th[data-sort-by=firstname].w09.left", "Firstname"),
      m("th[data-sort-by=nation]", "IOC "),
      m("th[data-sort-by=start_order]", "Sn "),
//      m("th[data-sort-by=per_id]", "UUID"),
      m("th.w48.flex", [
        blocs.map(function(bloc_nr){
          return m(".bloc", m.trust("p"+bloc_nr))
        })        
      ]),
      m("th.w09", "Result"),
    ])
  },

  createContentRow: function(ctrl, _params){
    var vm   = _params.vm
      , data = _params.person.data
    return m("tr", [
      m("td", data.result_rank || m.trust(''), { result_rank: data.result_rank }),
      m("td.w12.left", data.lastname),
      m("td.w09.left", data.firstname),
      m("td", data.nation),
      m("td", data.start_order),
//      m("td", data.per_id),
      m("td.w48.flex",[
        vm.blocs.map(function(bloc_nr){
          var id  ='p'+bloc_nr
            , who = _params.person
          return m(".bloc", { key: data.per_id+"."+bloc_nr }, [
            m.component(this.AttemptsSubView, { vm: vm, person: who, id: id, datatype: "b" }),
            m.component(this.AttemptsSubView, { vm: vm, person: who, id: id, datatype: "t" })
          ]
        )}.bind(this))       
      ]),
      m("td.w09", data.result)
    ])
  },
  
  AttemptsSubView: {
    controller: function(params){
      this.responseStatus   = m.prop(true)
      // For a given boulder ("id") get the value of an associated property
      // e.g. attempts/bonus/top ("prop")
      this.getPropertyValue = function(id, prop){
        var result = params.person.data.result_jsonb
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
          this.responseStatus(true)
        }.bind(this))
        .then(null,function(){this.responseStatus(false)}.bind(this))
      }
    },
  
    view: function(ctrl, params){
      var data = params.person.data
        , val  = ctrl.getPropertyValue(params.id, params.datatype)
      return m("input[type=text]", {
        key        : data.per_id+"."+params.id+params.datatype,
        placeholder: params.datatype, 
        value      : isNaN(val) ? m.trust("") : val,
        className  : ctrl.responseStatus() ? "connected" : "disconnected",
        onchange   : m.withAttr("value", ctrl.set.bind(ctrl)) 
      })
    }
  }
}

App.Starters = {
  createHeaderRow: function(){
    return m("tr", [
      m("th[data-sort-by=start_order]", "Sn"),
      m("th[data-sort-by=lastname].w12.left", "Lastname"),
      m("th[data-sort-by=firstname].w09.left", "Firstname"),
      m("th[data-sort-by=nation]", "IOC"),
      m("th[data-sort-by=per_id]", "ID"),
      m("th[data-sort-by=rank_prev_heat]", "Prev Heat"),
      m("th", m.trust(""))      
    ])
  },

  createContentRow: function(ctrl, _params){
    var who  = _params.person
      , data = _params.person.data
    return m("tr", [
      m("td", data.start_order),
      m("td.w12.left", data.lastname),
      m("td.w09.left", data.firstname),
      m("td", data.nation),
      m("td", data.per_id),
      m("td", data.rank_prev_heat || m.trust("NA")),
      m("td", [ m("button[outline=true].icon-trash-empty", { onclick: ctrl.delete.bind(who) }) ])
    ])
  }  
}

App.Scores = {
  createHeaderRow: function(){
    return m("tr", [
      m("th[data-sort-by=start_order]", "Sn"),
      m("th.w12.left", "Lastname"),
      m("th.w09.left", "Firstname"),
      m("th", "IOC"),
//      m("th", "UUID"),
      m("th.w48", "Score"),
      m("th.w09", "Result")      
    ])
  },

  createContentRow: function(ctrl, _params){
    var data = _params.person.data
    return m("tr", [
      m("td", data.start_order),
      m("td.w12.left", data.lastname),
      m("td.w09.left", data.firstname),
      m("td", data.nation),
//      m("td", data.per_id),
      m("td.w48"),
      m("td.w09")
    ])
  }  
}

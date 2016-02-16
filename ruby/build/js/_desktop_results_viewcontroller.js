//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */

var App = App || {}

App.TableViewController = {
  controller: function(params){
    this.model = params.model
    this.blocs = params.blocs
    this.type  = params.type
        
    this.delete = function(){
      alert('starter deletion not yet implemented')
    }
    
    this.sorts = function(){
      var list = this.model.data
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
  
  view: function(ctrl){
    return m("table", ctrl.sorts(), [
      App[ctrl.type].createHeaderRow(ctrl),
      ctrl.model.data.map(function(person){
        return App[ctrl.type].createContentRow(ctrl, person)
      })
    ])
  }
}

App.Results = {
  createHeaderRow: function(ctrl){
    return m("tr", [
      m("th[data-sort-by=result_rank]", "Rk"),
      m("th[data-sort-by=lastname].w12.left", "Lastname"),
      m("th[data-sort-by=firstname].w09.left", "Firstname"),
      m("th[data-sort-by=nation]", "IOC "),
      m("th[data-sort-by=start_order]", "Sn "),
//      m("th[data-sort-by=per_id]", "UUID"),
      m("th.w45.flex", [
        ctrl.blocs.map(function(bloc_nr){
          return m(".bloc", m.trust("p"+bloc_nr))
        })        
      ]),
      m("th.w09", "Result"),
      m("th.w03")
    ])
  },

  createContentRow: function(ctrl, person){
    var data = person.data
    return m("tr", {id: person.data.per_id}, [
      m("td", data.result_rank || m.trust(''), { result_rank: data.result_rank }),
      m("td.w12.left", data.lastname),
      m("td.w09.left", data.firstname),
      m("td", data.nation),
      m("td", data.start_order),
//      m("td", data.per_id),
      m("td.w45.flex",[
        ctrl.blocs.map(function(bloc_nr){
          var id    ='p'+bloc_nr
          return m(".bloc", { key: data.per_id+"."+bloc_nr }, [
            m.component(this.AttemptsSubView, { person: person, id: id, datatype: "b" }),
            m.component(this.AttemptsSubView, { person: person, id: id, datatype: "t" })
          ]
        )}.bind(this))       
      ]),
      m("td.w09", data.result)
    ])
  },
  
  AttemptsSubView: {
    controller: function(params){
      this.per_id = params.person.data.per_id
      this.result = params.person.data.result_json
      this.id     = params.id
      this.text   = params.datatype
      // Check if the result alrady exists
      this.prop   = (!!this.result[params.id]) ? this.result[params.id][params.datatype] : null

      // Reset the result value when a change is made. Show it again when the server is updated
      // Create the result if it doesnt already exist
      // TODO - Highlight changes by adjusting the color of the 
      this.set = function(value){
        
        // If there is no  pre-existing result, create one
        if (!this.result[params.id]) { 
          this.result[params.id] = {a:0} 
        }
        
        // Discard non-numeric inputs
        var int_val 
        int_val = parseInt(value,10)
        int_val = isNaN(int_val) ? null : int_val
        
        // Update the results
        this.result[params.id][params.datatype] = this.prop = int_val        
        this.result[params.id].a = Math.max(this.result[params.id].a, this.prop)

        // Stringify and then save the result
        var str = params.person.stringifySingleResult(params.id)
        params.person.save(str) 
      }
    },
  
    view: function(ctrl){
      return m("input[type=text]", {
        key        : ctrl.per_id+"."+ctrl.id+ctrl.text,
        placeholder: ctrl.text, 
        value      : (ctrl.prop !== null) ? ctrl.prop : m.trust(""),
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

  createContentRow: function(ctrl, person){
    var data = person.data
    return m("tr", [
      m("td", data.start_order),
      m("td.w12.left", data.lastname),
      m("td.w09.left", data.firstname),
      m("td", data.nation),
      m("td", data.per_id),
      m("td", data.rank_prev_heat || m.trust("NA")),
      m("td", [ m("button[outline=true].icon-trash-empty", { onclick: ctrl.delete.bind(person) }) ])
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

  createContentRow: function(ctrl, person){
    var data = person.data
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
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
    
    // Called with context "person"
    this.save = function(){
      var results = this.data.result_json
        , obj     = this.stringifyResults(results)
      this.save(JSON.stringify(obj)) 
    }
    
    this.delete = function(){
      window.console.log('not implemented yet')
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
      App[ctrl.type].createHeaderRow(),
      ctrl.model.data.map(function(person){
        return App[ctrl.type].createContentRow(ctrl, person)
      })
    ])
  }
}

App.ResultsTable = {
  createHeaderRow: function(){
    return m("tr", [
      m("th[data-sort-by=result_rank]", "Rank"),
      m("th[data-sort-by=lastname]", "Lastname"),
      m("th[data-sort-by=firstname]", "Firstname"),
      m("th[data-sort-by=nation]", "Nation"),
      m("th[data-sort-by=start_order]", "Start Nr"),
      m("th[data-sort-by=per_id]", "UUID"),
      m("th", "Scores"),
      m("th", "Result"),
      m("th", m.trust(""))      
    ])
  },

  createContentRow: function(ctrl, person){
    var data = person.data
    return m("tr", [
      m("td", data.result_rank || m.trust(''), { result_rank: data.result_rank }),
      m("td", data.lastname),
      m("td", data.firstname),
      m("td", data.nation),
      m("td", data.start_order),
      m("td", data.per_id),
      m("td", [
        ctrl.blocs.map(function(bloc_nr){
          var id ='p'+bloc_nr
          return [
            m('span', id), 
            m.component(this.AttemptsSubView, { person: data, id: id, datatype: "b" }),
            m.component(this.AttemptsSubView, { person: data, id: id, datatype: "t" })
          ]
        }.bind(this))       
      ]),
      m("td", data.result),
      m("td", [ m("button", { onclick: ctrl.save.bind(person) }, "Save") ])
    ])
  },
  
  AttemptsSubView: {
    controller: function(params){
      this.result = params.person.result_json
      this.id     = params.id
      this.text   = params.datatype
      // Check if the result alrady exists
      this.prop   = (!!this.result[params.id]) ? this.result[params.id][params.datatype] : null

      // Reset the result value when a change is made. Show it again when the server is updated
      // Create the result if it doesnt already exist
      // TODO - Highlight changes by adjusting the color of the 
      this.set = function(value){
        if (!this.result[params.id]) { this.result[params.id] = {a:0} }
        this.result[params.id][params.datatype] = this.prop = parseInt(value,10) || null
        this.result[params.id].a = Math.max(this.result[params.id].a, this.prop)
      }
    },
  
    view: function(ctrl){
      return m("input[type=text]", {
        placeholder: ctrl.text, 
        value      : ctrl.prop || m.trust(""),
        onchange   : m.withAttr("value", ctrl.set.bind(ctrl)) 
      })
    }
  }
}

App.StartlistTable = {
  createHeaderRow: function(){
    return m("tr", [
      m("th[data-sort-by=start_order]", "Start Nr"),
      m("th[data-sort-by=lastname]", "Lastname"),
      m("th[data-sort-by=firstname]", "Firstname"),
      m("th[data-sort-by=nation]", "Nation"),
      m("th[data-sort-by=per_id]", "UUID"),
      m("th[data-sort-by=rank_prev_heat]", "Last Round"),
      m("th", m.trust(""))      
    ])
  },

  createContentRow: function(ctrl, person){
    var data = person.data
    return m("tr", [
      m("td", data.start_order),
      m("td", data.lastname),
      m("td", data.firstname),
      m("td", data.nation),
      m("td", data.per_id),
      m("td", data.rank_prev_heat || m.trust("NA")),
      m("td", [ m("button", { onclick: ctrl.delete.bind(person) }, "Delete") ])
    ])
  }  
}

App.ScoresheetTable = {
  createHeaderRow: function(){
    return m("tr", [
      m("th[data-sort-by=start_order]", "Start Nr"),
      m("th", "Lastname"),
      m("th", "Firstname"),
      m("th", "Nation"),
      m("th", "UUID"),
      m("th", "Score"),
      m("th", "Result")      
    ])
  },

  createContentRow: function(ctrl, person){
    var data = person.data
    return m("tr", [
      m("td", data.start_order),
      m("td", data.lastname),
      m("td", data.firstname),
      m("td", data.nation),
      m("td", data.per_id),
      m("td"),
      m("td")
    ])
  }  
}

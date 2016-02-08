//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */

var App = App || {}

App.ResultsVC = {
  // Controller, calling model and super's results aggregation function
  controller: function(params){
    this.model = params.model
    this.blocs = params.blocs
    
    this.save  = function(){
      var results = this.model.data.result_json
        , obj     = this.model.stringifyResults(results)
        
      this.model.save(JSON.stringify(obj))      
    }    
  },  
  // View declaration  
  view: function(ctrl){
    var person = ctrl.model.data

    return m("tr", [
      m("td", person.result_rank || m.trust('')),
      m("td", person.lastname),
      m("td", person.firstname),
      m("td", person.nation),
      m("td", person.start_order),
      m("td", person.per_id),
      m("td", [
        ctrl.blocs.map(function(bloc_nr){
          var id ='p'+bloc_nr
          return [
            m('span', id), 
            m.component(App.AttemptsView, { person: person, id: id, datatype: "b" }),
            m.component(App.AttemptsView, { person: person, id: id, datatype: "t" })
          ]
        })       
      ]),
      m("td", person.result),
      m("td", [ m("button", { onclick: ctrl.save.bind(ctrl) }, "Save") ])
    ])
  }  
}

App.AttemptsView = {
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

App.HeaderRow = {
  controller: function(params){
    
  },
  
  view: function(ctrl){
    return m("tr", [
      m("th[data-sort-by=data.result_rank]", "Rank"),
      m("th[data-sort-by=lastname]", "Lastname"),
      m("th[data-sort-by=firstname]", "Firstname"),
      m("th[data-sort-by=nation]", "Nation"),
      m("th[data-sort-by=start_order]", "Start Nr"),
      m("th[data-sort-by=per_id]", "UUID"),
      m("th", "Scores"),
      m("th", "Result"),
      m("th", m.trust(""))      
    ])
  }
}
/***********************************
* CODEKIT DECLARATIONS
***********************************/
/* global m                       */

var App = App || {}
 
App.CompetitionVC = {
  // Application controller  
  controller: function(params){
    this.WetId  = params.wetid
    this.Title  = params.title
    this.Person = new App.MPerson(this.WetId)
  },   
  // View declaration  
  view: function(ctrl){
    var person = ctrl.Person
    return [
      m('h3.title', ctrl.Title),
      m.component(App.VPerson, person),
      m.component(App.VResultList, person),
      m('button', { onclick : person.save.bind(person) }, 'Submit')
    ]
  }
}

// General purpose Climber model
//
App.MPerson = function(wetid){
  // TODO: In principle we also need the route parameter... 
  this.WetId      = wetid || 1
  this.Route      = 0
  this.perId      = m.prop(null) 
  this.name       = m.prop(null) 
  this.category   = m.prop(null) 
  this.resultJSON = m.prop(null)
  this.result     = m.prop(null)          
  this.resArray   = (function(){
    for (var i = 1, a = []; i <= 30; i++) { a.push(new App.MResult(i)) }
    return a
  })()

  this.sumResults = function(){
    var x = 0, y = 0
    this.resArray.forEach(function(model){  
      x += model.score(); y += model.bonus()
    })
    this.result(x+' / '+y)  // window.console.log(x+' / '+y)
  }

  this.fetch = function(val){
    var _this = this
    m.request({ 
      method: 'GET', 
      url: '/climber', 
      data: { 
        'wet_id': this.WetId, 
        'route' : this.Route, 
        'per_id': val } 
    })
    .then(function(v){
      window.console.log(v)
      try {
        _this.perId(v.per_id)
        _this.name(v.lastname+', '+v.firstname[0])
        _this.category(v.category)
        _this.resultJSON(JSON.parse(v.result_json))
        _this.result(v.result)
        
        _this.resArray.forEach(function(res){
          var r = _this.resultJSON()[res.id]
          res.parse(r ? r : '')
        })
      } 
      catch (err) { window.console.log(err) }      
    })
    .then(null, function(err){ window.console.log(err) })
  }

  this.save = function(){
    var tmp = {}
    this.resArray
    .filter(function(res){ return res.result })
    .forEach(function(res){ tmp[res.id] = res.result })
    
    m.request({
      method: 'PUT', 
      url   : '/climber', 
      data  : { 
        "wet_id"      : this.WetId,
        "route"       : this.Route,
        "per_id"      : this.perId(), 
        "result_json" : JSON.stringify(tmp)
      }
    })
    .then(function(response){ window.console.log(response) })
  }
}
App.VPerson = {
  view: function(ctrl, person){
    return m('.header', [
      m('span.bloc', 'PerId:'),
      m('input[type=text].textbox', {
        pattern : '[0-9]*',
        value   : person.perId(), 
        onchange: m.withAttr('value', person.fetch.bind(person))
      }),
      m('span#grpid', person.category()),
      m('span#name',  person.name()),
      m('span#result', person.result()),
    ])
  }
}

// Single Result Model / View
//
App.MResult = function(id){
  this.id    = 'p'+id
  this.score = m.prop(0)
  this.bonus = m.prop(0)
}
App.MResult.prototype = {
 // Set the model parameters from a results string
  parse: function(str){
    var t = str.match("t[0-9]{1,}") || null
      , b = str.match("b[0-9]{1,}") || null
    t = t ? parseInt(t[0].slice(1),10) : null
    b = b ? parseInt(b[0].slice(1),10) : null
    this.result = str
    this.score(t ? [10,7,4][t-1] : 0)
    this.bonus((t || b) ? 1 : 0) 
  },
  // Set the model parameters from a passed value
  update: function(val){
    var n = parseInt(val, 10)
      , x = [10,7,4].indexOf(n)
      , y = [10,7,4,1].indexOf(n)
      , t = (x > -1) ? n : 0
      , b = (y > -1) ? 1 : 0
    this.result = t ? 't'+(x+1) : (b ? 'b1' : null)
    this.score(t)
    this.bonus(b)
  }
}

App.VResult = {
  // Controller, calling model and super's results aggregation function
  controller: function(params){
    this.model = params.model
    
    this.set = function(val){
      params.model.update(val)
      params.addFn()
    }
  },  
  // View declaration  
  view: function(ctrl){
    var toggles = {
          ong : { view: function(){ return  m("span.flag.noerror", m.trust('&nbsp;'))}}, 
          onr : { view: function(){ return  m("span.flag.error", m.trust('&nbsp;'))}}, 
          off : { view: function(){ return  m("span.flag", m.trust('&nbsp;'))}}
        }
    return m('.tile', [
      m('span.bloc', ctrl.model.id), 
      m('input[type=text].textbox', {
        pattern : '[0-9]*', 
        value   : ctrl.model.score() || ctrl.model.bonus() || null,
        onchange: m.withAttr('value', ctrl.set.bind(ctrl))
      }),
      m.component(ctrl.model.score() === 10 ? toggles.ong : toggles.off),
      m.component(ctrl.model.score() ===  7 ? toggles.ong : toggles.off),
      m.component(ctrl.model.score() ===  4 ? toggles.ong : toggles.off),
      m.component(ctrl.model.bonus() ===  1 ? toggles.ong : toggles.off) 
    ])
  }  
}

// Compose a view from a Results Array
//
App.VResultList = {
  view: function(ctrl, person) {
    return m('#tiles', [
      person.resArray.map(function(bloc) { 
        return m.component(App.VResult, { model: bloc, addFn: person.sumResults.bind(person) }) 
      })
    ])
  }
}
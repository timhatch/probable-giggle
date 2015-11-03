/***********************************
* CODEKIT DECLARATIONS
***********************************/
/* global m                       */

var App = App || {}
 
App.CompetitionVC = {
  // Application controller  
  controller: function(params){
    this.wetid   = params.wetid
    this.title   = params.title
    this.climber = new App.ClimberM(this.wetid)
  },   
  // View declaration  
  view: function(ctrl){
    return [
      m('h3.title', ctrl.title),
      m.component(App.ClimberV, ctrl.climber),
      m.component(App.ResultArrayV, ctrl.climber),
      m('button', { onclick : ctrl.save }, 'Submit')
    ]
  }
}

// General purpose Climber model
//
App.ClimberM = function(wetid){
  this.WetId      = wetid
  this.PerId      = m.prop(null) 
  this.Name       = m.prop(null) 
  this.Category   = m.prop(null) 
  this.ResString  = m.prop(null)
  this.ResSummary = m.prop(null)           
  this.ResArray   = (function(){
    for (var i = 1, a = []; i <= 30; i++) { a.push(new App.ResultM(i)) }
    return a
  })()
  
  this.sumResults = function(){
    var x = 0, y = 0
    this.ResArray.forEach(function(model){  
      x += model.score(); y += model.bonus()
    })
    this.ResSummary(x+' / '+y)  // window.console.log(x+' / '+y)
  }.bind(this)
  
  this.fetch = function(val){
    var _this = this
    m.request({ method: 'GET', url: '/climber', data: { 'PerId': val, 'WetId': this.WetId } })
    .then(function(v){
      try {
        _this.PerId(v.PerId)
        _this.Name(v.Lastname+', '+v.Firstname[0])
        _this.Category(v.Category)
        _this.ResString(JSON.parse(v.ResString))
        _this.ResSummary(v.ResSummary)
      
        _this.ResArray.forEach(function(res){
         var r = _this.ResString()[res.id]
         res.parse(r ? r : '')
        })
      } 
      catch (err) { window.console.log(err) }      
    })
    .then(null, function(err){ window.console.log(err) })
  }.bind(this)
  
  this.save = function(){
    var tmp = {}
    this.ResArray
    .filter(function(res){ return res.result })
    .forEach(function(res){ tmp[res.id] = res.result })
      
    m.request({
      method: 'POST', 
      url   : './test', 
      data  : { 
        "WetId"     : this.WetId,
        "PerId"     : this.PerId(), 
        "ResString" : JSON.stringify(tmp),
        "ResSummary": this.ResSummary()
      }
    })
    .then(function(response){ window.console.log(response) })
  }.bind(this)
}

// Compose a view from for a Climber
//
App.ClimberV = {
  view: function(ctrl, climber){
    return m('.header', [
      m('span.bloc', 'PerId:'),
      m('input[type=text].textbox', {
        pattern : '[0-9]*',
        value   : climber.PerId(), 
        onchange: m.withAttr('value', climber.fetch)
      }),
      m('span#grpid', climber.Category()),
      m('span#name',  climber.Name()),
      m('span#result', climber.ResSummary()),
    ])
  }
}

// Compose a view from a Results Array
//
App.ResultArrayV = {
  view: function(ctrl, climber) {
    return m('#tiles', [
      climber.ResArray.map(function(bloc) { 
        return m.component(App.ResultVC, { model: bloc, addFn: climber.sumResults }) 
      })
    ])
  }
}

// SIngle Boulder Result Model
//
App.ResultM = function(id){
  this.id    = 'p'+id
  this.score = m.prop(0)
  this.bonus = m.prop(0)
  // Set the model parameters from a results string
  this.parse = function(str){
    var t = str.match("t[0-9]{1,}") || null
    var b = str.match("b[0-9]{1,}") || null
    t = t ? parseInt(t[0].slice(1),10) : null
    b = b ? parseInt(b[0].slice(1),10) : null

    this.result = str
    this.score(t ? [10,7,4][t-1] : 0)
    this.bonus((t || b) ? 1 : 0) 
  }
  // Set the model parameters from a passed value
  this.set = function(val){
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

// SIngle Boulder Result View
App.ResultVC = {
  // Controller, calling model and super's results aggregation function
  controller: function(params){
    this.model = params.model
    
    this.set = function(val){
      params.model.set(val)
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
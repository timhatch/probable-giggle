/***********************************
* CODEKIT DECLARATIONS
***********************************/

/* global m        */

var app = app || {}
 
app.competition_vc = {
  
  controller: function(params){
    this.wetid    = params.wetid
    this.title    = params.title
    this.climber  = new app.climber_m()
    this.bloclist = []
    for (var i = 1; i <= 30; i++) { this.bloclist.push(new app.result_m(i)) }
    
    // Controller Actions
    this.postResults = function(){
      window.console.log(this.bloclist)
    } 
  },
    
  view: function(ctrl){
    return [
      m('h3.title', ctrl.title),
      m.component(app.climber_vc, ctrl.climber),
      m.component(app.results_vc, ctrl.bloclist ),
      m('button', { onclick : ctrl.postResults.bind(ctrl) }, 'Submit')
    ]
  }
}

app.climber_m = function(){
  this.perid    = m.prop(null) 
  this.name     = m.prop(null) 
  this.category = m.prop(null) 
  this.results  = m.prop(null)
}

app.climber_vc = {
  controller: function(model){ return model },
  
  // NOTE: There is some question over the relative efficiency of usign bind()
  fetch: function(val){
    var success = function(v){ 
          try {
            this.perid(v.PerId); this.name(v.Lastname+', '+v.Firstname[0])
            this.category(v.Category); this.results(JSON.parse(v.ResString))
          } catch (err) { 
            this.perid(null); this.name(null)
            this.category(null); this.results(null)
          }
        }.bind(this)
      , error   = function(err){ window.console.log(err) }

    m.request({ method: 'GET', url: '/climber?PerId='+val })
    .then(success, error)
  },
     
  view: function(ctrl){
    return m('.header', [
      m('span.bloc', 'PerId:'),
      m('input[type=text].textbox', {
        pattern : '[0-9]*',
        value   : ctrl.perid(), 
        onchange: m.withAttr('value', this.fetch.bind(ctrl))
      }),
      m('span#grpid', ctrl.category()),
      m('span#name',  ctrl.name()),
      m('span#result', 'todo'),
    ])
  }
}
// m.mount(document.querySelector('.header'), app.climber)

app.results_vc = {
  view: function(ctrl, models) {
    return m('#tiles', [
      models.map(function(model) { return m.component(app.result_vc, model) })
    ])
  }
}

app.result_m = function(id){
  this.id     = 'p'+id
  this.result = m.prop(null)
  this.score  = m.prop(0)
  this.bonus  = m.prop(0)
  this.temp   = null
}

app.result_vc = {
  
  controller: function(model){ return model },

  // Model -- Parse data ...    
  parse: function(val){
    var t = val.match("t[0-9]{1,}") || null
      , b = val.match("b[0-9]{1,}") || null
    
    t = t ? parseInt(t[0].slice(1),10) : null
    b = b ? parseInt(b[0].slice(1),10) : null
    
    // TODO
    // this.score  = t ? [10,7,4][t-1] : (b ? 1 : 0)    
    this.result = val
  },
  
  // Model -- Update the model parameters from a text input
  update: function(val){
    var n = parseInt(val, 10)
      , t = ([10,7,4].indexOf(n) > -1) ? n : 0
      , b = ([10,7,4,1].indexOf(n) > -1) ? 1 : 0
    
    this.result(t ? 't'+t : ( b ? 'b1' : null))
    this.score(t)
    this.bonus(b)
    this.temp = t
  },
  
  // View declaration  
  view: function(ctrl){
    var toggles = {
          ong : { view: function(){ return  m("span.flag.noerror", m.trust('&nbsp;'))}}, 
          onr : { view: function(){ return  m("span.flag.error", m.trust('&nbsp;'))}}, 
          off : { view: function(){ return  m("span.flag", m.trust('&nbsp;'))}}
        }
    
    return m('.tile', [
      m('span.bloc', ctrl.id), 
      m('input[type=text].textbox', {
        pattern : '[0-9]*', 
        value   : ctrl.score() || ctrl.bonus() || null,
        onchange: m.withAttr('value', this.update.bind(ctrl))
      }),
      m.component(ctrl.score() === 10 ? toggles.ong : toggles.off),
      m.component(ctrl.score() ===  7 ? toggles.ong : toggles.off),
      m.component(ctrl.score() ===  4 ? toggles.ong : toggles.off),
      m.component(ctrl.bonus() ===  1 ? toggles.ong : toggles.off) 
    ])
  }  
}
//m.mount(document.querySelector('#tiles'), app.bloc)

var c = m.component(app.competition_vc, { wetid: 1030, title: 'CWIF 2015' })
m.mount(document.querySelector('#inner'), c)
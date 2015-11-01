/***********************************
* CODEKIT DECLARATIONS
***********************************/

/* global m        */
var app = app || {}
 
app.competition_vc = {
  
  controller: function(params){
    this.wetid   = params.wetid
    this.title   = params.title
    this.climber = new app.climber_m()
    this.func    = m.prop({})
    
    this.resArr  = []
    for (var i = 1; i <= 30; i++) { this.resArr.push(new app.result_m(i)) }
    //
    /// Controller Actions
    this.postResults = function(){
      var tmp = {}
      this.resArr
      .filter(function(res){ return res.result })
      .forEach(function(res){ tmp[res.id] = res.result })
        
      m.request({
        method: 'POST', 
        url   : './test', 
        data  : { 
          "PerId"    : this.climber.PerId(), 
          "WetId"    : this.wetid,
          "route"    : 0,
          "ResString": JSON.stringify(tmp)
        }
      })
      .then(function(response){ window.console.log(response) })
    }    
  },
    
  view: function(ctrl){
    return [
      m('h3.title', ctrl.title),
      m.component(app.climber_vc, { climber: ctrl.climber, results: ctrl.resArr }),
      m.component(app.results_vc, { resArray: ctrl.resArr, aggregator: ctrl.func }),
      m('button', { onclick : ctrl.postResults.bind(ctrl) }, 'Submit')
    ]
  }
}

app.climber_m = function(){
  this.PerId     = m.prop(null) 
  this.Name      = m.prop(null) 
  this.Category  = m.prop(null) 
  this.ResString = m.prop(null)
  this.ResSummary= m.prop(null)
}

app.climber_vc = {
  controller: function(params){ 
    this.climber = params.climber
    this.results = params.results 
  },
  
  fetch: function(val){
    var _this = this.climber
      , rArr  = this.results

    m.request({ method: 'GET', url: '/climber?PerId='+val })
    .then(function(v){
      try {
        _this.PerId(v.PerId)
        _this.Name(v.Lastname+', '+v.Firstname[0])
        _this.Category(v.Category)
        _this.ResString(JSON.parse(v.ResString))
        //_this.ResSummary(v.ResSummary)
        rArr.forEach(function(res){
         var r = _this.ResString()[res.id]
         res.parse(r ? r : '')
        })
      } 
      catch (err) { window.console.log(err) }      
    })
    .then(null, function(err){ window.console.log(err) })
  },
     
  view: function(ctrl){
    var model = ctrl.climber
    return m('.header', [
      m('span.bloc', 'PerId:'),
      m('input[type=text].textbox', {
        pattern : '[0-9]*',
        value   : model.PerId(), 
        onchange: m.withAttr('value', this.fetch.bind(ctrl))
      }),
      m('span#grpid', model.Category()),
      m('span#name',  model.Name()),
      m('span#result', model.ResSummary()),
    ])
  }
}
// m.mount(document.querySelector('.header'), app.climber)

app.results_vc = {
  view: function(ctrl, params) {
    var models = params.resArray, result = params.aggregator
    return m('#tiles', [
      models.map(function(bloc) { 
        return m.component(app.result_vc, { model: bloc, aggregator: result }) 
      })
    ])
  }
}

app.result_m = function(id){
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
    window.console.log(this.score()+'.'+this.bonus())  
  }
  
  // Set the model parameters from a passed value
  this.set = function(val){
    var n = parseInt(val, 10)
      , x = [10,7,4].indexOf(n)
      , y = [10,7,4,1].indexOf(n)
      , t = (x > -1) ? n : 0
      , b = (y > -1) ? 1 : 0
  
    this.result = t ? 't'+(x+1) : (b ? 'b1' : null)
    this.score(t) ;window.console.log(this.score()) 
    this.bonus(b) ;window.console.log(this.bonus())
  }    
}

app.result_vc = {
  controller: function(params){
    this.model = params.model
    
    this.set = function(val){
      // params.aggregator()
      this.model.set(val)
    }
  },
  // View declaration  
  view: function(ctrl){
    var model = ctrl.model    
    var toggles = {
          ong : { view: function(){ return  m("span.flag.noerror", m.trust('&nbsp;'))}}, 
          onr : { view: function(){ return  m("span.flag.error", m.trust('&nbsp;'))}}, 
          off : { view: function(){ return  m("span.flag", m.trust('&nbsp;'))}}
        }
        
    return m('.tile', [
      m('span.bloc', model.id), 
      m('input[type=text].textbox', {
        pattern : '[0-9]*', 
        value   : model.score() || model.bonus() || null,
        onchange: m.withAttr('value', ctrl.set.bind(ctrl))
      }),
      m.component(model.score() === 10 ? toggles.ong : toggles.off),
      m.component(model.score() ===  7 ? toggles.ong : toggles.off),
      m.component(model.score() ===  4 ? toggles.ong : toggles.off),
      m.component(model.bonus() ===  1 ? toggles.ong : toggles.off) 
    ])
  }  
}
//m.mount(document.querySelector('#tiles'), app.bloc)

var c = m.component(app.competition_vc, { wetid: 1, title: 'CWIF 2015' })
m.mount(document.querySelector('#inner'), c)
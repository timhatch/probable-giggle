/***********************************
* CODEKIT DECLARATIONS
***********************************/

/* global m        */

/**********************************************************
* Boulder View-Model 
**********************************************************/

var toggles = {
  ong : { view: function(){ return  m("span.flag.noerror", m.trust('&nbsp;'))}}, 
  onr : { view: function(){ return  m("span.flag.error", m.trust('&nbsp;'))}}, 
  off : { view: function(){ return  m("span.flag", m.trust('&nbsp;'))}}
} 


var bloc = {
  id     : 'p1',
  result : m.prop(null),
  score  : m.prop(0),
  bonus  : m.prop(0),
      
  parse: function(val){
    var t = val.match("t[0-9]{1,}") || null
      , b = val.match("b[0-9]{1,}") || null
    
    t = t ? parseInt(t[0].slice(1),10) : null
    b = b ? parseInt(b[0].slice(1),10) : null
    
    // TODO
    // this.score  = t ? [10,7,4][t-1] : (b ? 1 : 0)    
    this.result = val
  },
  
  // Update the model parameters from a text input
  update: function(val){
    var n = parseInt(val, 10)
      , t = ([10,7,4].indexOf(n) > -1) ? n : 0
      , b = ([10,7,4,1].indexOf(n) > -1) ? 1 : 0
    
    this.result(t ? 't'+t : ( b ? 'b1' : null))
    this.score(t)
    this.bonus(b)
  },
  
  // Mithril view declaration  
  view: function(){
    return m('.tile', [
      m('span.bloc', this.id), 
      m('input[type=text].textbox', {
        //class   : !this.result() ? 'textred' : 'textbox',
        pattern : '[0-9]*', 
        value   : this.score() || this.bonus() || '',
        onchange: m.withAttr('value', this.update.bind(this))
      }),
      m.component(this.score() === 10 ? toggles.ong : toggles.off),
      m.component(this.score() ===  7 ? toggles.ong : toggles.off),
      m.component(this.score() ===  4 ? toggles.ong : toggles.off),
      m.component(this.bonus() ===  1 ? toggles.ong : toggles.off) 
    ])
  } 
}

m.mount(document.getElementById('inner'), bloc)

/***********************************
* CODEKIT DECLARATIONS
***********************************/
/* global m                       */

var App = App || {}


// Public: Results model for a given competition, category and round
// 
// params  - A Hash containing 'wet_id', 'grp_id', 'route' and 'startnumber' parameters
//           We use startnumber instead of the per_id as this parameter more likely to be 
//           known to the route judge
//
// Returns a Hash object

// App.MResult = function(args){
//   
//   this.WetId  = args.wet_id
//   this.GrpId  = args.grp_id
//   this.Route  = args.route
//   
//   this.PerId  = m.prop(null)
//   this.Result = args.ResultJSON || { "a" : 0, "b" : 0, "t" : 0}
//   
//   this.fetch  = function(args){ window.console.log(args) }
//   this.save   = function(){ window.console.log(this.Result) }
// }

App.vm = {}

App.SwipeView = {
  controller: function(){
    this.result  = m.prop(0)
    
    this.changeAttempts = function(e){
      var i = (e.type === 'swiperight') ? 1 : -1
        , a = this.result() + i 
      
      this.result((a >= 0) ? a : 0)
      m.redraw(true)
    }
  },
  
  view: function(ctrl){
    return m('div.row', {
      textContent : ctrl.result(),
      config      : m.touchHelper({  
        'swipeleft' : ctrl.changeAttempts.bind(ctrl),
        'swiperight': ctrl.changeAttempts.bind(ctrl)
      })
    })
  }
}

App.TouchView = {
  controller: function(){
    this.result = m.prop(0)
    
    this.changeResult = function(){
      // Change this to 
      this.result(3)
    }
  },
  
  view: function(ctrl){
    return m('div.row', {
      textContent : ctrl.result(),
      onclick     : ctrl.changeResult.bind(ctrl)
    })
  }
}
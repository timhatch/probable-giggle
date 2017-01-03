//	-----------------------------------------------------
//	CODEKIT DECLARATIONS
//	-----------------------------------------------------
/*global m                                            */

var App = App || {}

App.PersonSelectorComponent = {
  controller: function(vm){
    // If the "forward' button is pressed, then
    // (a) change the value of the bonus/top field to indicate that attempts have finished
    // or zero out the result
    this.incrementStarter = function(){
      var val = vm.start_order + 1
      // No top
      if (vm.result.b > 0 && vm.result.t === null) { 
        vm.result.t = 0; vm.save()
      }
      // No bonus
      else if (vm.result.a > 0 && vm.result.b === null) { 
        vm.result.b = 0; vm.save()
      }
      // Result manually zeroed
      else if (vm.result.a === null) {
        vm.result.a = vm.result.b = vm.result.t = null; vm.save()
      }
      // window.console.log(vm.result)
      // (b) save the data, and fetch the next set of data
      vm.fetch(val)
    }
  },
  
  view: function(ctrl, vm){
    return m("div.search",[
      m("input[type=text]", {
        pattern : '[0-9]',
        onchange: m.withAttr('value', vm.fetch.bind(vm)),
        value   : vm.start_order
      }),
      m("span.details", vm.fullname || m.trust('&nbsp;')),
      m("button", {
        square  : true,
        onclick : ctrl.incrementStarter.bind(ctrl)
      }, m.trust('&#8594;'))
    ])
  }
}

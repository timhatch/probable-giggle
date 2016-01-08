/***********************************
* CODEKIT DECLARATIONS
***********************************/
/* global m                       */

m.route.mode = "hash"

var route1 = {
  controller: function() {}, 
  view: function() {
    return [
      m("a[href='/route1']", { config: m.route }, "go to page 1"),
      m("a[href='/route2']", { config: m.route }, "go to page 2"),
      m("a[href='/route3']", { config: m.route }, "go to page 3"),
      m('div', 'content 1 here')
    ]
  }
}
var route2 = {
  controller: function() {}, 
  view: function() {
    return [
      m("a[href='/route1']", { config: m.route }, "go to page 1"),
      m("a[href='/route2']", { config: m.route }, "go to page 2"),
      m("a[href='/route3']", { config: m.route }, "go to page 3"),
      m('div', 'content 2 here')
    ]
  }
}

var route3 = {}

m.route(document.body, '/route1', {
    '/route1': route1,
    '/route2': route2,
    '/route3': route3
})


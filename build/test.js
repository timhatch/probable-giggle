var app = {};
app.modal = null;

var modal = {};
modal.view = function(ctrl, opts) {
  var modelEl;
  return m(".modal", [
    m(".modal-dialog", [
      m(".modal-header", [
        m("h2", opts.title)
      ]),
      m(".modal-body", opts.body),
      m(".modal-footer", [
        m("a.btn[href='#close']", {
          onclick: function(e) {
            app.modal = null
            m.redraw()
          }
        }, "Close")
      ])
    ])
  ]);
};

app.view = function(ctrl, opts) {
  return [
    m('div', {
      onclick: function(e) {
        app.modal = {
          title: 'Hey',
          body: [
            m("p", "This is the modal body")
          ]
        };
        return false;
      }
    }, 'Modal'),
    app.modal ? m.component(modal, app.modal) : m('div', "replacement div")
  ];
};

m.mount(document.body, app);

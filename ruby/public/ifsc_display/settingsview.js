//  MVC style coding for a dynamic presentation of competition results
//  Copyright 2012-16  T J Hatch
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.

//  -----------------------------------------------------
//  SCOPE DECLARATIONS
//  -----------------------------------------------------
var app = app || {}

//  -----------------------------------------------------
//  SettingsView...
//  -----------------------------------------------------
//
//  Settings view extending Backbone.js 'View' class
//
app.SettingsView = Backbone.View.extend({
  className : 'a_panel hide',
  events    : function(){
    return Modernizr.touch ?
    {
      "touchend  li"          : "updateEGWComp",
      "click    input[type=radio]"  : "updateEGWRound"
    } :
    {
      "click    li"          : "updateEGWComp",
      "click    input[type=radio]"  : "updateEGWRound"
    }
  },

  //
  //  initialize(): Create a model (n.b. the model's initialize method will first look to fetch 
  //  any pre-existing settings from localStorage)
  //
  initialize: function(options){
    // initialize the view's model
    this.model = options.settings

    // Event handling
    // NOTE: May be redundant as none of the displayed model parameters can be altered other 
    // than through this view!
    this.listenTo(this.model, 'change', this.updateSettingsView, this)

    // Load the calendar and render the view (uses ES6 Promises for asynchrous operation)
    this.model.fetchEGWCalendarData().then(function(){ this.render() }.bind(this))

  },
  
  //
  //  template: view definition
  //
  template: _.template([
    "<div class='round-id'><span class='grp'>",
    "<input class='rdio' id='r0' name='rnd' type='radio' value='0'><label for='r0'>Qual'</label>",
    "<input class='rdio' id='r2' name='rnd' type='radio' value='2'><label for='r2'>Semi'</label>",
    "<input class='rdio' id='r3' name='rnd' type='radio' value='3'><label for='r3'>Final</label>",
    "</span></div>",
    "<div class='comp-id'><ul></ul></div>"
  ].join('')),

  //
  //  render(): Initial rendering of the view
  //  NOTE: The comp list here is 'quick and dirty': it could be replaced by a formal subview, in 
  //  which case certain events and the updateEGWComp() function could all be delegated down and 
  //  we'd not need to use data-* properties.
  //
  render: function(){
    var frag = document.createDocumentFragment()
    var el

    // Render the underscore template and append it to the DOM
    this.el.innerHTML = this.template()    
    document.getElementById('header').appendChild(this.el)

    // If there are two rounds, then hide the 3rd button
    this.showRounds(this.model.get('comp_rnds'))

    // Populate the comp list and append it to the DOM
    _(this.model.competitionList).each(function(comp){
      el              = document.createElement('li')
      el.innerHTML    = comp.name
      el.dataset.comp = JSON.stringify([comp.WetId, comp.type, (comp.rnds || 3)])
      frag.appendChild(el)
    })
    this.el.getElementsByTagName('ul')[0].appendChild(frag)

    // Call updateSettingsView to highlight the currently selected round
    this.updateSettingsView()
  },

  //
  //  updateEGWComp(): Update the EGWComp parameter on a user input. Parses a JSON object stored 
  //  as a data-* property of the DOM element clicked
  //
  updateEGWComp: function(e){
    var el = e.target
    var ds = JSON.parse(el.dataset.comp)

    // Set the number of rounds shown in the SettingsView from the number of rounds stored for 
    // the comp in question
    this.showRounds(ds[2])

    // Save the new competition parameters and trigger an application-level event to close the 
    // SettingsView and (if the comp data has changed, load new results)
    this.model.save({ 
      'comp_name' : el.textContent, 
      'EGWComp'   : ds[0], 
      'comp_type' : ds[1], 
      'comp_rnds' : ds[2] 
    })
    this.trigger('appEvent:toggleSettingsView')
  },

  //
  //  updateEGWRound(): Update the EGWRound parameter from the form inputs on the view
  //
  updateEGWRound: function(){
    var n = parseInt(this.el.querySelector("[name='rnd']:checked").value, 10)

    this.model.save({ 'EGWRound' : n })
    this.trigger('appEvent:toggleSettingsView')
  },

  //
  //  updateSettingsView(): Update the view from the current state of the model (triggered by
  //  changes to the model)
  //
  updateSettingsView: function(){
    var x = this.model.get('EGWRound')

    this.el.querySelector('#r'+x).checked = true
  },

  //
  //  toggleViewState(): Toggle the visibility state of the SettingsView
  //
  toggleViewState: function(){
    this.el.classList.toggle('show')
    this.el.classList.toggle('hide')
  },

  //
  //  showRounds(): Modify the display state depending upon whether there are 2 or 3 rounds 
  //  (default is 3)
  //
  showRounds: function(n){
    var two = parseInt(n ,10) === 2
    var obj = two ? { t: 'Final', d: 'none', w: '49%' } : { t: "Semi'", d: 'inline-block', w: '32%' }
    var arr = this.el.getElementsByTagName('label')

    // Set the display state
    arr[1].textContent   = obj.t
    arr[2].style.display = obj.d
    _(arr).each(function(el){ el.style.width = obj.w })

    // If we're switching to a 2 round competition and the currently selected round is not 
    // qualification, then make sure we activate a valid round on transfer
    if (two && this.model.get('EGWRound')) { this.model.set({ 'EGWRound' : 2 }) }

    // TODO: Adding {silent : true} should prevent updateSettingsView being called twice, but 
    // need to test this...
    // if (two && this.model.get('EGWRound')) { this.model.set({ 'EGWRound' : 2 }, { silent : true}) }
  }
})

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
//  BClimberView...
//  -----------------------------------------------------
//
//  Extend (subclass) the base ClimberView class with methods specific for Boulder Competitions
//
app.BClimberView = app.ClimberView.extend({
  
  template: _.template([
    "<span class='brnk'>{{rank}}</span>",
    "<span class='bnme'>{{name}}</span>",
    "<span class='code'>{{code}}</span>",
    "<span class='result_bloc'></span>",
    "<span class='TA'></span>"
  ].join('')),
  //
  //  Override the default render() function
  //
  render: function(){
    // Render the view skeleton and append the results-containing elements into the DOM
    this.el.innerHTML  = this.template({
      rank  : this.model.get('rank_prev_heat'),
      name  : this.model.get('lastname'),
      code  : this.model.get('nation'),
      PerId : this.model.get('PerId')
    })
    this.appendResultsNodes()

    // Cache references to the DOM elements that will be updated for this view to avoid having to traverse the DOM
    // each time .update() is called
    this.rk_el = this.el.getElementsByClassName('brnk')[0]
    this.tp_el = this.el.getElementsByClassName('tp')
    this.bn_el = this.el.getElementsByClassName('bn')
    this.TA_el = this.el.getElementsByClassName('TA')[0]

    // Enable chaining
    return this
  },

  //
  //  Override the default appendResultsNodes() function
  //
  appendResultsNodes: function(){
    var frag = document.createDocumentFragment(),
      r    = this.model.collection.round,     // Non zero if semifinal or final
      c    = (this.model.collection.cat > 10),  // True if a Youth competition
      n, t, b

    // Figure out how many results cells we need, 8, 5 or 4
    if (r < 2) { n = c ? 8 : 5 } else { n = 4 }

    // Append [n] 'top' display elements and [n] 'bonus' display elements. We use CSS3:Flexbox and CSS:Box-Sizing
    // to define the relative position of the elements
    while (n) {
      t = document.createElement('span')
      b = document.createElement('span')
      t.textContent = 'x'
      t.className = 'tp'
      b.className = 'bn'
      frag.appendChild(t)
      frag.appendChild(b)
      n--
    }
    this.el.getElementsByClassName('result_bloc')[0].appendChild(frag)
  },

  //
  //  Override the default update() function
  //
  update: function(){
    var t = [], b = [], ta = 0
    var res = this.model.get('result_jsonb')
    
		// Update the displayed rank & the data-rankorder property used by the ResultsListView::animateDOM sort
		this.rk_el.textContent = this.model.get('sort_values') ? this.model.get('calculated_rank') : ''
		this.el.setAttribute('data-rank', this.model.get('display_order') || this.model.get('start_order'))

		// Iterate across the bonus indicator cells & set the css based the relevant attempt value
		_(this.bn_el).each(function(el, i){
      var x = 'p'+(i+1)
			b.push(res[x] ? res[x].b || null : null)
			el.classList[(b[i] > 0) ? 'add' : 'remove']('GLight')
		}, this)

		// Iterate across the top indicator cells & set the css based the relevant attempt value
		_(this.tp_el).each(function(el, i){
      var x = 'p'+(i+1)
			t.push(res[x] ? res[x].t || null : null)
			el.classList[(t[i] > 0) ? 'add' : 'remove']('GLight')
			el.style.color = (b[i] === 0 || (!!b[i] && !t[i])) ? 'rgba(255,0,0,1)' : 'rgba(255,0,0,0)'
		}, this)

    // Calculate and display the number of attempts
    // Optional test to display the number of attempts to bonus where the climber has no tops..
    // if (ta === 0) _(b).each(function(x){ ta += x })
    this.TA_el.innerHTML = this.model.get('sort_values')[1] || '&nbsp;'
  },

  //
  // Override the default parseResults() function to return the number of attempts only
  //
  parseResults: function(type, i){
    var rs  = this.model.get('rArr'),
      str = type+"[0-9]{1,}",
      val = rs[i] ? rs[i].match(str) : null

    return val ? parseInt(val[0].slice(1), 10) : null
  }
})

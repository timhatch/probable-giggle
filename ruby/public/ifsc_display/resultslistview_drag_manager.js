//	MVC style coding for a dynamic presentation of competition results
//	Copyright 2012-16  T J Hatch
//
//	Licensed under the Apache License, Version 2.0 (the "License");
//	you may not use this file except in compliance with the License.
//	You may obtain a copy of the License at
//
//	http://www.apache.org/licenses/LICENSE-2.0
//
//	Unless required by applicable law or agreed to in writing, software
//	distributed under the License is distributed on an "AS IS" BASIS,
//	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//	See the License for the specific language governing permissions and
//	limitations under the License.

//	-----------------------------------------------------
//	SCOPE DECLARATIONS
//	-----------------------------------------------------
var app = app || {}

//	-----------------------------------------------------
//	ResultsListView Drag Manager module
//	-----------------------------------------------------
//
//	Extend the Backbone.js 'Collection' class
//
app.ResultsListView.DragManagerModule = {
  //  -------------------------------------------------------------------------------------------
  //  Drag Management Methods -
  //  -------------------------------------------------------------------------------------------
  //
  //  Add support for pull-to-refresh using the non-library method documented at
  //  http://manzzup.blogspot.co.uk/2014/02/making-html-pull-to-refresh-list-for.html
  //  adapted (a) to conform to the method structure used by the Hammer-1.0.5 example
  //
  _isTouchEnabled     : Modernizr.touch,
  _isTouched          : false,
  _initialTouchPointY : null,
  _previousTouchPointY: null,
  _dragLength         : 0,
   // Hard-code the _breakpoint for the Pull-To-Refresh action at 3* the item height
  _breakPoint         : 144,   
  
  //
  //  initDragManager(): Add new events to the View (can probably get rid of this if we want to 
  //  optimise later) Adds either touch or mouse events, this could probably be enhanced if we 
  //  want to deal with devices capable of both touch and mouse input
  //
  initDragManager: function(){
    var events = this._isTouchEnabled ?
        ['touchstart','touchend','touchleave','touchmove'] : 
        ['mousedown','mouseup','mouseleave','mousemove']

    _(events).each(function(type){ this.events[type] = 'handleDragEvents' }, this)
  },

  //
  //  HandlePullEvents(ev): Deal with a vertical drag and release
  //  Based on a much simplified implementation of the Pull-to-Refresh example at
  //  http://eightmedia.github.io/hammer.js/examples/pull-to-refresh.html but independent of the 
  //  Hammer.js library
  //  No debouncing at the moment (using _.debounce() doesn't appear to be viable for touch 
  //  devices)
  //
  handleDragEvents: function(e){
    switch(e.type) {
    // on start reset the position of the wrapper element
    case 'mousedown':
    case 'touchstart':
      // Find the initial touch point, and record the touch event
      // window.console.log('ontouchstart' in window)
      this._isTouched           = true
      this._initialTouchPointY  = this._isTouchEnabled ? e.changedTouches[0].clientY : e.clientY
      this._previousTouchPointY = this._initialTouchPointY

      // Reset the Status Bar, if not already done so
      this.resetStatusBar()
      break
    // while are dragging down the wrapper element, update the display
    case 'mousemove':
    case 'touchmove':
      // Determine the current touch position and determine the direction of movement (up or down)
      var theTouchPointY = this._isTouchEnabled ? e.changedTouches[0].clientY : e.clientY
      var isDraggedDown  = (theTouchPointY - this._previousTouchPointY) > 0

      if (this._isTouched && isDraggedDown) {
        // If when the drag event is underway the window is scrolled down:
        // (a) where the top row is out of focus, exit without doing anything (i.e. don't 
        // permit a drag)
        if (window.scrollY > 48) { return }
        // (b) if the first cell is only partially visible, reset the scroll position to 
        // snap back and show the full row before continuing
        else if (window.scrollY !== 0) { window.scrollTo(0,0) }

        // Adjust (and store) the drag length and then set the height (position) of the 
        // status bar
        this._dragLength = theTouchPointY - this._initialTouchPointY
        this.setStatusBarHeight(this._dragLength * 0.4)

        // Increment the previousTouchPointY ahead of the next dragdown() call
        this._previousTouchPointY = theTouchPointY

        // Stop the browser from scrolling
        e.preventDefault()
      }
      break
    // If the event wasn't a touch initiation or 'pointer' movement, then it must be a release 
    // (a touchend/mouseup event) or the 'pointer' has moved offscreen (i.e. a touchleave/
    // mouseleave event)
    default:
      // If the screen hasn't been dragged down, then exit (this may be redundant)
      if (this._dragLength === 0) {
        window.console.log('dragLength === 0')
        return 
      }

      // if over the breakpoint when release then use a CSS transform to 'animate' the 
      // snap-back; set the Status bar height (which will be zeroed when the callback is 
      // complete) and trigger the callback
      if (this._dragLength >= this._breakPoint) {
      //  window.console.log('this._dragLength >= this._breakPoint: '+this._dragLength+', '+this._breakPoint)
        this.el.classList.add('slide-transform')
        this.setStatusBarHeight(24)
        this.onDragRelease()
      }
      // but if not over the breakpoint then just hide the statusbar (this also resets the 
      // pull status) to do this without any animation effect then use resetStatusBar()
      else {
        // window.console.log('this._dragLength !>= this._breakPoint: '+this._dragLength+', '+this._breakPoint)
        this.hideStatusBar()
      }
      //
      this._isTouched  = false
      this._dragLength = 0
    }
  },

  //
  //  onDragRelease(): Callback function when we stop dragging, either load new results or update 
  //  the results depending upon the context when called.
  //
  onDragRelease: function(){
    // if we're showing an xhrerror (in which case there will be no subviews as no climbers are 
    // shown); or if the list of climbers on display is a list of starters from registration 
    // then call initResultsListView()
    if (!this.subviews.length || !!this.starters) { this.initResultsListView() }
    // But if there are already 'results' on display then refresh these
    else { this.updateViewContent({ 'force_refresh' : true }) }
  },

  //
  //  hideStatusBar(): Animated closure of the status bar
  //  A bit of a misnomer, as we never actually do anything with the status bar, we're actually 
  //  translating the content of the wrapper element so that the status bar moves offscreen. The 
  //  setTimeout() call delays the reset of all the relevant variables until after the animation 
  //  has completed (as we use a 300ms animation within 'slide-transform')
  //
  hideStatusBar: function(){
    this.el.classList.add('slide-transform')
    this.setStatusBarHeight(0)
    // Postpone the reset until after the transform completes (300ms)
    setTimeout(function() { this.resetStatusBar() }.bind(this), 400)
  },

  //
  //  resetStatusBar(): Reset the pull status - remove any CSS transform, reset the 
  //  _slidedown_height and _dragged_down parameters and the move the wrapper element back to Y=0
  //
  resetStatusBar: function(){
    this.setStatusBarHeight(0)
    this.el.classList.remove('slide-transform')
  },

  //
  //  setStatusBarHeight(height): A simple utility function to translate the wrapper element by 
  //  the specified amount
  //
  setStatusBarHeight: function(height){
    this.el.style.transform       = 'translate3d(0,'+height+'px,0)'
    this.el.style.webkitTransform = 'translate3d(0,'+height+'px,0)'
  }
}
_.extend(app.ResultsListView.prototype, app.ResultsListView.DragManagerModule)


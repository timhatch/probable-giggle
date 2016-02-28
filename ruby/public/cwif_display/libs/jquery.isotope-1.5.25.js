/**
 * Isotope v1.5.25
 * An exquisite jQuery plugin for magical layouts
 * http://isotope.metafizzy.co
 *
 * Commercial use requires one-time purchase of a commercial license
 * http://isotope.metafizzy.co/docs/license.html
 *
 * Non-commercial use is licensed under the MIT License
 *
 * Copyright 2013 Metafizzy
 */

/*jshint asi: true, browser: true, curly: true, eqeqeq: true, forin: false, immed: false, newcap: true, noempty: true, strict: true, undef: true */
/*global jQuery: false */

(function(window, $, undefined) {
	'use strict';
	var $window = $(window);

	// ========================= Isotope ===============================
	// our "Widget" object constructor
	$.Isotope = function(options, element) {
		this.element = $(element)
		this._init(options)
		this._apply()
	};

	function on_resize(c,t){onresize=function(){clearTimeout(t);t=setTimeout(c,100)};return c}

	$.Isotope.settings = {
		containerClass: 'isotope',
		itemClass: 'isotope-item',
		hiddenClass: 'isotope-hidden',

		hiddenStyle: { opacity: 0, scale: 0.001 },
		visibleStyle: { opacity: 1, scale: 1 },

		sortBy: 'original-order',
		sortAscending: true,
	}

	$.Isotope.prototype = {
		/*
		* _init(): Initialise the widget
		*/
		_init: function(options) {

			this.options = $.extend({}, $.Isotope.settings, options);

			// Store the original styles as we'll need them in .destroy()
			var elemStyle               = this.element[0].style
			this.originalStyle          = {}
			this.originalStyle.position = elemStyle.position || ''
			this.originalStyle.overflow = elemStyle.overflow || ''
			this.originalStyle.width    = elemStyle.width    || ''
			this.originalStyle.height   = elemStyle.height   || ''

			// Override the original position and overflow styles of the superview
			elemStyle.position          = 'relative'
			elemStyle.overflow          = 'hidden'

			// Sorting
			this.elemCount              = 0
			var originalOrderSorter     = { 'original-order': function($elem, instance) { instance.elemCount++; return instance.elemCount }}
			this.options.getSortData    = $.extend(this.options.getSortData, originalOrderSorter)

			// need to get atoms
			this.styleQueue = []
			this.$allAtoms = this._createAtoms(this.element.children())

			// get top left position of where the bricks should be
			this.offset = { left : parseInt(elemStyle.paddingLeft || 0, 10), top  : parseInt(elemStyle.paddingTop  || 0, 10) }

			// add isotope class first time around
			var instance = this;
			setTimeout(function(){ instance.element[0].classList.add(instance.options.containerClass) }, 0)

			// deal with events...
			// NOTE: the following is a simple 100ms throttle to prevent instance._reLayout being called excessively,
			// see: https://github.com/louisremi/jquery-smartresize
			on_resize = function(){
				var prevSegments = instance.columns.number
				instance._setColumnNW()
				if (instance.columns.number !== prevSegments){ instance._reLayout() }
			}
			$window.bind('resize', on_resize)
			// dismiss all click events from hidden events
			this.element.delegate('.' + this.options.hiddenClass, 'click', function() { return false })
		},

		/*
		* _apply() filters the Atoms, sorts them and calls _reLayout()
		* _apply is fired when $.isotope is first created or otherwise called
		*/
		_apply: function() {
			this.$filteredAtoms = this._filter(this.$allAtoms)
			this._sort()
			this._reLayout()
		},

		/*
		* _createAtoms(): Create a copy of the DOM elements to be sorted
		*/
		_createAtoms: function($elems) {
			var selector  = this.options.itemSelector,
				$atoms    = selector ? $elems.filter(selector).add($elems.find(selector)) : $elems,		// filter & find
				atomStyle = { position: 'absolute', left : 0, top : 0 } 								// base style for atoms

			// Filter the list of elements to contain only element nodes (precautionary)
			$atoms = $atoms.filter(function(i, atom) { return atom.nodeType === 1 })

			$atoms.css(atomStyle).addClass(this.options.itemClass)
			this.updateSortData($atoms, true)

			return $atoms
		},

		// ====================== Filtering ======================

		_filter: function($atoms) {
			var filter = this.options.filter === '' ? '*' : this.options.filter
			if (!filter) { return $atoms }

			var hiddenClass    = this.options.hiddenClass,
				hiddenSelector = '.' + hiddenClass,
				$hiddenAtoms   = $atoms.filter(hiddenSelector),
				$atomsToShow   = $hiddenAtoms,
				$atomsToHide

			if (filter !== '*') {
				$atomsToShow = $hiddenAtoms.filter(filter);
				$atomsToHide = $atoms.not(hiddenSelector).not(filter).addClass(hiddenClass);
				this.styleQueue.push({ $el: $atomsToHide, style: this.options.hiddenStyle })
			}

			this.styleQueue.push({ $el: $atomsToShow, style: this.options.visibleStyle })
			$atomsToShow.removeClass(hiddenClass);

			return $atoms.filter(filter);
		},

		// ====================== Sorting ======================

		updateSortData: function($atoms, isIncrementingElemCount) {
			window.console.log('updateSortData called')
			var instance    = this,
				getSortData = this.options.getSortData,
				$this,
				sortData

			$atoms.each(function() {
				$this    = $(this)
				sortData = {}
				// get value for sort data based on fn( $elem ) passed in
				for (var key in getSortData) {
					if (!isIncrementingElemCount && key === 'original-order') {
						// keep original order original
						sortData[key] = $.data(this, 'isotope-sort-data')[key];
					} else {
						sortData[key] = getSortData[key]($this, instance);
					}
				}
				// apply sort data to element
				$.data(this, 'isotope-sort-data', sortData);
			})
		},

		// used on all the filtered atoms
		_sort: function() {
			var sortBy = this.options.sortBy,
				sortDn = this.options.sortAscending ? 1 : -1,
				sortFn = function(alpha, beta) {
					var a = $.data(alpha, 'isotope-sort-data')[sortBy],
						b = $.data(beta, 'isotope-sort-data')[sortBy]
					// fall back to original order if data matches
					if (a === b && sortBy !== 'original-order') {
						a = $.data(alpha, 'original-order')
						b = $.data(beta, 'original-order')
					}
					return ((a > b) ? 1 : (a < b) ? -1 : 0) * sortDn
				}
			this.$filteredAtoms.sort(sortFn)
		},

		// ====================== General Layout ======================

		_reLayout: function(){
			// calculate the number and width of columns in the superview and zero the height of each
			this._resetColumns()

			// Place each element in the superview
			var instance = this
			$(this.$filteredAtoms).each(function(){
				instance._placeElementByRow($(this), instance.columns.hArr);
			})

			// Now that the styleQueue has been populated for child elements, add one last transform to set the height of the superview
			var containerStyle = { height : Math.max.apply(Math, this.columns.hArr) } // Find the maximum value af the columns.hArr array
			this.styleQueue.push({ $el: this.element, style: containerStyle })

			// default styleQueue processor
			// NOTE: THis is where the CSSHooks are used to apply a translation??
			$.each(this.styleQueue, function(i, obj){
				obj.$el.css(obj.style)  //	obj.$el.css(obj.style, {})
			})

			// clear out queue for next time
			this.styleQueue = []
		},

		// ====================== Convenience methods ======================

		// destroys widget, returns elements and container back (close) to original style
		destroy: function(){
			var options = this.options,
				elemStyle

			this.$allAtoms.removeClass(options.hiddenClass + ' ' + options.itemClass)
				.each(function() {
				var style            = this.style
				style.position       = ''
				style.top            = ''
				style.left           = ''
				style.opacity        = ''
				style[transformProp] = ''
			});

			// Re-apply saved container styles
			elemStyle = this.element[0].style
			for (var prop in this.originalStyle) {
				elemStyle[prop] = this.originalStyle[prop]
			}

			// remove $.isotope classes and events
			this.element.unbind('.isotope')
				.undelegate('.' + options.hiddenClass, 'click')
				.removeClass(options.containerClass)
				.removeData('isotope');

			$window.unbind('.isotope');
		},

		// ====================== LAYOUTS ======================
		/*
		* _resetColumns():
		*/
		_resetColumns: function(){
			var i

			this.columns      = {}
			this.columns.hArr = []

			this._setColumnNW()
			i = this.columns.number
			while (i--) { this.columns.hArr.push(0) }
		},

		/*
		* _setColumnNW(): Calculate and set the number of columns in the enclosing view
		*/
		_setColumnNW: function(){
			var containerW = this.element.width(),
				columnW    = this.$filteredAtoms.outerWidth(true) || containerW,
				columnN    = Math.floor(containerW / columnW)

			this.columns.number = Math.max(columnN, 1)
			this.columns.width  = columnW
		},

		/*
		* _placeElementByRow(): Calculate the transform for each element
		*/
		_placeElementByRow: function($elem, heightArr) {
			// get the minimum Y value from the columns
			var minimumY = Math.min.apply(Math, heightArr),	// Find the height of the shortest column (initially 0)
				len      = heightArr.length,
				shortCol = 0,
				i, x, y

			// Find which column is the shortest from L->R, this will initially be the first column
			// (can short cut this by using underscore...)
			for (i = 0; i < len; i++) {
				if (heightArr[i] === minimumY) {
					shortCol = i;
					break;
				}
			}

			// Position the element at the top of the shortest column & push the required transform onto the styleQueue
			x   = Math.round((this.columns.width * shortCol) + this.offset.left)	//
			y   = Math.round(minimumY + this.offset.top)
			this.styleQueue.push({ $el: $elem, style: { translate : [x, y] } })

			// Increment the height of the column
			this.columns.hArr[shortCol] = minimumY + $elem.outerHeight(true)
		}
	}

	// =======================  Plugin bridge  ===============================
	// leverages data method to either create or return $.Isotope constructor
	// A bit from jQuery UI
	//   https://github.com/jquery/jquery-ui/blob/master/ui/jquery.ui.widget.js
	// A bit from jcarousel
	//   https://github.com/jsor/jcarousel/blob/master/lib/jquery.jcarousel.js

	$.fn.isotope = function(options){
		if (typeof options === 'string') {
			// call method
			var args = Array.prototype.slice.call(arguments, 1);
//			window.console.log('plugin bridge called with : ')
//			window.console.log(options)
			this.each(function() {
				var instance = $.data(this, 'isotope');
				if (!instance) {
					window.console.log("cannot call methods on isotope prior to initialization; " + "attempted to call method '" + options + "'"); return
				}
				if (!$.isFunction(instance[options]) || options.charAt(0) === "_") {
					window.console.log("no such method '" + options + "' for isotope instance"); return
				}
				// apply method
				instance[options].apply(instance, args);
			});
		} else {
//			window.console.log(options)
			this.each(function() {
				var instance = $.data(this, 'isotope');
				if (instance) {
					// apply options & init
					if ($.isPlainObject(options)) { instance.options = $.extend(true, instance.options, options) }
					instance._apply();
				} else {
					// initialize new instance
					$.data(this, 'isotope', new $.Isotope(options, this));
				}
			});
		}
		// return jQuery object
		// so plugin methods do not have to
		return this;
	};
})(window, jQuery)
(function($){
	'use strict';

	// get global vars
	var document = window.document;

	// helper function
	var capitalize = function(str) {
		return str.charAt(0).toUpperCase() + str.slice(1);
	};

	// ========================= getStyleProperty by kangax ===============================
	// http://perfectionkills.com/feature-testing-css-properties/

	var prefixes = 'Moz Webkit'.split(' ');

	var getStyleProperty = function(propName) {
		var style = document.documentElement.style,
			prefixed

		// test standard property first
		if (typeof style[propName] === 'string') { return propName }

		// capitalize
		propName = capitalize(propName);
	//		window.console.log(propName)
		// test vendor specific properties
		for (var i = 0, len = prefixes.length; i < len; i++) {
			prefixed = prefixes[i] + propName;
	//			window.console.log(prefixed)
			if (typeof style[prefixed] === 'string') { return prefixed }
		}
	}
	var transformProp  = getStyleProperty('transform')

	// ========================= isoTransform ===============================

	/**
	 *  provides hooks for .css({ scale: value, translate: [x, y] })
	 *  Progressively enhanced CSS transforms
	 *  Uses hardware accelerated 3D transforms.
	 */
	var transformFnNotations = {
		translate: function(position) { return 'translate3d(' + position[0] + 'px,' + position[1] + 'px,0)' },
		scale: function(scale) { return 'scale3d(' + scale + ',' + scale + ',1)' }
	}

	var setIsoTransform = function(elem, name, value) {
		// unpack current transform data
		var data = $.data(elem, 'isoTransform') || {},
		newData = {},
		fnName,
		transformObj = {},
		transformValue;

		// i.e. newData.scale = 0.5
		newData[name] = value;
		// extend new value over current data
		$.extend(data, newData);

		for (fnName in data) {
			transformValue = data[fnName];
			transformObj[fnName] = transformFnNotations[fnName](transformValue);
		}
		// get proper order
		// ideally, we could loop through this give an array, but since we only have
		// a couple transforms we're keeping track of, we'll do it like so
		var translateFn = transformObj.translate || '',
			scaleFn = transformObj.scale || '',
			// sorting so translate always comes first
			valueFns = translateFn + scaleFn;
		// set data back in elem
		$.data(elem, 'isoTransform', data);
		// set name to vendor specific property
		elem.style[transformProp] = valueFns;
	};

	// ==================== scale ===================
	$.cssNumber.scale = true
	$.cssHooks.scale = {
		set: function(elem, value) {
			setIsoTransform(elem, 'scale', value);
		},
		get: function(elem) {
			var transform = $.data(elem, 'isoTransform');
			return transform && transform.scale ? transform.scale : 1;
		}
	}
	$.fx.step.scale = function(fx) {
		$.cssHooks.scale.set(fx.elem, fx.now + fx.unit);
	}
	// ==================== translate ===================
	$.cssNumber.translate = true
	$.cssHooks.translate = {
		set: function(elem, value) {
			setIsoTransform(elem, 'translate', value);
		},
		get: function(elem) {
			var transform = $.data(elem, 'isoTransform');
			return transform && transform.translate ? transform.translate : [0, 0];
		}
	}
})(jQuery)
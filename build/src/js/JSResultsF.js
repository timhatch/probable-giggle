/* MVC style coding for a dynamic presentation of bouldering results
* Copyright 2011, Tim Hatch
* Dual licensed under the MIT or GPL Version 2 licenses.
*/

// Wrap eveything in a singleton object
var applicationObject = {

	/*
	 * init() - Initialize the object
	 *
	 *
	 */
	init: function(){
		// Initialise in order the settings model and then each of the application views:
		// 1) settingsView, accessing the application settings and containing the settings model
		// 2) headerView, controlling the application views/models -
		// 3) resultsView, displaying the results
		// Pass the settings model allowing them to (make and) respond to changes within without application level event mediation.
		this.resultsView	= new App.ResultsListView()

		// Deal with Android-specific problems...
	},

	/*
	*	updateResultsView(): Refresh the ResultsListView,
	*
	*/
	updateResultsView: function(){
		window.console.log('update results called')
		this.resultsView.updateView({ 'force_refresh' : true })
	}
}

/*
 *	Initialise the object once the DOM has fully loaded
 *
 */
$(document).ready(function(){
	// Extend Backbone Events to the applicationObject and then initialize the object
	_.extend(applicationObject, Backbone.Events)
	applicationObject.init()

	applicationObject.resultsView.loadResults('f')
//	setInterval(function(){ applicationObject.updateResultsView() }, 5000 );
	setTimeout(function(){ applicationObject.updateResultsView() }, 5000 );

});
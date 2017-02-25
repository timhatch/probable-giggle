// Import standard library modules
const fs          = require('fs')
// Import external modules
const EventSource = require('eventsource')
const fetch       = require('got')
const Q           = require('q')

// Site-specific parameters
// Application variables/constants 
//
const options = require('./params')
const es      = new EventSource('http://'+options.url+'/broadcast/results')
const results = []

// Get the initial startlist/resultslist (so that the media people can preview the 
// starters
//
const fetchResults = params => {
  return fetch('http://'+options.url+'/results/route', { 
    method: 'GET', 
    json: true, 
    body: { wet_id: params.wet_id, grp_id: params.grp_id, route: params.route }  
  }).then( r => r.body.forEach((x) => { 
    x.grp_id = params.grp_id
    results.push(x)
  }))
}

// Handle data returned from an EventStream source
//
const handleStream = data => {
  JSON.parse(data).forEach(newResult => {
    let person = results.find(p => p.per_id === newResult.per_id)
    Object.assign(person, newResult)
  })
  fs.writeFile(options.file, generateCSVArray().join('\n'), 'utf8')
}

// Convert each result into a CSV string
//
const generateCSVArray = () => {
  return results.map(r => {
    let attempts = []
    try {
      for (let key in r.result_jsonb) {
        attempts.push(r.result_jsonb[key].a)
        attempts.push(r.result_jsonb[key].b)
        attempts.push(r.result_jsonb[key].t)
      }
    } catch(e) { console.log('error') }
    return [r.per_id, r.lastname, r.firstname, r.nation, r.grp_id, r.start_order, r.result_rank]
      .concat(r.sort_values)
      .concat(attempts)
  })
}

// Fetch the results and register the promises for each fetch
//
const promises = options.routes.map(x => fetchResults(x))

// When all results have been retrieved, output the loaded data as CSV
// then listen for and handle streamed updates
//
Q.all(promises).then(() => {
  fs.writeFile(options.file, generateCSVArray().join('\n'), 'utf8')
  es.onmessage = es => handleStream(es.data)
})

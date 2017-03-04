const fs          = require('fs')
// Import external modules
const fetch       = require('got')
const Q           = require('q')

// Site-specific parameters
// Application variables/constants 
//
const options = require('./params')
const results = []


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

const blocSummary = (grp_id, bloc) => {
  let summary = [0, 0, 0, 0]
  results.filter(x => x.grp_id === grp_id).forEach(x => {  
    try {
      if (x.result_jsonb[bloc].a) {
        summary[0] += 1
        summary[1] += x.result_jsonb[bloc].a
      }
      if (x.result_jsonb[bloc].b) summary[2] += 1
      if (x.result_jsonb[bloc].t) summary[3] += 1
    } catch (e) {
      console.log(x.lastname)
    } 
  })
  return [grp_id, bloc].concat(summary)
}

// generateCSVArray = () => options.blocs.map(x => blocSummary(5, x))
const generateCSVArray = () => {
  let r = []
  options.routes.forEach(x => {
    console.log(x.grp_id)
    let s = options.blocs.map(y => blocSummary(x.grp_id, y))
    r = r.concat(s)
    console.log(r)
  })
  return r
}

// Fetch the results and register the promises for each fetch
//
const promises = options.routes.map(x => fetchResults(x))

// When all results have been retrieved, output the loaded data as CSV
// then listen for and handle streamed updates
//
Q.all(promises).then(() => {
  fs.writeFile('./route_stats.csv', generateCSVArray().join('\n'), 'utf8')
})

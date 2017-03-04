const results = [
  { per_id: 1033, result_rank: 2, sort_values: [2, 3, 2, null] },
  { per_id: 6550, result_rank: 1, sort_values: [2, 4, 3, null] },
  { per_id: 6223, result_rank: 3, sort_values: [2, 3, 3, null] }
]

const appendPoints = data => {
  data.forEach(x => { 
    let sv = x.sort_values || [0,0,0]
    x.points = (1300 * sv[0] - 300 * sv[1]) + sv[2]
  })
  return data
}
const comparePoints = (a,b) => {
  if (a.points < b.points) return 1
  if (a.points > b.points) return -1
  return 0
}

const recalculateRank = data => {
  const pts = appendPoints(data).sort(comparePoints).map(v => v.points)
  const rnk = data.map(v => pts.indexOf(v.points)+1)
  
  return data.map((x, i) => Object.assign(x, { result_rank: rnk[i] }))
}

console.log(recalculateRank(results))

const chartConfig = {
  type: 'line',
  data: { labels: [], datasets: [{ data: [], borderColor: '#a3a3d3', backgroundColor: '#a2bbd342' }] },
  options: {
    title: { display: true, text: '' },
    hover: { mode: 'nearest', intersect: false },
    tooltips: { mode: 'nearest', intersect: false, backgroundColor: 'hsla(240,25%,76%,.81)', displayColors: false },
    legend: { display: false },
    scales: {
      yAxes: [{ display: true, scaleLabel: { display: true, labelString: 'Elo' } }],
      xAxes: [{ display: true, scaleLabel: { display: true, labelString: 'Opponents' }, ticks: { display: false } }]
    }
  }
}
let chart = undefined
const K = 32

async function plot() {
  if (window.location.search == '') return document.getElementById('loading').innerHTML = '' // no id parameter was specified in the url, thus leaving only the input box to enter an id
  else if (window.location.search.length < 5) return document.getElementById('loading').innerText = 'empty id'
  else document.getElementById('loading').innerText = 'loading..'
  // fetch response
  const algoId = window.location.search.split('?id=')[1]
  document.getElementById('algo-id').value = algoId
  const fetched = await fetch(`https://terminal.c1games.com/api/game/algo/${algoId}/matches`)
  if (fetched.status != 200) return document.getElementById('loading').innerText = 'failed to retrieve data'
  const response = await fetched.json()
  const matches = response.data.matches.reverse()
  if (!(matches.length > 0)) return document.getElementById('loading').innerText = 'no matches found'
  const { name, elo } = matches[0].winning_algo.id == algoId ? matches[0].winning_algo : matches[0].losing_algo // the selected algo's properties are stored in [algoId], [name] & [elo]
  // update config
  document.getElementById('loading').innerHTML = ''
  document.title = `${name} (${algoId})`
  chartConfig.options.title.text = `"${name}" elo over matches`
  // clearing arrays
  chartConfig.data.datasets[0].data.length = 0
  chartConfig.data.labels.length = 0
  // setup
  let previousElo = 1500
  const frequency = new Map() // key = user name, value = amount of matches against selected algo
  // full table
  const fullTable = document.getElementById('full-table')
  clearTable(fullTable)
  let wins = 0
  matches.forEach((match, index) => {
    const won = match.winning_algo.id == algoId
    const opponent = won ? match.losing_algo : match.winning_algo
    insertMatch(fullTable, match, algoId) // inserting match into table
    if (won) wins++
    frequency.set(opponent.user, (frequency.get(opponent.user) || 0) + 1) // incrementing frequency of opponent's user in Map
    chartConfig.data.labels.push(opponent.name) // pushing opponent's algo name to chart as label
    chartConfig.data.datasets[0].data.push(index == matches.length - 1 ? elo : Math.round( // pushing elo to chart data
      previousElo += // adding elo to previous elo, returns new elo value to Math.round
      K * ((won ? 1 : 0) - 1 / (1 + Math.pow(10, (opponent.elo - previousElo) / 400))) // elo calculation
    ))
  })
  document.getElementById('full-title').innerHTML = `All games`
  document.getElementById('full-stats').innerHTML = `Wins: ${wins} Losses: ${matches.length - wins}`
  tableTop(fullTable)
  // rival table
  const rivalTable = document.getElementById('rival-table')
  clearTable(rivalTable)
  const frequencyValues = Array.from(frequency.values())
  const maximumFrequency = Math.max(...frequencyValues)
  const rival = Array.from(frequency.keys())[frequencyValues.findIndex(value => value == maximumFrequency)] // rival is the last (because matches are reversed, first in time) frequency entry found with the [maximumFrequency]
  document.getElementById('rival-title').innerHTML = `Rival: ${rival}`
  document.getElementById('rival-stats').innerHTML = `Games played: ${maximumFrequency}`
  matches.forEach(match => {
    if (match.winning_algo.user != rival && match.losing_algo.user != rival) return
    insertMatch(rivalTable, match, algoId)
  })
  tableTop(rivalTable)
  // render chart
  if (chart == undefined) chart = new Chart(document.getElementById('chart').getContext('2d'), chartConfig)
  else chart.update()
}

/// Clears table if it is already populated (on update).
function clearTable(table) {
  const previousRows = table.rows.length
  for (i = 0; i < previousRows; i++) table.deleteRow(0)
}

/// Inserts a row into a [table]. Columns are filled in based on a [match] and the selected algo, i.e. [algoId].
function insertMatch(table, match, algoId) {
  const won = match.winning_algo.id == algoId
  const opponent = won ? match.losing_algo : match.winning_algo
  insertEntry(table, [opponent.name, won ? 'W' : 'L', match.turns, opponent.elo, `<a href='https://terminal.c1games.com/watch/${match.id}' target='_blank'>watch</a>`])
}

/// Inserts a row acting as the header of a [table].
function tableTop(table) {
  insertEntry(table, ['Algo name', 'Result', 'Turns', 'Elo', 'Game'].map((string) => `<p>${string}</p>`))
}

/// Shorthand to insert a list of [cells] as a row into a [table] as first entry.
function insertEntry(table, cells) {
  const row = table.insertRow(0)
  cells.forEach((cell, index) => (row.insertCell(index).innerHTML = cell))
}

window.onload = () => {
  document.getElementById('find').onclick = () => window.location.search = `?id=${document.getElementById('algo-id').value}`
  document.getElementById('update').onclick = () => plot()
  plot()
}

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
  if (window.location.search == '') return document.getElementById('loading').innerHTML = ''
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
  const { name, elo } = matches[0].winning_algo.id == algoId ? matches[0].winning_algo : matches[0].losing_algo
  // update config
  document.querySelector('#name').innerText = `algo: ${name}`
  document.querySelector('#created-at').innerText = `created at: ${(new Date(createdAt)).toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: false, timeZone: 'UTC' })} UTC`
  document.getElementById('loading').innerHTML = ''
  document.title = `${name} (${algoId})`
  chartConfig.options.title.text = `"${name}" elo over matches`
  chartConfig.data.datasets[0].data.length = 0
  chartConfig.data.labels.length = 0
  let previousElo = 1500
  const frequency = new Map()
  // full table
  const fullTable = document.getElementById('full-table')
  let previousRows = fullTable.rows.length
  for (i = 0; i < previousRows; i++) fullTable.deleteRow(0)
  let wins = 0
  matches.forEach((match, index) => {
    const won = match.winning_algo.id == algoId
    const opponent = won ? match.losing_algo : match.winning_algo
    insertMatch(fullTable, match, algoId)
    if (won) wins++
    frequency.set(opponent.user, (frequency.get(opponent.user) || 0) + 1)
    chartConfig.data.labels.push(opponent.name)
    chartConfig.data.datasets[0].data.push(index == matches.length - 1 ? elo : Math.round((previousElo += K * ((won ? 1 : 0) - 1 / (1 + Math.pow(10, (opponent.elo - previousElo) / 400))))))
  })
  document.getElementById('full-title').innerHTML = `All games`
  document.getElementById('full-stats').innerHTML = `Wins: ${wins} Losses: ${matches.length - wins}`
  tableTop(fullTable)
  // rival table
  const rivalTable = document.getElementById('rival-table')
  previousRows = rivalTable.rows.length
  for (i = 0; i < previousRows; i++) rivalTable.deleteRow(0)
  const frequencyValues = Array.from(frequency.values())
  const maximumFrequency = Math.max(...frequencyValues)
  const rival = Array.from(frequency.keys())[frequencyValues.findIndex(value => value == maximumFrequency)]
  document.getElementById('rival-title').innerHTML = `Rival: ${rival}`
  document.getElementById('rival-stats').innerHTML = `Games played: ${maximumFrequency}`
  matches.forEach(match => {
    if (match.winning_algo.user != rival && match.losing_algo.user != rival) return
    insertMatch(rivalTable, match, algoId)
  })
  tableTop(rivalTable)

  if (chart == undefined) chart = new Chart(document.getElementById('chart').getContext('2d'), chartConfig)
  else chart.update()
}

function insertMatch(table, match, algoId) {
  const won = match.winning_algo.id == algoId
  const opponent = won ? match.losing_algo : match.winning_algo
  insertEntry(table, [opponent.name, won ? 'W' : 'L', match.turns, opponent.elo, `<a href='https://terminal.c1games.com/watch/${match.id}' target='_blank'>watch</a>`])
}

function tableTop(table) {
  insertEntry(table, ['Algo name', 'Result', 'Turns', 'Elo', 'Game'].map((string) => `<p>${string}</p>`))
}

function insertEntry(table, cells) {
  const row = table.insertRow(0)
  cells.forEach((cell, index) => (row.insertCell(index).innerHTML = cell))
}

window.onload = () => {
  document.getElementById('find').onclick = () => window.location.search = `?id=${document.getElementById('algo-id').value}`
  document.getElementById('update').onclick = () => plot()
  plot()
}

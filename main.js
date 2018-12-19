var dps = []
var tt = []
var chart = new CanvasJS.Chart('chartContainer', {
  exportEnabled: true,
  title: {
    text: tt
  },
  axisX: {
    title: 'Opponents'
  },
  axisY: {
    title: 'My Elo',
    includeZero: false
  },
  data: [
    {
      type: 'spline',
      markerSize: 0,
      dataPoints: dps
    }
  ]
})
var rival = []
var frequ = []
var wl = []
const K = 32
var EloDifference = 0
var percentage = 0
var enemy_elo = 0

async function plot() {
  const algoId = window.location.search.split('?')[1].split('id=')[1]
  document.getElementById('algo-id').value = algoId
  const response = await (await fetch(
    `https://terminal.c1games.com/api/game/algo/${algoId}/matches`
  )).json()
  const matches = response.data.matches
  if (!(matches.length > 0)) return
  const algoData =
    matches[0].winning_algo.id == algoId
      ? matches[0].winning_algo
      : matches[0].losing_algo
  const { name, elo } = algoData

  document.getElementById('loading').innerHTML = ''
  document.title = `${name} - matches`

  tt.pop()
  tt.push(`"${name}" elo over matches`)
  let my_score = 0
  let my_elo = 1500
  for (var i = 0; i < 100; i++) {
    dps.pop()
    rival.pop()
    frequ.pop()
  }
  var x = document.getElementById('fullTable').rows.length
  for (var i = 0; i < x; i++) {
    document.getElementById('fullTable').deleteRow(0)
  }
  for (var i = matches.length - 1; i >= 0; i--) {
    if (i == matches.length - 1) {
      document.getElementById('ftittle').innerHTML =
        '<center>All games:</center>'
    }
    if (response.data.matches[i].winning_algo.id == algoId) {
      my_score = 1
      enemy_elo = Number(response.data.matches[i].losing_algo.elo)
      enemy_name = response.data.matches[i].losing_algo.user
      var table = document.getElementById('fullTable')
      var row = table.insertRow(0)
      var cell1 = row.insertCell(0)
      var cell2 = row.insertCell(1)
      var cell3 = row.insertCell(2)
      var cell4 = row.insertCell(3)
      var cell5 = row.insertCell(4)
      cell1.innerHTML = response.data.matches[i].losing_algo.name
      cell2.innerHTML = 'W'
      cell3.innerHTML = response.data.matches[i].turns
      cell4.innerHTML = response.data.matches[i].losing_algo.elo
    } else {
      my_score = 0
      enemy_elo = Number(response.data.matches[i].winning_algo.elo)
      enemy_name = response.data.matches[i].winning_algo.user
      var table = document.getElementById('fullTable')
      var row = table.insertRow(0)
      var cell1 = row.insertCell(0)
      var cell2 = row.insertCell(1)
      var cell3 = row.insertCell(2)
      var cell4 = row.insertCell(3)
      var cell5 = row.insertCell(4)
      cell1.innerHTML = response.data.matches[i].winning_algo.name
      cell2.innerHTML = 'L'
      cell3.innerHTML = response.data.matches[i].turns
      cell4.innerHTML = response.data.matches[i].winning_algo.elo
    }
    cell5.innerHTML = `<a href='https://terminal.c1games.com/watch/${response.data.matches[i].id}' target='_blank'>watch</a>`
    var index = -1
    for (var j = 0; j < rival.length; j++) {
      if (rival[j] == enemy_name) {
        index = j
        break
      }
    }
    if (index != -1) {
      frequ[index] += 1
    } else {
      rival.push(enemy_name)
      frequ.push(1)
    }
    EloDifference = enemy_elo - my_elo
    percentage = 1 / (1 + Math.pow(10, EloDifference / 400))
    my_elo += Math.round(K * (my_score - percentage))

    if (i == 0) my_elo = elo
    dps.push({
      label: enemy_name,
      y: my_elo
    })
  }
  var temp = -1
  for (var i = 0; i < frequ.length; i++) {
    if (frequ[i] > temp) {
      temp = i
    }
  }
  if (temp != -1) {
    var x = document.getElementById('myTable').rows.length
    for (var i = 0; i < x; i++) {
      document.getElementById('myTable').deleteRow(0)
    }
    document.getElementById('opp').innerHTML =
      '<center>Rival:&nbsp' +
      rival[temp] +
      '<br> Games played:&nbsp' +
      frequ[temp] +
      '</center>'
    for (var i = 0; i < matches.length; i++) {
      if (response.data.matches[i].winning_algo.id == algoId) {
        if (rival[temp] == response.data.matches[i].losing_algo.user) {
          var table = document.getElementById('myTable')
          var row = table.insertRow(0)
          var cell1 = row.insertCell(0)
          var cell2 = row.insertCell(1)
          var cell3 = row.insertCell(2)
          var cell4 = row.insertCell(3)
          var cell5 = row.insertCell(4)
          cell1.innerHTML = response.data.matches[i].losing_algo.name
          cell2.innerHTML = 'W'
          cell3.innerHTML = response.data.matches[i].turns
          cell4.innerHTML = response.data.matches[i].losing_algo.elo
        }
      } else {
        if (rival[temp] == response.data.matches[i].winning_algo.user) {
          var table = document.getElementById('myTable')
          var row = table.insertRow(0)
          var cell1 = row.insertCell(0)
          var cell2 = row.insertCell(1)
          var cell3 = row.insertCell(2)
          var cell4 = row.insertCell(3)
          var cell5 = row.insertCell(4)
          cell1.innerHTML = response.data.matches[i].winning_algo.name
          cell2.innerHTML = 'L'
          cell3.innerHTML = response.data.matches[i].turns
          cell4.innerHTML = response.data.matches[i].winning_algo.elo
        }
      }
      cell5.innerHTML = `<a href='https://terminal.c1games.com/watch/${response.data.matches[i].id}' target='_blank'>watch</a>`
      if (i == 0) {
        var table = document.getElementById('fullTable')
        var row = table.insertRow(0)
        var cell1 = row.insertCell(0)
        var cell2 = row.insertCell(1)
        var cell3 = row.insertCell(2)
        var cell4 = row.insertCell(3)
        var cell5 = row.insertCell(4)
        cell1.innerHTML = 'Algo name'
        cell2.innerHTML = 'Result'
        cell3.innerHTML = 'Turns'
        cell4.innerHTML = 'Elo'
        cell5.innerHTML = 'Game'
      }
    }
    var table = document.getElementById('myTable')
    var row = table.insertRow(0)
    var cell1 = row.insertCell(0)
    var cell2 = row.insertCell(1)
    var cell3 = row.insertCell(2)
    var cell4 = row.insertCell(3)
    var cell5 = row.insertCell(4)
    cell1.innerHTML = 'Algo name'
    cell2.innerHTML = 'Result'
    cell3.innerHTML = 'Turns'
    cell4.innerHTML = 'Elo'
    cell5.innerHTML = 'Game'
  }
  if (dps.length > matches.length) {
    dps.shift()
  }
  chart.render()
}

window.onload = () => {
  document.getElementById('find').onclick = () =>
    (window.location.search = `?id=${document.getElementById('algo-id').value}`)
  document.getElementById('update').onclick = () => plot()
  plot()
}

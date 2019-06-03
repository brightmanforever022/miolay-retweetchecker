import React, { Component } from 'react'
import Chart from 'chart.js'

class DoughnutChart extends Component {
  chart = null

  componentDidMount(){
    const ctx = document.getElementById(this.props.id).getContext('2d')

    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ["Real People", "Suspicious Users", "Bots"],
        datasets: [{
          label: '# of Votes',
          data: [this.props.real, this.props.suspicious, this.props.bots],
          backgroundColor: [
            'rgb(54, 162, 235)',
            'rgb(252, 200, 27)',
            'rgb(255, 99, 132)'
          ]
        }]
      },
      options: {
        legend: { 
          display: false
        },
        tooltips: {
          callbacks: {
            label: function(tooltipItem, data) {
                  var label = data.labels[tooltipItem.index]
                  label += ': ' + data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index] + '%'
                  return label
            }
          },
          bodyFontSize: 11
        }
      }
    })
  }

  componentWillReceiveProps(nextProps) {
    this.chart.data.datasets[0].data = [nextProps.real, nextProps.suspicious, nextProps.bots]
    this.chart.update()
  }

  render(){

    return (
      <div className="doughnut-chart">
        <canvas
          id={this.props.id}
          data-real={this.props.real}
          data-suspicious={this.props.suspicious}
          data-bots={this.props.bots}
          width="400"
          height="400"
        >
        </canvas>
      </div>
    )
  }
}

export default DoughnutChart

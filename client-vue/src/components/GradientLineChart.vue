<script>
// 1. Import Chart.js so you can use the global Chart object
import Chart from 'chart.js'
// 2. Import the `generateChart()` method to create the vue component.
import { generateChart } from 'vue-chartjs'

Chart.Legend.prototype.afterFit = function() {
    this.height = this.height + 15;  // increases spacing between legend and plot
};
// 3. Extend one of the default charts
// http://www.chartjs.org/docs/latest/developers/charts.html
Chart.defaults.GradientLine = Chart.defaults.line;
Chart.controllers.GradientLineChart = Chart.controllers.line.extend({
    update: function() {

    var ctx = this.chart.chart.ctx;
    var gradient = [ctx.createLinearGradient(0, 0, 0, 80),
                        ctx.createLinearGradient(0, 0, 0, 80)]
    gradient[0].addColorStop(0, 'rgba(248, 212, 83, 0.9)')
    gradient[0].addColorStop(0.5, 'rgba(248, 212, 83, 0.6)')
    gradient[0].addColorStop(1, 'rgba(248, 212, 83, 0.3)')
    gradient[1].addColorStop(0, 'rgba(188, 212, 151, 0.9)')
    gradient[1].addColorStop(0.5, 'rgba(188, 212, 151, 0.6)')
    gradient[1].addColorStop(1, 'rgba(188, 212, 151, 0.3)')

    this.chart.data.datasets[1].backgroundColor = gradient[0];
    this.chart.data.datasets[0].backgroundColor = gradient[1]

    this.chart.data.datasets[0].borderWidth = 2
    this.chart.data.datasets[1].borderWidth = 2

    this.chart.data.datasets[0].pointRadius = 0
    this.chart.data.datasets[1].pointRadius = 0
    
    this.chart.data.datasets[0].cubicInterpolationMode = 'monotone'
    this.chart.data.datasets[1].cubicInterpolationMode = 'monotone'

    this.chart.data.datasets[0].borderColor = 'rgba(188, 212, 83, 1)'
    this.chart.data.datasets[1].borderColor = 'rgba(248, 212, 83, 1)'


    return Chart.controllers.line.prototype.update.apply(this, arguments);
  }
 })

// 4. Generate the vue-chartjs component
// First argument is the chart-id, second the chart type.
const GradientLineChart = generateChart('line-gradient', 'GradientLineChart')
import moment from 'moment'

// 5. Extend the CustomLine Component just like you do with the default vue-chartjs charts.

export default {
  extends: GradientLineChart,
  props: {
      chartData: {
        required: false
      },
      refresh: {
        type: Boolean,
        required: false
      }
    },
    data () {
    return {
      gradient: null,
      options: {
        showScale: true,
        scales: {
          yAxes: [{
              scaleLabel: {
                  display: true,
                  labelString: 'Leistung in W'
              },
            ticks: {
              beginAtZero: true,              
            },
            gridLines: {
              display: true,
              color: '#EEF0F4',
              borderDash: [5, 15]
            }
          }],
          xAxes: [ {
              scaleLabel: {
                  display: true,
                  labelString: 'Uhrzeit'
              },
            type: 'time',
            time: {
              displayFormats: {
                'millisecond': 'HH:mm:ss.SSS',
                'second': 'HH:mm:ss',
                'minute': 'HH:mm',
                'hour': 'kk',
                'day': 'MMM DD',
                'week': 'll',
                'month': 'MMM DD'                
                }
            },
            gridLines: {
              display: true,
              color: '#EEF0F4',
              borderDash: [5, 15]
            }
          }]
        },
        tooltips: {
          mode: 'x',
          backgroundColor: 'Ghostwhite',
          bodyFontColor: 'DarkSlateGrey',
          titleFontColor: 'DarkSlateGrey',
          callbacks: {
            title: (tooltipItem, data) => { 
              let yLabel = data.datasets[0].data[tooltipItem[0].index].x          
              return moment(yLabel).format('LLL')
              },
            label: (tooltipItem, data) => {
              let dataset = data.datasets[tooltipItem.datasetIndex]
              let currentValue = dataset.data[tooltipItem.index].y
              let label = dataset.label
              let dim = 'kWh'
              return `${label}: ${currentValue.toFixed(1)} ${dim}`
            }
          }
        },        
        legend: {
          display: true
        },
        responsive: true,
        maintainAspectRatio: false
      }
    }
    },  
  mounted () {
      this.renderChart(this.chartData, this.options)
  },
  watch: {
      refresh () {
        this.renderChart(this.chartData, this.options)
      }
  }
}
</script>

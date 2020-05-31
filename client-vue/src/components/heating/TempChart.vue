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
Chart.defaults.Temp = Chart.defaults.line;
Chart.controllers.Temp = Chart.controllers.line.extend({
    update: function() {

    var ctx = this.chart.chart.ctx;
    var gradient = ctx.createLinearGradient(0, 0, 0, 40)
    gradient.addColorStop(0, 'rgba(51, 102, 204, 0.9)')
    gradient.addColorStop(0.5, 'rgba(51, 102, 204, 0.6)')
    gradient.addColorStop(1, 'rgba(51, 102, 204, 0.3)')
    
    this.chart.data.datasets[0].backgroundColor = gradient

    this.chart.data.datasets[0].borderWidth = 2

    this.chart.data.datasets[0].pointRadius = 0
    
    this.chart.data.datasets[0].cubicInterpolationMode = 'monotone'

    this.chart.data.datasets[0].borderColor = 'rgba(51, 102, 204, 1)'


    return Chart.controllers.line.prototype.update.apply(this, arguments);
  }
 })

// 4. Generate the vue-chartjs component
// First argument is the chart-id, second the chart type.
const TempChart = generateChart('line-gradient', 'Temp')
import moment from 'moment'

// 5. Extend the CustomLine Component just like you do with the default vue-chartjs charts.

export default {
  extends: TempChart,
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
                  labelString: 'Temperatur in °C'
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
              let dim = '°C'
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

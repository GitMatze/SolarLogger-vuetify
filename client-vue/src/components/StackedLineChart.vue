<script>
// 1. Import Chart.js so you can use the global Chart object
import Chart from 'chart.js'
// 2. Import the `generateChart()` method to create the vue component.
import { generateChart } from 'vue-chartjs'

// 3. Extend one of the default charts
// http://www.chartjs.org/docs/latest/developers/charts.html
Chart.defaults.StackedLine = Chart.defaults.line;
Chart.controllers.StackedLine = Chart.controllers.line.extend({
    update: function() {
    // get the min and max values
    var min = this.chart.data.datasets[0].data.reduce((min, p) => p.y < min ? p.y : min, this.chart.data.datasets[0].data[0].y);
    var max = this.chart.data.datasets[0].data.reduce((max, p) => p.y > max ? p.y : max, this.chart.data.datasets[0].data[0].y);
    var yScale = this.getScaleForId(this.getDataset().yAxisID);

    // figure out the pixels for these and the value 0
    var top = yScale.getPixelForValue(max);
    var zero = yScale.getPixelForValue(0);
    var bottom = yScale.getPixelForValue(min);

    // build a gradient that switches color at the 0 point
    var ctx = this.chart.chart.ctx;
    var gradient = ctx.createLinearGradient(0, top, 0, bottom);
    var ratio = Math.min((zero - top) / (bottom - top), 1);
    /* eslint-disable no-console */
     /*  console.log(`RATIO:  ${ratio}`); 
      console.log(`min:  ${min}`); 
      console.log(`max:  ${max}`);   */   
    /* eslint-enable no-console */
    ratio = Math.max(ratio,0)
    gradient.addColorStop(0, 'rgba(188, 212, 151, 0.9)');
    gradient.addColorStop(ratio, 'rgba(188, 212, 151, 0.9)');
    gradient.addColorStop(ratio, 'rgba(248, 212, 83, 0.5)');
    gradient.addColorStop(1, 'rgba(248, 212, 83, 0.5)');
    this.chart.data.datasets[0].backgroundColor = ratio==1 ? 'rgba(188, 212, 151, 0.9)' 
                              : ( ratio==0 ? 'rgba(248, 212, 83, 0.5)' : gradient)
    this.chart.data.datasets[1].backgroundColor = 'rgba(248,212,83, 0.5)';
    
    this.chart.data.datasets[0].pointRadius = 0
    this.chart.data.datasets[1].pointRadius = 0

    this.chart.data.datasets[0].borderWidth = 0
    this.chart.data.datasets[1].borderWidth = 0

    this.chart.data.datasets[0].cubicInterpolationMode = 'monotone'
    this.chart.data.datasets[1].cubicInterpolationMode = 'monotone'

    this.chart.data.datasets[0].borderColor = 'ghostwhite' // 'rgba(207, 180, 149, 0.9)'
    this.chart.data.datasets[1].borderColor = 'ghostwhite' // 'rgba(240, 207, 133, 0.3)'



    return Chart.controllers.line.prototype.update.apply(this, arguments);
  }
 })

// 4. Generate the vue-chartjs component
// First argument is the chart-id, second the chart type.
const StackedLineChart = generateChart('line-stacked', 'StackedLine')
import moment from 'moment'
// 5. Extend the CustomLine Component just like you do with the default vue-chartjs charts.

export default {
  extends: StackedLineChart,
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

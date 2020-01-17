<script>
  import { Bar } from 'vue-chartjs'

  export default {
    extends: Bar,
    props: {
      chartData: {
        required: false
      }      
    },
    data () {
      return {
        gradient: null,
        options: {
          showScale: true,
          scales: {
            x: {
              stacked: true              
            },
            y: {
              stacked: true
            },
            yAxes: [{
              position: 'left',
              id: 'y-axis-left',
              scaleLabel: {
                  display: true,
                  labelString: 'kWh'
              },
              ticks: {
                beginAtZero: false

              },
              gridLines: {
                display: true,
                color: '#EEF0F4',
                borderDash: [5, 15]
              },
              categoryPercentage: 1,
              barPercentage: 0.4
            }, {
              display: true, 
              position: 'right',
              id: 'y-axis-right',
              ticks: {
                beginAtZero: true,
                max: 100
              },
              scaleLabel: {
                display: true,
                labelString: 'Prozent'
              }
            }],
            xAxes: [ {           
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
              label: (tooltipItem, data) => {
                  let dataset = data.datasets[tooltipItem.datasetIndex]
                  let currentValue = dataset.data[tooltipItem.index]
                  let label = dataset.label
                  let dim = dataset.type == 'line' ? '%' : 'kWh'
                  return `${label}: ${Math.round(currentValue)} ${dim}`
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
    }   
  }
</script>

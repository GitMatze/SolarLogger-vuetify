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
            }],
            xAxes: [ {           
              gridLines: {
                display: true,
                color: '#EEF0F4',
                borderDash: [5, 15]
              }
            }]
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
     /*  this.gradient = this.$refs.canvas
        .getContext('2d')
        .createLinearGradient(0, 0, 0, 450)

      this.gradient.addColorStop(0, 'rgba(52, 217, 221, 0.6)')
      this.gradient.addColorStop(0.5, 'rgba(52, 217, 221, 0.25)')
      this.gradient.addColorStop(1, 'rgba(52, 217, 221, 0)')

      this.renderChart({
        labels: this.chartLabels,
        datasets: [
          {
            label: 'downloads',
            borderColor: '#249EBF',
            pointBackgroundColor: 'rgba(0,0,0,0)',
            pointBorderColor: 'rgba(0,0,0,0)',
            pointHoverBorderColor: '#249EBF',
            pointHoverBackgroundColor: '#fff',
            pointHoverRadius: 4,
            pointHitRadius: 10,
            pointHoverBorderWidth: 1,
            borderWidth: 1,
            backgroundColor: this.gradient,
            hoverBackgroundColor: this.gradient,
            data: this.chartData
          }
        ]
      }, this.options)

      setTimeout(() => {
        this.download()
      }, 500) */
    }, 
    methods: {
      formatNumber (num) {
        let numString = Math.round(num).toString()
        let numberFormatMapping = [[6, 'm'], [3, 'k']]
        for (let [numberOfDigits, replacement] of numberFormatMapping) {
          if (numString.length > numberOfDigits) {
            let decimal = ''
            if (numString[numString.length - numberOfDigits] !== '0') {
              decimal = '.' + numString[numString.length - numberOfDigits]
            }
            numString = numString.substr(0, numString.length - numberOfDigits) + decimal + replacement
            break
          }
        }
        return numString
      }
    }
  }
</script>

<script>
  import { Line } from 'vue-chartjs'

  export default {
    extends: Line,    
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
            ticks: {
              beginAtZero: false,              
            },
            gridLines: {
              display: true,
              color: '#EEF0F4',
              borderDash: [5, 15]
            }
          }],
          xAxes: [ {
            type: 'time',
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
      // this.chartData is created in the mixin.
      // If you want to pass options please create a local options object
      this.renderChart(this.chartData, this.options)
    },
    watch: {
      refresh () {
        this.renderChart(this.chartData, this.options)
      }
    }
    /* watch: {
      refresh () {
        this.renderChart({   // Duplikation beheben
          labels: this.chartLabels.pv,
          datasets: [
            {
              label: 'PV',
              borderColor: '#f0cf85',
              pointBackgroundColor: 'rgba(0,0,0,0)',
              pointBorderColor: 'rgba(0,0,0,0)',
              pointHoverBorderColor: '#249EBF',
              pointHoverBackgroundColor: '#fff',
              pointHoverRadius: 4,
              pointHitRadius: 10,
              pointHoverBorderWidth: 1,
              borderWidth: 1,
              backgroundColor: this.gradient[0],
              data: this.chartData.pv},
            {
              label: 'Grid',
              borderColor: '#cfb495',
              pointBackgroundColor: 'rgba(0,0,0,0)',
              pointBorderColor: 'rgba(0,0,0,0)',
              pointHoverBorderColor: '#249EBF',
              pointHoverBackgroundColor: '#fff',
              pointHoverRadius: 4,
              pointHitRadius: 10,
              pointHoverBorderWidth: 1,
              borderWidth: 1,
              backgroundColor: this.gradient[1],
              data: this.chartData.grid
            }
          ]
        }, this.options)
      }
    }, */
  }
</script>

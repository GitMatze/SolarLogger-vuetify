<template>
  <div class="home">
    <v-container>

    <v-card
      class="mx-auto my-4"
      max-width="1000"
      min-width="800"
      
    >
      <v-list-item two-line>
        <v-list-item-content>
          <v-list-item-title class="headline">Aktuelle Werte</v-list-item-title>
          <v-list-item-subtitle>Mon, 12:30:32</v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
  
      <v-card-text>
        <v-row align="center">
          <v-col class="display-1" cols="6">
            <span class="headline">Photovoltaik:</span> 400 W
          </v-col>
          <v-col class="display-1" cols="6">
            <span class="headline">Netz:</span> 150 W
          </v-col>          
        </v-row>
      </v-card-text>  
    </v-card>

    <v-divider></v-divider>

      <v-card
      class="ma-auto my-4 pa-md-4 pa-sm-2 pa-xs-2"
      max-width="1000"
      >
       <h2 class="title">Leistung von PV und Netz</h2>
       <GradientLineChart chart-id="line-daily" v-if="loaded" :chartData="chartData" :refresh="refresh"/>          
      </v-card>
      <v-card
      class="ma-auto my-4 pa-md-4 pa-sm-2 pa-xs-2"
      max-width="1000"
      >
       <h2 class=title>Stromverbrauch</h2>
       <StackedLineChart chart-id="line-stacked1" :chartData="chartDataStacked" :refresh="refresh"/>
      </v-card>

  
      
    </v-container>     
  </div>
</template>

<script>
  import StackedLineChart from '@/components/StackedLineChart'
    import GradientLineChart from '@/components/GradientLineChart'

  import PostService from '@/components/PostService'

  import moment from 'moment'

  export default {
    components: { 
        StackedLineChart,
        GradientLineChart
    },
    data () {
      return {
          chartData: '',
          chartDataStacked: '',
          refresh: false,
          error: '',
          newPVValue: null,
          newGridValue: null,
          showError: false,
          loaded: false                   
      }
    },

    async created() {
        this.getData()
        setInterval(this.updateClock, 1000);       
    },    
    methods: {
        async postData() {
            if (this.newPVValue == null || this.newGridValue == null ) {
                this.error = 'Please enter a valid value'
                this.showError = true
            } else {
                this.showError = false
                await PostService.insertPost(parseFloat(this.newPVValue),
                                              parseFloat(this.newGridValue) )
                this.getData()
            }
        },        
        async getData() {
            try {
                this.loaded = false
                 var rawData = await PostService.getPosts()
                 var timestamps = rawData.map(entry => entry.timestamp)
                 var pv = rawData.map(entry => entry.pv)
                 var grid = rawData.map(entry => entry.grid)
                 var pv_stacked = pv.map(function(entry, i) {    //stackedPV
                    return entry + grid[i];
                    });                  
                 var zippedPV = pv.map(function(entry, i) {
                    return {x: timestamps[i], y: entry};
                    });
                var zippedPV_stacked = pv_stacked.map(function(entry, i) {
                    return {x: timestamps[i], y: entry};
                    });
                var zippedGrid = grid.map(function(entry, i) {
                    return {x: timestamps[i], y: entry};
                    })
                 
                 this.chartData = {                     
                     datasets: [
                         {label: 'Grid',
                         yAxisID : 'y-axis-0',
                         data: zippedGrid
                         },
                         {label: 'PV',
                         yAxisID : 'y-axis-0',
                         data: zippedPV
                         }]
                 }
                 this.chartDataStacked = {                     
                     datasets: [
                         {label: 'Grid',
                         yAxisID : 'y-axis-0',
                         data: zippedGrid
                         },
                         {label: 'PV',
                         yAxisID : 'y-axis-0',
                         data: zippedPV_stacked
                         }]
                 }
                 setTimeout(() => {
                     this.loaded = true
                    this.refresh = !this.refresh
                }, 100)
            } catch(err) {
                this.error = err.message
            }
        },
        updateClock() {
          var time = moment(new Date).format('hh:mm:ss')
          document.getElementById('time').innerHTML = ['Time', time].join(': ')
        }
    }
  }
</script>

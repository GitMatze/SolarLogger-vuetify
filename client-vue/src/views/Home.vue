<template>
  <div class="home">
    <v-container>
    
    <!-- Desktop -->
    <v-card
      class="mx-auto my-4 hidden-xs-only "
      max-width="1200"
      min-width="600"      
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

    <!-- Phone -->
    <v-card
      class="mx-auto my-4 hidden-sm-and-up "                  
    >
    <v-simple-table>
      <template v-slot:default>        
        <tbody>
          <tr>
            <td>Photovoltaik</td>
            <td>3,73 kw/h</td>
          </tr>
          <tr>
            <td>Netz</td>
            <td>-2,43 kw/h</td>
          </tr>
        </tbody>
      </template>
    </v-simple-table>
    </v-card>

    <v-divider></v-divider>

      <v-card
      class="ma-auto my-4 pa-3"
      max-width="1200"
      >
        <v-container max-width="40" class="d-flex justify-start">
            <h2 class="headline mr-4 pb-3 align-self-center">Tagesübersicht</h2>
          <v-menu
            v-model="menu1"
            :close-on-content-click="false"
            max-width="290"
          >
            <template v-slot:activator="{ on }">
              <v-text-field
                :value="computedDateFormattedMomentjs"
                readonly
                dense
                v-on="on"
                @click:clear="date = null"
              ></v-text-field>
            </template>
            <v-date-picker
              v-model="date"
              @change="menu1 = false"
            ></v-date-picker>
          </v-menu>
          <v-spacer></v-spacer>
        </v-container>

        <v-divider></v-divider>

        <v-container class="mx-auto my-2">
          <h2 class="title d-flex justify-space-between"> Leistung von PV und Netz <span class="overline">heute</span></h2>
         <GradientLineChart chart-id="line-daily" :chartData="chartData" :refresh="refresh"/> 
        </v-container>

        <v-divider></v-divider>
               
        <v-container class="mx-auto my-2">
          <h2 class="title d-flex justify-space-between"> Stromverbrauch <span class="overline">heute</span></h2>
         <StackedLineChart chart-id="line-stacked1" :chartData="chartDataStacked" :refresh="refresh"/>
        </v-container>
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
          date: new Date().toISOString().substr(0, 10),
          menu1: false,                   
      }
    },

    computed: {
      computedDateFormattedMomentjs () {
        return this.date ? moment(this.date).format('l') : ''
      }
    },
    async created() {
        this.getData()
        // setInterval(this.updateClock, 1000);       
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
                         borderColor: 'rgba(188, 212, 83, 1)',
                         backgroundColor: 'rgba(188, 212, 83, 1)',
                         data: zippedGrid
                         },
                         {label: 'PV',
                         borderColor: 'rgba(248, 212, 83, 1)',
                         backgroundColor: 'rgba(248, 212, 83, 1)',
                         yAxisID : 'y-axis-0',
                         data: zippedPV
                         }]
                 }
                 this.chartDataStacked = {                     
                     datasets: [
                         {label: 'Grid',
                         yAxisID : 'y-axis-0',
                         borderColor: 'rgba(188, 212, 83, 1)',
                         backgroundColor: 'rgba(188, 212, 83, 1)',
                         data: zippedGrid
                         },
                         {label: 'PV',
                         borderColor: 'rgba(248, 212, 83, 1)',
                         backgroundColor: 'rgba(248, 212, 83, 1)',
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

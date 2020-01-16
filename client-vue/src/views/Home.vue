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
            <span class="headline">Photovoltaik:</span> {{pv_current}} W
          </v-col>
          <v-col class="display-1" cols="6">
            <span class="headline">Netz:</span> {{grid_current}} W
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
            <td>{{pv_current}} W</td>
          </tr>
          <tr>
            <td>Netz</td>
            <td>{{grid_current}} W</td>
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
            <h2 class="headline mr-9 pb-3 align-self-center hidden-xs-only">Tagesübersicht</h2>
            <v-spacer></v-spacer>
          <v-menu
            v-model="menu1"
            :close-on-content-click="false"
          >
            <template v-slot:activator="{ on }">
              <v-text-field
                :value="computedDateFormattedMomentjs"
                readonly
                dense
                filled
                color='#bcd497'
                label="Datum"
                v-on="on"
                @click:clear="date = null"
              ></v-text-field>
            </template>
            <v-date-picker
              v-model="date"
              no-title
              :max="date_max"
              :min="date_min"
              color='#bcd497'
              @change="getData"
              @click:date="menu1=false"
            ></v-date-picker>
          </v-menu>
          <v-text-field class='mx-2'
            v-model="starttime"
            label="Anfang"
            filled
            dense
            color='#bcd497'
            v-on:keyup.enter="getData"
          ></v-text-field>
           <v-text-field
            v-model="endtime"
            label="Ende"
            filled
            dense
            color='#bcd497'
            v-on:keyup.enter="getData"

          ></v-text-field>
        </v-container>

         <v-banner v-model="showError" transition="slide-y-transition">
        <h1 class="body-2 error--text">{{this.err}}</h1>
        <template v-slot:actions="{ dismiss }">
          <v-btn text color="error" @click="dismiss">OK</v-btn>          
        </template>
      </v-banner>

        <v-divider></v-divider>

        <v-container class="mx-auto my-2">
          <h2 class="title d-flex justify-space-between"> Leistung von PV und Netz </h2>
         <GradientLineChart chart-id="line-daily" :chartData="chartData" :refresh="refresh"/> 
        </v-container>

        <v-divider></v-divider>
               
        <v-container class="mx-auto my-2">
          <h2 class="title d-flex justify-space-between"> Stromverbrauch </h2>
         <StackedLineChart chart-id="line-stacked1" :chartData="chartDataStacked" :refresh="refresh"/>
        </v-container>
      </v-card>

  
      
    </v-container>     
  </div>
</template>

<script>
  import StackedLineChart from '@/components/StackedLineChart'
  import GradientLineChart from '@/components/GradientLineChart'
  import APIService from '@/components/APIService'

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
          pv_current: '_ _',
          grid_current: '_ _',
          refresh: false,
          date_max: null,
          date_min: null, 
          err: '',
          log :'',
          newPVValue: null,
          newGridValue: null,
          showError: false,
          date: new Date().toISOString().substr(0, 10),
          menu1: false,
          starttime: moment().subtract(8, 'hour').format('kk:mm'),
          endtime: 'jetzt',
          result:''                    
      }
    },

    computed: {
      computedDateFormattedMomentjs () {
        return this.date ? moment(this.date).format('ll') : ''
      },
      period () {
        return ''.concat(moment( `${this.date}T${this.starttime}` ).format(),'_',
                         moment( `${this.date}T${this.endtime}` ).format())
      }      
    },
    async created() {
        this.getData()
        this.getMinMaxTime()
        this.updateCurrentVals() //first update immediately
        // setInterval(this.updateCurrentVals, 4000);       
    },    
    methods: {
        async getMinMaxTime() {
          var result = await APIService.getMinMaxTime()
          if (result[0].max==undefined) {
            this.err = 'Keine Beschränkungen für Zeitauswahl empfangen.'
            this.showError=true
            return
          }         
          this.date_max = result[0].max
          this.date_min = result[0].min
        },       
        async getData() { // TODO rename
          if (!this.checkPeriodFormat() ) {return}
            try {
                this.loaded = false
                var rawData = await APIService.getPower(this.period)
                if (rawData[1]==undefined) {
                  this.err= 'Keine Daten empfangen.'
                  this.showError = true
                  return
                }         
                var pv = rawData.map(entry => 
                   ({x: entry.time, y: entry.pv}))
                var grid = rawData.map(entry => 
                   ({x: entry.time, y: entry.grid}))
                var pv_stacked = rawData.map(entry => 
                   ({x: entry.time, y: entry.pv+entry.grid}))

                 this.chartData = {                     
                     datasets: [
                         {label: 'Netz',
                         yAxisID : 'y-axis-0',
                         borderColor: 'rgba(188, 212, 83, 1)',
                         backgroundColor: 'rgba(188, 212, 83, 1)',
                         data: grid
                         },
                         {label: 'PV',
                         borderColor: 'rgba(248, 212, 83, 1)',
                         backgroundColor: 'rgba(248, 212, 83, 1)',
                         yAxisID : 'y-axis-0',
                         data: pv
                         }]
                 }
                 this.chartDataStacked = {                     
                     datasets: [
                         {label: 'Netz',
                         yAxisID : 'y-axis-0',
                         borderColor: 'rgba(188, 212, 83, 1)',
                         backgroundColor: 'rgba(188, 212, 83, 1)',
                         data: grid
                         },
                         {label: 'PV',
                         borderColor: 'rgba(248, 212, 83, 1)',
                         backgroundColor: 'rgba(248, 212, 83, 1)',
                         yAxisID : 'y-axis-0',
                         data: pv_stacked
                         }]
                 }
                 this.loaded = true //TODO loaded is not used at all
                 this.refresh = !this.refresh                
            } catch(err) {
                this.err = `Error ocurred while fetching chart data: ${err.message}`
                this.showError = true
                
            }
        },
        // checks if input day time is valid 
        checkPeriodFormat() { 
          this.showError = false 
          if (this.endtime.toLowerCase() == 'jetzt') {
            this.endtime = moment().format('kk:mm')
          }        
          this.starttime = moment(this.starttime,'kk:mm').format('kk:mm')
          this.endtime = moment(this.endtime,'kk:mm').format('kk:mm')            
          
          if (this.starttime == 'Invalid date' || this.endtime == 'Invalid date') {
            return false
          }
          else if ( moment(this.endtime, 'kk:mm').diff( moment(this.starttime, 'kk:mm') ) <0 ){
            this.err = 'Die Anfangszeit darf nicht größer als die Endzeit sein.'
            this.showError = true
            return false
          }
          else {
            return true
          }                 
        },
        async updateCurrentVals() {
          var rawData = await APIService.getCurrentVals()
          this.result = rawData
          if ( !(typeof rawData[0].pv == 'number') || !(typeof rawData[0].grid == 'number')) {
            this.err = 'Unerwarter Fehler beim Updaten der Momentanwerte.'
            this.showError = true
          }
          else if (rawData[0].pv == null){
            this.error = 'Der Sensor scheint keine neuen Daten zu liefern.'
            this.showError = true
          }
          else {
            this.pv_current = rawData[0].pv
            this.grid_current = rawData[0].grid
          }

        }        
    }
  }
</script>

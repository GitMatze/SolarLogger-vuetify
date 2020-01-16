<template>
  <div class="home">
    <v-container>
      <v-card
      class="ma-auto my-4 pa-3"
      max-width="1200"
      >
   <!--      <v-container max-width="40" class="d-flex justify-start">
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
        </v-container> -->

         <v-banner v-model="showError" transition="slide-y-transition">
          <h1 class="body-2 error--text">{{this.err}}</h1>
          <template v-slot:actions="{ dismiss }">
           <v-btn text color="error" @click="dismiss">OK</v-btn>          
          </template>
        </v-banner>

        <v-divider></v-divider>

        <v-container class="mx-auto my-2">
          <h2 class="title d-flex justify-space-between"> Monatsübersicht </h2>
          <bar-chart v-if="loaded" chart-id="bar-yearly" :chart-data="chartData"/> 
        </v-container>       
      </v-card>

  
      
    </v-container>     
  </div>
</template>

<script>
  import BarChart from '@/components/BarChart'

  import APIService from '@/components/APIService'

  import moment from 'moment'

  export default {
    components: { 
        BarChart
    },
    data () {
      return {
          chartData: '',
          chartLabels: '',
          refresh: false,
          err: '',
          showError: false,
          date: '2020-01-12',// new Date().toISOString().substr(0, 10),
          starttime: moment().subtract(1000, ('seconds')).format('kk:mm'),
          endtime: moment().format('kk:mm'),
          rawData: '',
          loaded:true
      }
    },

    computed: {      
      period () {
        return ''.concat(moment( `${this.date}T${this.starttime}` ).format(),'_',
                         moment( `${this.date}T${this.endtime}` ).format())
      }      
    },
    async created() {
        this.getData()
        // this.getMinMaxTime()
    },    
    methods: {
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
        /* async getMinMaxTime() {
          var result = await APIService.getMinMaxTime()
          if (result[0].max==undefined) {
            this.err = 'Keine Beschränkungen für Zeitauswahl empfangen.'
            this.showError=true
            return
          }         
          this.date_max = result[0].max
          this.date_min = result[0].min
        },        */
        async getData() { // TODO rename
            try {
                this.loaded = false
                var rawData = await APIService.getEnergyPerMonth()
                this.rawData = rawData
             
                if (rawData[0].pv_month==undefined) {
                  this.err= 'Keine Daten empfangen.'
                  this.showError = true
                  return
                }

                var pv_month = rawData.map(entry => entry.pv_month / 1000)
                var grid_in_month = rawData.map(entry => entry.grid_in_month / 1000)
                var grid_out_month = rawData.map(entry => entry.grid_out_month / 1000)
                var pv_consumed = rawData.map(entry => (entry.pv_month - entry.grid_in_month) / 1000)       
                var labels = rawData.map(entry => moment(entry.month, 'YYYY MM').format('MMM YY'))

                this.chartData = {
                  labels: labels,
                  datasets: [{
                    label: 'PV gesamt',
                    backgroundColor: 'rgba(248, 212, 83, 1)',
                    hoverBackgroundColor: '#FCD853',
                    stack: 'Stack 0',
                    data: pv_month
                  }, {
                    label: 'PV eingespeist',
                    backgroundColor: '#e3dcbd',
                    hoverBackgroundColor: '#c1a646',
                    stack: 'Stack 1',
                    data: grid_in_month
                  }, {
                    label: 'PV verbraucht',
                    backgroundColor: '#fcf1c8',
                    hoverBackgroundColor: '#c2b589',
                    stack: 'Stack 1',
                    data: pv_consumed
                  }, {
                    label: 'Netz bezogen',
                    backgroundColor: 'rgba(188, 212, 83, 1)',
                    hoverBackgroundColor: '#c1d75f',
                    stack: 'Stack 1',
                    data: grid_out_month
                  }]
                }
                
                
                this.loaded = true
                this.refresh = !this.refresh                
            } catch(err) {
                this.err = `Error ocurred while fetching chart data: ${err.message}`
                this.showError = true
                
            }
        }   
    }
  }
</script>

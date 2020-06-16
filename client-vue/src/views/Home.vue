<template>
  <div class="home">
    <v-container>
      <Statusbar/>
      <v-divider></v-divider>

      <v-card
      class="ma-auto my-4 pa-3"
      max-width="1300"
      >
        <v-container max-width="40" class="d-flex justify-start">
            <h2 class="headline mr-9 pb-3 align-self-center hidden-xs-only">Tagesverlauf</h2>
            <v-spacer></v-spacer>
            <v-spacer></v-spacer>
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

        <div v-for="(err, index) in errs"
        v-bind:key="index"        >
          <v-banner v-model="err.show" transition="slide-y-transition">
            <h1 class="body-2 error--text">{{err.msg}}</h1>
            <template v-slot:actions="{ dismiss }">
              <v-btn text color="error" @click="dismiss">OK</v-btn>          
            </template>
          </v-banner>
       </div>
        
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
  import Statusbar from '@/components/StatusBar'

  import moment from 'moment'
  moment.locale('de');

  export default {
    components: { 
        StackedLineChart,
        GradientLineChart,
        Statusbar
    },
    data () {
      return {
          chartData: '',
          chartDataStacked: '',          
          refresh: false,
          date_max: null,
          date_min: null, 
          errs: {
            getMinMaxTime: {show: false, msg:''},
            getData: {show: false, msg:''},
            checkPeriodFormat: {show: false, msg:''},            
          },
          log :'',
          date: moment().format().substr(0, 10),
          menu1: false,
          starttime: moment().startOf('day').format('HH:mm'),
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
    },    
    methods: {
        async getMinMaxTime() {
          this.errs.getMinMaxTime.show = false
          var result = await APIService.getMinMaxTime("energy")
          if (result[0].max==undefined) {
            this.errs.getMinMaxTime.msg = 'Keine Beschränkungen für Zeitauswahl empfangen.'
            this.errs.getMinMaxTime.show=true
            return
          }         
          this.date_max = result[0].max
          this.date_min = result[0].min
        },       
        async getData() { // TODO rename
          if (!this.checkPeriodFormat() ) {return}
            try {
                this.errs.getData.show = false
                this.loaded = false
                var rawData = await APIService.getPeriod(this.period, 'power')
                if (rawData[1]==undefined) {
                  this.errs.getData.msg= 'Keine Daten empfangen.'
                  this.errs.getData.show = true
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
                this.errs.getData.msg = `Error ocurred while fetching chart data: ${err.message}`
                this.errs.getData.show = true
                
            }
        },
        // checks if input day time is valid 
        checkPeriodFormat() { 
          this.errs.checkPeriodFormat.show = false 
          if (this.endtime.toLowerCase() == 'jetzt') {
            this.endtime = moment().format('HH:mm')
          }        
          this.starttime = moment(this.starttime,'HH:mm').format('HH:mm')
          this.endtime = moment(this.endtime,'HH:mm').format('HH:mm')            
          
          if (this.starttime == 'Invalid date' || this.endtime == 'Invalid date') {
            return false
          }
          // TODO was ist mit 24 Uhr? 
          else if ( moment(this.endtime, 'HH:mm').diff( moment(this.starttime, 'HH:mm') ) <0 ){ 
            this.errs.checkPeriodFormat.msg = 'Die Anfangszeit darf nicht größer als die Endzeit sein.'
            this.errs.checkPeriodFormat.show = true
            return false
          }
          else {
            return true
          }                 
        }   
    }
  }
</script>

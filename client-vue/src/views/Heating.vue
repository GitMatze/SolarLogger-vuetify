<template>
  <div class="home">
    <v-container>
      <StatusbarHeating/>
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
                color='#3366CC'
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
              color='#3366CC'
              @change="getData"
              @click:date="menu1=false"
            ></v-date-picker>
          </v-menu>
          <v-text-field class='mx-2'
            v-model="starttime"
            label="Anfang"
            filled
            dense
            color='#3366CC'
            v-on:keyup.enter="getData"
          ></v-text-field>
           <v-text-field
            v-model="endtime"
            label="Ende"
            filled
            dense
            color='#3366CC'
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
          <h2 class="title d-flex justify-space-between"> Speichertemperatur </h2>
         <TempChart chart-id="line-daily" :chartData="chartData" :refresh="refresh"/> 
        </v-container>     
      </v-card>      
    </v-container>     
  </div>
</template>

<script>
  import TempChart from '@/components/heating/TempChart'
  import APIService from '@/components/APIService'
  import StatusbarHeating from '@/components/heating/StatusBarHeating'

  import moment from 'moment'
  moment.locale('de');

  export default {
    components: { 
        TempChart,
        StatusbarHeating
    },
    data () {
      return {
          chartData: '',
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
          starttime: '-18',// moment().startOf('day').format('HH:mm'),
          endtime: 'jetzt',
          period: '',
          result:''                    
      }
    },

    computed: {
      computedDateFormattedMomentjs () {
        return this.date ? moment(this.date).format('ll') : ''
      } 
    },
    async created() {
        this.getData()
        this.getMinMaxTime()
    },    
    methods: {
        async getMinMaxTime() {
          this.errs.getMinMaxTime.show = false
          var result = await APIService.getMinMaxTime("water_temp")
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
                var rawData = await APIService.getPeriod(this.period, 'water_temp')
                if (rawData[1]==undefined) {
                  this.errs.getData.msg= 'Keine Daten empfangen.'
                  this.errs.getData.show = true
                  return
                }         
                var temp = rawData.map(entry => 
                   ({x: entry.time, y: entry.data}))
                   
                 this.chartData = {                     
                     datasets: [                     
                         {label: 'Temperatur',
                         borderColor: 'rgba(51, 102, 204, 1)',
                         backgroundColor: 'rgba(51, 102, 204, 1)',
                         yAxisID : 'y-axis-0',
                         data: temp
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
        // preceding '-' decreases starttime by one day 
        checkPeriodFormat() { 
          this.errs.checkPeriodFormat.show = false 
          if (this.endtime.toLowerCase().startsWith('j')) { // means jetzt
            this.endtime = moment().format('HH:mm')
          }
          var prev_day = 0 
          if (this.starttime[0]=="-") {
            prev_day = 1
          }

          this.starttime = moment(this.starttime,'HH:mm').format('HH:mm')
          this.endtime = moment(this.endtime,'HH:mm').format('HH:mm')            
          
          if (this.starttime == 'Invalid date' || this.endtime == 'Invalid date') {
            return false
          }          
          // TODO was ist mit 24 Uhr? 
          else if ( !prev_day && moment(this.endtime, 'HH:mm').diff( moment(this.starttime, 'HH:mm') ) <0 ){ 
            this.errs.checkPeriodFormat.msg = 'Die Anfangszeit darf nicht größer als die Endzeit sein.'
            this.errs.checkPeriodFormat.show = true
            return false
          }          
          else {
            var start_date =  moment(this.date).subtract(prev_day, 'days').format().substr(0,10)
            this.period = ''.concat(moment( `${start_date}T${this.starttime}` ).format(),'_',
                         moment( `${this.date}T${this.endtime}` ).format())
            this.starttime = prev_day ? '-'+this.starttime : this.starttime
            return true
          }                 
        }   
    }
  }
</script>

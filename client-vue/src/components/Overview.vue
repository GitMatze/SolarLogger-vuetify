<template>
 
      <v-card
      class="ma-auto my-4 pa-3"
      max-width="1300"
      >
        <h2 class="headline mr-9 pb-3 align-self-center hidden-sm-and-up">{{ options.title }}</h2>
        <v-container max-width="40" class="d-flex align-start justify-start">
            <h2 class="headline mr-9 pb-3 align-self-center hidden-xs-only">{{ options.title }}</h2>
            <v-spacer></v-spacer>
            <v-spacer></v-spacer>
            <v-spacer></v-spacer>
            <v-spacer></v-spacer>
            <!-- Start Date -->
            <!-- <v-container max-width="200"> -->
            <v-menu
              v-model="menu1"
              :close-on-content-click="false"
            >
              <template v-slot:activator="{ on }">
                <div class="mx-2" max-width="10em">
                <v-text-field
                  v-model="formattedStartDate"
                  :value="formattedStartDate"
                  readonly
                  dense
                  filled
                  color='#bcd497'
                  label="Startdatum"
                  v-on="on"
                  @click:clear="startdate = null"
                ></v-text-field>
                </div>
              </template>
              <v-date-picker
                v-model="startdate"
                :type="options.datepickerType"
                no-title
                :max="options.date_max"
                :min="options.date_min"
                color='#bcd497'
                @change="adaptEndDate(); getData()"
                @click:startdate="menu1=false"
              ></v-date-picker>
            </v-menu>

            <!-- End Date -->
            <v-menu
              v-model="menu2"
              :close-on-content-click="false"
            >
              <template v-slot:activator="{ on }">
              <div max-width="10em">
                <v-text-field
                  v-model="formattedEndDate"
                  :value="formattedEndDate"
                  readonly
                  dense
                  filled
                  color='#bcd497'
                  label="Enddatum"
                  v-on="on"
                  @click:clear="enddate = null"
                ></v-text-field>
                </div>
              </template>
              <v-date-picker
                v-model="enddate"
                :type="options.datepickerType"
                no-title
                :max="options.date_max"
                :min="options.date_min"
                color='#bcd497'
                @change="adaptStartDate(); getData()"
                @click:enddate="menu2=false"
              ></v-date-picker>
            </v-menu>
            <v-spacer></v-spacer>
            </v-container>          
        <!-- </v-container> -->

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
          <h2 class="title d-flex justify-space-between"> Verbrauch und Produktion </h2>
          <bar-chart v-if="loaded" chart-id="bar-yearly" :chart-data="chartData"/> 
        </v-container>       
      </v-card>
 
</template>

<script>
  import BarChart from '@/components/BarChart'

  import APIService from '@/components/APIService'

  import moment from 'moment'

  export default {
    components: { 
        BarChart
    },
    props: {
         options: Object
    },
    data () {
      return {
          chartData: '',
          chartLabels: '',
          refresh: false,
          errs: {
            getData: {show: false, msg:''},
            checkPeriodFormat: {show: false, msg:''},
          },
          showError: false,
          menu1: false,
          menu2: false,
          startdate: moment().subtract(this.options.defaultPeriod, this.options.type).format(),
          enddate: moment().format(),
          rawData: '',
          loaded:true,          
      }
    },

    computed: {
      formattedStartDate () {       
        return moment(this.startdate).diff( moment(this.options.date_min)) <0 
        ? moment(this.options.date_min).format(this.options.format) 
        : moment(this.startdate).format(this.options.format)
      },
      formattedEndDate () {
        return this.enddate ? moment(this.enddate).format(this.options.format) : ''
      },      
      period () { 
        var start_full = moment(this.startdate).startOf(this.options.type).format()
        var end_full = moment(this.enddate).endOf(this.options.type).format()
        return ''.concat(start_full,'_',end_full)                         
      }      
    },
    async created() {
        this.getData()
    },    
    methods: {         
        async getData() { // TODO rename
            try {
                this.errs.getData.show=false
                if (!this.checkPeriodFormat()) {return }
                this.loaded = false
                var rawData = await APIService.getEnergyOverview(this.options.type, this.period)
                this.rawData = rawData
             
                if (rawData[0].pv==undefined) { //TODO this will already be catched..
                  this.errs.getData.msg= 'Keine Daten empfangen.'
                  this.errs.getData.show = true
                  return
                }

                var pv = rawData.map(entry => entry.pv / 1e6)
                var grid_in = rawData.map(entry => entry.grid_in / 1e6)
                var grid_out = rawData.map(entry => entry.grid_out / 1e6)
                var pv_consumed = rawData.map(entry => (entry.pv - entry.grid_in) / 1e6)
                var eigen = rawData.map(entry => (entry.pv - entry.grid_in) / entry.pv * 100)
                var autark = rawData.map(entry => (entry.pv - entry.grid_in) / (entry.pv - entry.grid_in + entry.grid_out) * 100)       
                var labels = rawData.map(entry => moment(entry.time, this.options.apiReturnFormat).format(this.options.format))

                this.chartData = {
                  labels: labels,
                  datasets: [{
                    label: 'Eigenverbrauch',
                    borderColor: 'rgba(255, 190, 132, 0.7)',
                    backgroundColor: 'rgba(233, 116, 81, 0)',
                    fill: true,
                    yAxisID: 'y-axis-right',
                    type: 'line',
                    data: eigen
                  }, {
                    label: 'Autarkie',
                    borderColor: 'rgba(117, 205, 120, 0.7)',
                    backgroundColor: 'rgba(166, 175, 127, 0)',
                    fill: true,
                    yAxisID: 'y-axis-right',
                    type: 'line',
                    data: autark
                  }, {
                    label: 'PV gesamt',
                    backgroundColor: '#f4de81',
                    hoverBackgroundColor: '#f4e192',
                    stack: 'Stack 0',
                    data: pv
                  }, {
                    label: 'PV eingespeist',
                    backgroundColor: '#a3c2d7',
                    hoverBackgroundColor: '#b7cad7',
                    stack: 'Stack 1',
                    data: grid_in
                  }, {
                    label: 'PV verbraucht',
                    backgroundColor: '#bdd7e9',
                    hoverBackgroundColor: '#c8dbe9',
                    stack: 'Stack 1',
                    data: pv_consumed
                  }, {
                    label: 'Netz bezogen',
                    backgroundColor: '#cde17b',
                    hoverBackgroundColor: '#d2e197',
                    stack: 'Stack 1',
                    //yAxisID: 'y-axis-left',
                    data: grid_out
                  }]
                }               
                
                this.loaded = true
                this.refresh = !this.refresh                
            } catch(err) {
                this.errs.getData.msg = `Error ocurred while fetching chart data: ${err.message}`
                this.errs.getData.show = true
                
            }
        },
        adaptStartDate() {
            if ( moment(this.enddate).diff( moment(this.startdate) ) <0  
              || moment(this.enddate).diff( moment(this.startdate), this.options.type ) > 11 ){
                
                  // set start date before enddate but not before minmal date
                  this.startdate = moment.max( moment(this.options.date_min), 
                  moment(this.enddate).subtract(11, this.options.type) ).format() 
            }
        },
        adaptEndDate() {
            if ( moment(this.enddate).diff( moment(this.startdate) ) <0  
              || moment(this.enddate).diff( moment(this.startdate), this.options.type ) > 11 ){
                  
                  /* eslint-disable no-console */
                  console.log( this.enddate ) ;
                /* eslint-enable no-console */

                  // set end date after  startdate but not after maximal date
                  this.enddate = moment.min( moment(this.options.date_max), 
                  moment(this.enddate).add(11, this.options.type) ).format() 
            }
        },
        // checks if input day time is valid 
        checkPeriodFormat() {
          this.errs.checkPeriodFormat.show = false             
          if ( moment(this.enddate).diff( moment(this.startdate) ) <0 ){ 
            this.errs.checkPeriodFormat.msg = 'Die Anfangszeit darf nicht größer als die Endzeit sein.'
            this.errs.checkPeriodFormat.show = true
            return false
          }
          else {
              if ( moment(this.enddate).diff( moment(this.startdate), this.options.type) > 12) {

                  this.enddate = moment(this.startdate).add(12, this.options.type).format()  
              }
            return true
          }                 
        }   
    }
  }
</script>

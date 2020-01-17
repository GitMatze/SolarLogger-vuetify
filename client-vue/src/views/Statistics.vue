<template>
  <div class="home">
    <v-container>
      <v-card
      class="ma-auto my-4 pa-3"
      max-width="1200"
      >
        <v-container max-width="40" class="d-flex align-start justify-start">
            <h2 class="headline mr-9 pb-3 align-self-center hidden-xs-only">Monatsübersicht</h2>
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
                type="month"
                no-title
                :max="date_max"
                :min="date_min"
                color='#bcd497'
                @change="getData"
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
                type="month"
                no-title
                :max="date_max"
                :min="date_min"
                color='#bcd497'
                @change="getData"
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
          date_max: null,
          date_min: null,
          errs: {
            getMinMaxTime: {show: false, msg:''},
            getData: {show: false, msg:''},
            checkPeriodFormat: {show: false, msg:''},
          },
          showError: false,
          menu1: false,
          menu2: false,
          startdate: moment().subtract(12, 'months').format(),
          enddate: moment().format(),
          rawData: '',
          loaded:true,
      }
    },

    computed: {
      formattedStartDate () {
        return this.startdate<this.date_min ? moment(this.date_min).format('MMM YYYY') : moment(this.startdate).format('MMM YYYY')
      },
      formattedEndDate () {
        return this.enddate ? moment(this.enddate).format('MMM YYYY') : ''
      },      
      period () { 
        var start_full = moment(this.startdate).startOf('month').format()
        var end_full = moment(this.enddate).endOf('month').format()
        return ''.concat(start_full,'_',end_full)                         
      }      
    },
    async created() {
        this.getData()
        this.getMinMaxTime()
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
            try {
                if (!this.checkPeriodFormat()) {return }
                this.loaded = false
                var rawData = await APIService.getEnergyOverview('month', this.period)
                this.rawData = rawData
             
                if (rawData[0].pv==undefined) {
                  this.errs.getData.msg= 'Keine Daten empfangen.'
                  this.errs.getData.show = true
                  return
                }

                var pv = rawData.map(entry => entry.pv / 1000)
                var grid_in = rawData.map(entry => entry.grid_in / 1000)
                var grid_out = rawData.map(entry => entry.grid_out / 1000)
                var pv_consumed = rawData.map(entry => (entry.pv - entry.grid_in) / 1000)
                var eigen = rawData.map(entry => (entry.pv - entry.grid_in) / entry.pv * 100)
                var autark = rawData.map(entry => (entry.pv - entry.grid_in) / (entry.pv - entry.grid_in + entry.grid_out) * 100)       
                var labels = rawData.map(entry => moment(entry.time, 'YYYY MM').format('MMM YY'))

                this.chartData = {
                  labels: labels,
                  datasets: [{
                    label: 'Eigenverbrauch',
                    borderColor: 'rgba(233, 116, 81, 0.6)',
                    fill: false,
                    yAxisID: 'y-axis-right',
                    type: 'line',
                    data: eigen
                  }, {
                    label: 'Autarkie',
                    borderColor: 'rgba(100, 116, 81, 0.6)',
                    fill: false,
                    yAxisID: 'y-axis-right',
                    type: 'line',
                    data: autark
                  }, {
                    label: 'PV gesamt',
                    backgroundColor: 'rgba(248, 212, 83, 1)',
                    hoverBackgroundColor: '#FCD853',
                    stack: 'Stack 0',
                    data: pv
                  }, {
                    label: 'PV eingespeist',
                    backgroundColor: '#f4e2e2',
                    hoverBackgroundColor: '#f8eded',
                    stack: 'Stack 1',
                    data: grid_in
                  }, {
                    label: 'PV verbraucht',
                    backgroundColor: '#fcf1c8',
                    hoverBackgroundColor: '#fcf2ce',
                    stack: 'Stack 1',
                    data: pv_consumed
                  }, {
                    label: 'Netz bezogen',
                    backgroundColor: 'rgba(188, 212, 83, 1)',
                    hoverBackgroundColor: '#c1d75f',
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
        // checks if input day time is valid 
        checkPeriodFormat() {
          this.errs.checkPeriodFormat.show = false             
          if ( moment(this.enddate).diff( moment(this.startdate) ) <0 ){ 
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

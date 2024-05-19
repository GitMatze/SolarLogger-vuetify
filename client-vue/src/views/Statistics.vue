<template>
  <div class="home">
    <v-container>  

      <div v-for="(err, index) in errs"
        v-bind:key="index"        >
          <v-banner v-model="err.show" transition="slide-y-transition">
            <h1 class="body-2 error--text">{{err.msg}}</h1>
            <template v-slot:actions="{ dismiss }">
              <v-btn text color="error" @click="dismiss">OK</v-btn>          
            </template>
          </v-banner>
        </div>

      <Overview chart-id="month-overview" :options="optionsDays" /> 
      <Overview chart-id="day-overview" :options="optionsMonths" />
      <Overview chart-id="year-overview" :options="optionsYears" />   
    </v-container>     
  </div>
</template>

<script>

  import APIService from '@/components/APIService'
  import Overview from '@/components/Overview'

  // import moment from 'moment'

  export default {
    components: { 
        Overview
    },
    data () {
      return {   
        optionsMonths: {
          type:"month",
          title: "Monatsübersicht",
          date_max: null,
          date_min: null,
          datepickerType: "month",
          apiReturnFormat: 'YYYY MM',
          format: 'MMM YYYY',
          defaultPeriod: 12,
        },
        optionsDays: {
          type:"day",
          title: "Tagesübersicht",
          date_max: null,
          date_min: null,
          datepickerType: "date",
          apiReturnFormat: 'YYYY MM DD',
          format: 'll',
          defaultPeriod: 7,
        },
        optionsYears: {
          type:"year",
          title: "Jahresübersicht",
          date_max: null,
          date_min: null,
          datepickerType: "month",
          apiReturnFormat: 'YYYY',
          format: 'YYYY',
          defaultPeriod: 5,
        },
        errs: {
            getMinMaxTime: {show: false, msg:''},
        },                    
      }
    },

    computed: {     
    },
    async created() {
      this.getMinMaxTime()      
    },    
    methods: {      
        async getMinMaxTime() {
          this.errs.getMinMaxTime.show = false
          try {
            var result = await APIService.getMinMaxTime("energy")            
            this.optionsMonths.date_max = result[0].max  // TODO more elegant?
            this.optionsMonths.date_min = result[0].min
            this.optionsDays.date_max = result[0].max
            this.optionsDays.date_min = result[0].min
            this.optionsYears.date_max = result[0].max
            this.optionsYears.date_min = result[0].min
          }
          catch (err) {
            this.errs.getMinMaxTime.msg = `Fehler beim Laden der Beschränkungen der Zeitauswahl: ${err}`
            this.errs.getMinMaxTime.show = true
          }
        }
    }
  }
</script>

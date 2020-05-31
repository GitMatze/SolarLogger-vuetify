<template>
    <v-container class="pa-0">

        <div v-for="(err, index) in errs"
        v-bind:key="index"        >
          <v-banner v-model="err.show" transition="slide-y-transition">
            <h1 class="body-2 error--text">{{err.msg}}</h1>
            <template v-slot:actions="{ dismiss }">
              <v-btn text color="error" @click="dismiss">OK</v-btn>          
            </template>
          </v-banner>
       </div>

        <!-- Desktop -->
        <v-card
        class="mx-auto my-4 hidden-xs-only "
        max-width="1300"
        min-width="600"      
        >
        <v-list-item two-line>
            <v-list-item-content>
            <v-list-item-title class="headline">Aktuelle Werte</v-list-item-title>
            <v-list-item-subtitle>Letztes Update: {{ last_update_time}}</v-list-item-subtitle>
            </v-list-item-content>
        </v-list-item>
    
        <v-card-text>
            <v-list>
              <v-list-item>
                  <v-list-item-title>Temperatur</v-list-item-title>                        
                  <v-list-item-title>{{current_temp}}  &deg;C</v-list-item-title>
              </v-list-item>
              <v-list-item>
                  <v-list-item-title>Aktuelle Regelung</v-list-item-title>                        
                  <v-list-item-title>Heizstab {{current_control}}</v-list-item-title>
              </v-list-item>              
            </v-list>              
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
                <td>Temperatur</td>
                <td>{{current_temp}} &deg;C </td>
            </tr>
            <tr>
                <td>Aktuelle Regelung</td>
                <td>Heizstab {{current_control}} </td>
            </tr>                 
            </tbody>
        </template>
        </v-simple-table>
        </v-card>
    </v-container>
</template>

<script>

  import APIService from '@/components/APIService'
  import moment from 'moment'
  moment.locale('de');
  

  export default {
    components: { },
    data () {
      return {
          current_temp: '_ _', 
          current_control: '_ _',
          last_update_time: '_ _ : _ _',          
          errs: {
            updateCurrentVals: {show: false, msg:''},
          },
      }     
    }, 
    computed: {},
    async created() {
        this.updateCurrentVals() //first update immediately       
        setInterval(this.updateCurrentVals, 30*1000);            
    }, 
    methods: {
        async updateCurrentVals() {
          try {
            var rawData = await APIService.getCurrentWaterTemp()
            this.result = rawData
            if (rawData[0].water_temp == null){
              this.errs.updateCurrentVals.msg = 'Der Sensor scheint aktuell keine Daten zu liefern.'
              this.errs.updateCurrentVals.show = true
            }
            else if ( !(typeof rawData[0].water_temp == 'number')) {
              this.errs.updateCurrentVals.msg = 'Unerwarter Fehler beim Updaten der Momentanwerte.'
              this.errs.updateCurrentVals.show = true
            }
            else {
              this.current_temp = rawData[0].water_temp
              this.current_control = rawData[0].is_heating ? "an" : "aus"
              this.last_update_time = moment(rawData[0].time).format('dddd HH:mm:ss')
              this.errs.updateCurrentVals.show = false              
            }
          }          
          catch (err) {
            this.errs.updateCurrentVals.msg = `Fehler beim Updaten der Momentanwerte: ${err.message}`
            this.errs.updateCurrentVals.show = true
          }
          

        }   

    }  
  }
</script>

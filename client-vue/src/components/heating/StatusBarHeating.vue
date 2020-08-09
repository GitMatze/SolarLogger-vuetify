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
          <v-row align="center">
            <v-col class="display-1" cols="6">
              <v-list>
                <v-list-item>
                    <v-list-item-title>Temperatur</v-list-item-title>                        
                    <v-list-item-title>{{current_temp}}  &deg;C</v-list-item-title>
                </v-list-item>
                <v-list-item>
                    <v-list-item-title>Aktuelle Zieltemperatur</v-list-item-title>                        
                    <v-list-item-title>{{target_temp}} &deg;C</v-list-item-title>
                </v-list-item>                             
              </v-list>
            </v-col>
            <v-col class="display-1" cols="6">
              <v-list>
                <v-list-item>
                    <v-list-item-title>Aktuelle Regelung</v-list-item-title>                        
                    <v-list-item-title>Heizstab {{current_control}}</v-list-item-title>
                </v-list-item>                  
                <v-list-item>
                    <v-list-item-title>Aktuelle Schaltschwelle</v-list-item-title>                        
                    <v-list-item-title>{{threshold}} W</v-list-item-title>
                </v-list-item>                
            </v-list>
            </v-col>
          </v-row>

          <v-row align="center">
            <v-col class="display-1" cols="6">
            <v-list>
              <v-list-item>
                <v-list-item-title>
                  Sofort auf {{config.force_heating_temp}}&deg;C heizen
                </v-list-item-title>
                <v-list-item>
                  <v-switch 
                  :loading="switch_loading" 
                  :disabled="switch_disabled"
                  value 
                  v-model="force_heating" 
                  v-on:change="postForceHeating">          
                  </v-switch>
                </v-list-item>
              </v-list-item>
            </v-list>
          </v-col>
          <v-col>
            <v-list>
              <v-list-item>
                 <!-- Info Dialog Box  -->
            <div>
              <v-dialog
              v-model="dialog"
              width="510"
              >
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  color="grey lighten"
                  dark
                  v-bind="attrs"
                  v-on="on"
                >
                  Parameter 
                </v-btn>
              </template>

              <v-card>
                <div v-if= "this.config==0">
                  <v-banner>
                    <h1 class="body-2 error--text">Keine Einstellungen für die aktuelle Regelung empfangen.</h1>                    
                  </v-banner>
                </div>
                <div v-else>
                  <v-card-title>
                    Regelparameter im Monat {{this.formatMonth(this.config.month)}}
                  </v-card-title>
                    <v-card-text>
                      Die Zieltemperatur wird über den Tag linear erhöht.
                      Bis morgens um {{ this.formatHour(this.config.starttime+1) }} Uhr beträgt sie {{this.config.min_temp}}&deg;C und steigt dann bis {{ this.formatHour(this.config.endtime) }} Uhr auf 
                      {{this.config.max_temp}}&deg;C an. <br>
                      Die Schaltschwelle, ab der der Heizstab eingeschaltet wird, liegt bei 1200W Überschussleistung. 
                      Ist die Wassertemperatur nach {{ this.formatHour(this.config.endtime) }} Uhr niedriger als {{this.config.max_temp-this.config.lowerThreshold.tempDiff}}&deg;C, 
                      wird die Schaltschwelle auf {{this.config.lowerThreshold.threshold}}W reduziert.  
                    </v-card-text>
                  </div>        
                </v-card>
              </v-dialog>
            </div>            

              </v-list-item>
            </v-list>
            
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
                <td>Temperatur</td>
                <td>{{current_temp}} &deg;C </td>
            </tr>
            <tr>
                <td>Aktuelle Regelung</td>
                <td>Heizstab {{current_control}} </td>
            </tr>            
            <tr>
                <td>Aktuelle Zieltemperatur</td>
                <td>{{target_temp}} &deg;C</td>
            </tr>
            <tr>
                <td>Aktuelle Schaltschwelle</td>
                <td>{{threshold}} W</td>
            </tr>
            <tr>
                <td>Auf {{config.force_heating_temp}}&deg;C heizen</td>
                <td>
                  <v-switch 
                  :loading="switch_loading" 
                  :disabled="switch_disabled"
                  value 
                  v-model="force_heating" 
                  v-on:change="postForceHeating">          
                  </v-switch>
                </td>
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
          target_temp: '_ _',
          threshold: '_ _',
          force_heating: false, 
          last_update_time: '_ _ : _ _',
          config: '',
          dialog: false,    
          switch_loading: false,      
          errs: {
            updateCurrentVals: {show: false, msg:''},
          },
      }     
    }, 
    computed: {
      switch_disabled () {
        var tempDiff = this.current_temp-this.config.force_heating_temp
        return tempDiff>=0
      },
    },
    async created() {
        this.updateCurrentVals() //first update immediately  
        this.getConfig()     
        setInterval(this.updateCurrentVals, 15*1000);            
    }, 
    methods: {
        async getConfig() {
          try {
            var config = await APIService.getCurrent('water_config')
            /* eslint-disable no-console */
            console.log(config);
            /* eslint-enable no-console */
            if (config.endtime != null){
              this.config = config               
            }
          }
          catch {
            // nothing to do
          }          
        },  
        async updateCurrentVals() {
          try {
            var rawData = await APIService.getCurrent('water')
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
              this.target_temp = rawData[0].target_temp
              this.threshold = rawData[0].threshold
              this.force_heating = rawData[0].force_heating
              this.last_update_time = moment(rawData[0].time).format('dddd HH:mm:ss')
              this.errs.updateCurrentVals.show = false  
              this.switch_loading = false            
            }
          }          
          catch (err) {
            this.errs.updateCurrentVals.msg = `Fehler beim Updaten der Momentanwerte: ${err.message}`
            this.errs.updateCurrentVals.show = true
          }
        },
        async postForceHeating() {
          try {        
              this.switch_loading = true;
              await APIService.post('force_heating', {value: this.force_heating} )
              this.switch_loading = false                  
          }          
          catch (err) {
            // Todo: Error
          }
        },
        formatMonth(month) {
          return moment(month, 'M').format('MMMM')
        },
        formatHour(hour) {
          return  moment(hour, 'k').format('k')
        }   


    }  
  }
</script>

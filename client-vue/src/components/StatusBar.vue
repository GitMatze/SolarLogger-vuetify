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
                <v-subheader class="headline">
                     Leistung
                </v-subheader>
                 <v-list>
                    <v-list-item>
                        <v-list-item-title>Photovoltaik</v-list-item-title>                        
                        <v-list-item-title>{{this.current_power.pv}} W</v-list-item-title>
                    </v-list-item>
                    <v-list-item>
                        <v-list-item-title>Netz</v-list-item-title>                        
                        <v-list-item-title>{{this.current_power.grid}} W</v-list-item-title>
                    </v-list-item>
                    <v-list-item>  
                         <v-list-item-title>Verbrauch</v-list-item-title>                        
                        <v-list-item-title>{{this.consumption}} W</v-list-item-title>
                    </v-list-item>
                 </v-list>
            </v-col>
             <v-col class="display-1" cols="6">
                <v-list>
                    <v-subheader class="headline">
                     Energie seit Seitenaufruf
                </v-subheader>
                    <v-list-item>
                        <v-list-item-title>Photovoltaik</v-list-item-title>                        
                        <v-list-item-title>{{this.pv_from_start}} Wh</v-list-item-title>
                    </v-list-item>
                    <v-list-item>
                        <v-list-item-title>Netz bezogen</v-list-item-title>                        
                        <v-list-item-title>{{this.grid_out_from_start}} Wh</v-list-item-title>
                    </v-list-item>
                    <v-list-item>
                        <v-list-item-title>Netz eingespeist</v-list-item-title>                        
                        <v-list-item-title>{{this.grid_in_from_start}} Wh</v-list-item-title>
                    </v-list-item>
                 </v-list>
            </v-col>
            <!-- <v-col class="display-1" cols="6">
                <span class="headline">Netz:</span> {{grid_current}} W
            </v-col>     -->      
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
                <td>{{current_power.pv}} W</td>
            </tr>
            <tr>
                <td>Netz</td>
                <td>{{current_power.grid}} W</td>
            </tr>
            <tr>
                <td>Verbrauch</td>
                <td>{{current_power.grid+current_power.pv}} W</td>
            </tr>
            <tr>
                <td>Photovoltaik  </td>
                <td>{{pv_from_start}} Wh</td>
            </tr>
            <tr>
                <td>Netz bezogen</td>
                <td>{{grid_out_from_start}} Wh</td>
            </tr>
            <tr>
                <td>Netz eingespeist</td>
                <td>{{grid_in_from_start}} Wh</td>
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
          current_power: {pv: '_ _', grid: '_ _'}, 
          current_energy: {pv: '_ _', grid_in: '_ _', grid_out: '_ _'},
          last_update_time: '_ _ : _ _',
          start_energy: {pv: '_ _', grid_in: '_ _', grid_out: '_ _'},
          errs: {
            updateCurrentVals: {show: false, msg:''},
          },
      }     
    }, 
    computed: {
       pv_from_start() { 
           var val =  ((this.current_energy.pv - this.start_energy.pv) / 1e3).toFixed(2)  
           return isNaN(val) ? '_ _' : val
      },
      grid_in_from_start() {
          var val =  ((this.current_energy.grid_in - this.start_energy.grid_in) / 1e3).toFixed(2)   
           return isNaN(val) ? '_ _' : val   
      },
      grid_out_from_start() {
        var val =  ((this.current_energy.grid_out - this.start_energy.grid_out) / 1e3).toFixed(2)  
        return isNaN(val) ? '_ _' : val 
      },
      consumption() {
          var val = this.current_power.pv + this.current_power.grid
          return isNaN(val) ? '_ _' : val
       }
    },
    async created() {
        this.updateCurrentVals() //first update immediately       
        setInterval(this.updateCurrentVals, 500);            
    }, 
    methods: {
        async updateCurrentVals() {
          try {
            var rawData = await APIService.getCurrent('electricity')
            this.result = rawData
            if (rawData[0].power.pv == null){
              this.errs.updateCurrentVals.msg = 'Der Sensor scheint aktuell keine Daten zu liefern.'
              this.errs.updateCurrentVals.show = true
            }
            else if ( !(typeof rawData[0].power.pv == 'number') || 
                    !(typeof rawData[0].power.grid == 'number')) {
              this.errs.updateCurrentVals.msg = 'Unerwarter Fehler beim Updaten der Momentanwerte.'
              this.errs.updateCurrentVals.show = true
            }
            else {
              this.current_power = rawData[0].power
              this.current_energy = rawData[0].energy
              this.last_update_time = moment(rawData[0].time).format('dddd HH:mm:ss')
              this.errs.updateCurrentVals.show = false

              if (this.start_energy.pv == '_ _') {
                  this.start_energy = rawData[0].energy
              }
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

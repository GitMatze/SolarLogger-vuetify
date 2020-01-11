<template>
<div id="app">
  <v-app id="inspire">
    <v-card
      class="mx-auto my-4"
      max-width="1000"
      min-width="800"
      
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
            <span class="headline">Photovoltaik:</span> 400 W
          </v-col>
          <v-col class="display-1" cols="6">
            <span class="headline">Netz:</span> 150 W
          </v-col>          
        </v-row>
      </v-card-text>  
    </v-card>
  </v-app>
</div>
</template>

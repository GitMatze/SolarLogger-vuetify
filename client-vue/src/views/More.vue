<template>
  <div class="home">
    <v-container>  

         <v-card
      class="mx-auto"
      max-width="400"
    >
      
        <v-card-title>Datenbank-Datei herunterladen</v-card-title>
  
       
      <v-card-text class="text--primary">
        <div>Der Download ist eine SQLite-Datei und kann beispielsweise 
            mit dem DB Browser for SQLite geöffnet werden. </div>
  
      </v-card-text>
  
      <v-card-actions>
        
        <v-btn
          color="orange"
          text
          href="http://localhost:5000/api/download" 
          target="_blank"
        >
          Download
        </v-btn>
      </v-card-actions>
    </v-card>

      
    </v-container>     
  </div>
</template>

<script>

  // import APIService from '@/components/APIService'
  

  export default {
    components: { 
    },
    data () {
      return {}     
    }  
  }
</script>

<template>
    <nav>
        <v-app-bar app 
        class="grey lighten-4"
         hide-on-scroll 
         elevation="1"> 
            <!-- <v-app-bar-nav-icon class="grey--text" @click="drawer = !drawer"></v-app-bar-nav-icon> -->
            <v-toolbar-title class="text-uppercase grey--text grey--lighten-1">
                <span class="font-weight-light">Solar</span>
                <span>Log</span>
            </v-toolbar-title>
            <v-spacer></v-spacer>
              <v-toolbar-items>
                <v-btn                  
                text
                background-color="transparent"
                color="grey darken-1" v-for="link in links"
                  :key="link.text"
                  router :to="link.route"
                  >
                  {{link.text}}
                </v-btn>
                <v-spacer></v-spacer>               
              </v-toolbar-items>
            <v-spacer></v-spacer>
        </v-app-bar>

        <!-- <v-navigation-drawer app v-model="drawer" class="grey lighten-4">
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title class="title">
              Solar Logger
            </v-list-item-title>         
          </v-list-item-content>
        </v-list-item>
  
        <v-divider></v-divider>
  
        <v-list
          dense
          nav
        >
          <v-list-item
            v-for="link in links"
            :key="link.text"
            router :to="link.route"
            link
          >    
  
            <v-list-item-content>
              <v-list-item-title>{{ link.text }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-navigation-drawer> -->
    </nav>

</template>


<script>

export default {
    data() {
        return {
            // drawer: false,
            links: [
                {text: 'Strom', route: '/'},
                {text: 'Statistiken', route: '/statistics'},
                {text: 'Heizung', route: '/heating'},
                {text: 'Weiteres', route: '/more'},                
            ]
        }
    }
    
}
</script>
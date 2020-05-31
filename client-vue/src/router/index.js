import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Statistics from '../views/Statistics.vue'
import More from '../views/More.vue'
import Heating from '../views/Heating.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home
  },
  {
    path: '/statistics',
    name: 'statistics',    
    component: Statistics 
  },
  {
    path: '/heating',
    name: 'heating',    
    component: Heating 
  },
  {
    path: '/more',
    name: 'more',    
    component: More 
  }
]

const router = new VueRouter({
  routes
})

export default router

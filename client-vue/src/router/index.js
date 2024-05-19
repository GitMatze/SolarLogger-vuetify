import Vue from 'vue'
import VueRouter from 'vue-router'
import Electricity from '../views/Electricity.vue'
import Statistics from '../views/Statistics.vue'
// import More from '../views/More.vue'
import Heating from '../views/Heating.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'electricity',
    component: Electricity
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
  // {
  //   path: '/more',
  //   name: 'more',    
  //   component: More 
  // }
]

const router = new VueRouter({
  routes
})

export default router

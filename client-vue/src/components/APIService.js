import axios from 'axios'


class APIService {
    
    static getMinMaxTime(type){        
        return new Promise(async (resolve, reject) => {
              try{
                const res = await axios.get( 'api/MinMaxTime/'.concat(type) )
                const data = res.data                 
                resolve(data)
            } catch(err) {
                reject(err)
            }
        })

    }
    // type can be either 'month' or 'day'
    static getEnergyOverview(type, period){
        
        return new Promise(async (resolve, reject) => {
              try{
                var url = 'api/energy/' + type + '_' + period
                /* eslint-disable no-console */
                console.log(url);
                /* eslint-enable no-console */
                const res = await axios.get( url )
                const data = res.data                 
                resolve(data)
            } catch(err) {
                reject(err)
            }
        })

    }

    static getPower(period) {
        // var periods = 'api/power/2020-01-14T14:23:30+01:00_2020-01-14T14:23:50+01:00'
        return new Promise(async (resolve, reject) => {           
            try{
                const res = await axios.get( 'api/power/'.concat(period) )
                const data = res.data
                resolve(data)
            } catch(err) {
                reject(err)
            }
        })
    }
    static getCurrentVals() {
        return new Promise(async (resolve, reject) => {
            try{
              const res = await axios.get( 'api/current' )
              const data = res.data                 
              resolve(data)
          } catch(err) {
              reject(err)
          }
      })        
    }
    static getCurrentWaterTemp() {
        return new Promise(async (resolve, reject) => {
            try{
              const res = await axios.get( 'api/current_water_temp' )
              const data = res.data                 
              resolve(data)
          } catch(err) {
              reject(err)
          }
      })        
    }  
    static getWaterTemp(period) {
        // var periods = 'api/power/2020-01-14T14:23:30+01:00_2020-01-14T14:23:50+01:00'
        return new Promise(async (resolve, reject) => {           
            try{
                const res = await axios.get( 'api/water_temp/'.concat(period) )
                const data = res.data
                resolve(data)
            } catch(err) {
                reject(err)
            }
        })
    }        
}

export default APIService
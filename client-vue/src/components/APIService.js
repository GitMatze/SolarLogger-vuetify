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

    static getCurrent(type) {
        return new Promise(async (resolve, reject) => {
            try{
              const res = await axios.get( `api/current/${type}` )
              const data = res.data                 
              resolve(data)
          } catch(err) {
              reject(err)
          }
      })        
    }    
    
    static getPeriod(period, type) {
        return new Promise(async (resolve, reject) => {           
            try{
                const res = await axios.get( `api/period/${period}/${type}` )
                const data = res.data
                resolve(data)
            } catch(err) {
                reject(err)
            }
        })

    }

    static post(type, json) {
        return new Promise(async (resolve, reject) => {           
            try{
                const res = await axios.post( `api/${type}`, json)
                resolve(res.status)
            } catch(err) {
                reject(err)
            }
        })

    }
}

export default APIService
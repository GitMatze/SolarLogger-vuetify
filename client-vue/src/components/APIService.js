import axios from 'axios'


class APIService {
    
    static getMinMaxTime(){
        return new Promise(async (resolve, reject) => {
              try{
                const res = await axios.get( 'api/MinMaxTime' )
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
}

export default APIService
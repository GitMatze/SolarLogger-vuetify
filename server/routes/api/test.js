const runPromise = function(num) {
    return new Promise((resolve, reject)=> {
        if (num>5) {
            resolve('Nummer größer fünf')
        }
        else {
            reject(new Error('kleiner als fünf'))
        }
    })
}

const handlePromise = function(){
    runPromise(3).then((result)=> {
        console.log('Result: ')
        console.log(result)
    }).catch((err)=> {
        console.log(err)
    })     
}

const handlePromise2 = async function() {
    try {
        result = await runPromise(7)
        console.log('result:')
        console.log(result)
    } catch (err) {
        console.log('Error detected')
        console.log(err)
    }

    
    
}
handlePromise2()

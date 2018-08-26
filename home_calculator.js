'use strict';
const inputData = {
  "devices": [
      {
          "id": "F972B82BA56A70CC579945773B6866FB",
          "name": "Посудомоечная машина",
          "power": 950,
          "duration": 3,
          "mode": "night"
      },
      {
          "id": "C515D887EDBBE669B2FDAC62F571E9E9",
          "name": "Духовка",
          "power": 2000,
          "duration": 2,
          "mode": "day"
      },
      {
          "id": "02DDD23A85DADDD71198305330CC386D",
          "name": "Холодильник",
          "power": 50,
          "duration": 24
      },
      {
          "id": "1E6276CC231716FE8EE8BC908486D41E",
          "name": "Термостат",
          "power": 50,
          "duration": 24
      },
      {
          "id": "7D9DC84AD110500D284B33C82FE6E85E",
          "name": "Кондиционер",
          "power": 850,
          "duration": 1
      }
  ],
  "rates": [
      {
          "from": 7,
          "to": 10,
          "value": 6.46
      },
      {
          "from": 10,
          "to": 17,
          "value": 5.38
      },
      {
          "from": 17,
          "to": 21,
          "value": 6.46
      },
      {
          "from": 21,
          "to": 23,
          "value": 5.38
      },
      {
          "from": 23,
          "to": 7,
          "value": 1.79
      }
  ],
  "maxPower": 2100
};

var devices = {};

devices.daylongs = inputData.devices.filter((item) => item.mode === undefined && item.duration === 24);
devices.nights = inputData.devices.filter((item) => item.mode === 'night');
devices.days = inputData.devices.filter((item) => item.mode === 'day');
devices.others = inputData.devices.filter((item) => item.mode === undefined && item.duration !== 24);

const result = {
    schedule: {},
    consumedEnergy: {
        value: 0,
        devices: {}
    }
}

// price = (duration * power * value) / 1000; 

function getTarifByHour(hour) {
    if (hour >= 0 && hour <= 7 || hour === 23) {
        return inputData.rates[4];
    }

    return inputData.rates.find((item) => {
        return hour >= item.from && hour < item.to
    });
} 

function getTarifsByMode (mode) {
    let rates = inputData.rates; 

    if (mode === 'day') {
        rates = rates.filter((item) => item.from >= 7 && item.from <= 17);
    }

    if (mode === 'night') {
        rates = rates.filter((item) => item.from >= 21 && item.from <= 23);
    }

    return rates.sort((a, b) => a.value - b.value);
}

function writeToResult(item, mode) {
    let price = 0;
    const tarifs = getTarifsByMode(mode);

    for (var i = 0; i < item.duration; i++) {
        let flag = true;
        let optimalTarifIndex = 0;
        
        while(flag) {
            const optimalTarif = tarifs[optimalTarifIndex];

            if (item.power + optimalTarif.usedPower <= inputData.maxPower) {
                optimalTarif.usedPower += item.power;
    
                result.schedule[optimalTarif.from].push(item.id);
                
                price += (optimalTarif.value * item.power) / 1000;
                
                flag = false;
            } else {
                optimalTarifIndex++;
            }

            if (optimalTarifIndex > tarifs.length - 1) {
                flag = false;
            }
        }
    }

    result.consumedEnergy.devices[item.id] = price;
}

devices.daylongs.forEach((item) => {
    let price = 0;

    for (let i = 0; i < 24; i++) {
        
        if(!result.schedule[String(i)]) {
            result.schedule[String(i)] = [];
        }

        result.schedule[String(i)].push(item.id);
        
        const tarif = getTarifByHour(i);
        
        tarif.usedPower = item.power;
        
        price += (tarif.value * item.power) / 1000;
    }
    result.consumedEnergy.devices[item.id] = price;
});

devices.others.forEach((item) => writeToResult(item));
devices.days.forEach((item) => writeToResult(item, 'day'));
devices.nights.forEach((item) => writeToResult(item, 'night'));

Object.keys(result.consumedEnergy.devices).forEach((key) => {
    result.consumedEnergy.value += result.consumedEnergy.devices[key];
});

console.log('result', result);
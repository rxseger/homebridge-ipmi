'use strict';

const IPMI = require('node-ipmi');

let Service, Characteristic;

module.exports = (homebridge) => {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory('homebridge-ipmi', 'IPMI', IPMIPlugin);
};

class IPMIPlugin
{
  constructor(log, config) {
    this.log = log;
    this.name = 'IPMI';

    // Server configuration - if omitted, use null to not specify (different from undefined/missing = prompt)
    this.hostname = config.hostname || null;
    this.username = config.username || null;
    this.password = config.password || null;

    // Sensors of interest, mapping IPMI name to Homebridge name
    this.temperatureSensors = config.temperatureSensors ||  {
                        'System Temp': 'System Temp',
                        'Peripheral Temp': 'Peripheral Temp'
                };
    this.fans = config.fans ||  {
                        'FAN 1': 'FAN 1',
                        'FAN 2': 'FAN 2',
                        'FAN 3': 'FAN 3',
                        'FAN 4': 'FAN 4',
                        'FAN A': 'FAN A'
                };

    this.sensors = [];
    Object.keys(this.temperatureSensors).forEach((ipmiName) => {
      const name = this.temperatureSensors[ipmiName];
      const subtype = ipmiName; // subtype must be unique per uuid
      const tempSensor = new Service.TemperatureSensor(name, subtype);
      tempSensor
        .getCharacteristic(Characteristic.CurrentTemperature)
        .on('get', this.getTemperature.bind(this, ipmiName));
      this.sensors.push(tempSensor);
    });

    Object.keys(this.fans).forEach((ipmiName) => {
      const name = this.fans[ipmiName];
      const subtype = ipmiName;
      const fan = new Service.Fan(name, subtype);
      fan
        .getCharacteristic(Characteristic.On)
        .on('get', this.getFanOn.bind(this, ipmiName));
      fan
        .getCharacteristic(Characteristic.RotationSpeed)
        .on('get', this.getFanRotationSpeed.bind(this, ipmiName));
      this.sensors.push(fan);
    });

    this.server = new IPMI(this.hostname, this.username, this.password);
  }

  _getSensorValue(ipmiName, cb) {
    console.log('_getSensorValue',ipmiName,cb);
    const u = Math.random();
    this.server.getSensors((err, sensors) => {
      console.log('SENSOR CALLBACK FOR ',u,err,sensors);
      if (err) return cb(err);

       for (let i = 0; i < sensors.length; ++i) {
         const sensor = sensors[i];
         const value = sensor.data.value;

         if (sensor.data.name === ipmiName) {
           console.log('CALLING',ipmiName,cb);
           return cb(null, sensor.data.value);
         }
       }
    });
  }

  getTemperature(ipmiName, cb) {
    console.log('getTemperature',ipmiName,cb);
    cb(null, 200);
    // degrees C
    //this._getSensorValue(ipmiName, cb)
  }

  getFanOn(ipmiName, cb) {
    cb(null, true);
/* TODO
    this._getSensorValue(ipmiName, (err, value) => {
      if (err) return cb(err);

      let on = value > 0;
      cb(null, on);
    });
*/
  }

  getFanRotationSpeed(ipmiName, cb) {
    if (cb.random) throw new Error(`already called ${cb.random}`);
    cb.random = Math.random();
    console.log('getFanRotationSpeed',ipmiName,cb.random);
    //cb(null, 6666);
    // RPM
    this._getSensorValue(ipmiName, cb);
  }

  getServices() {
    return this.sensors;
  }
}

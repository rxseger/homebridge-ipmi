'use strict';

const IPMI = require('node-ipmi');
const exec = require('child_process').exec; // TODO: move to node-ipmi

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
                        'System Temp': 'System',
                        'Peripheral Temp': 'Peripheral'
                };
    this.fans = config.fans ||  {
                        'FAN 1': 'Fan 1',
                        'FAN 2': 'Fan 2',
                        'FAN 3': 'Fan 3',
                        'FAN 4': 'Fan 4',
                        'FAN A': 'Fan A'
                };
    this.identify = config.identify !== undefined ? config.identify : "Blink";

    this.server = new IPMI(this.hostname, this.username, this.password);
    this.cache = {};
    this._refreshData();

    this.sensors = [];

    this.identifyOn = false; // TODO: get from ipmitool
    if (this.identify !== null) {
      const switchSensor = new Service.Switch(this.identify);
      switchSensor
        .getCharacteristic(Characteristic.On)
        .on('get', this.getIdentify.bind(this))
        .on('set', this.setIdentify.bind(this));
      this.sensors.push(switchSensor);	     
    }

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
  }

  getIdentify(cb) {
    cb(null, this.identifyOn);
  }

  setIdentify(on, cb) {
    let cmd;
    if (on) {
      // forces on until turned off (otherwise, turns off after an interval)
      cmd = 'ipmitool chassis identify force';
    } else {
      cmd = 'ipmitool chassis identify 0';
    }

    exec(cmd, () => cb(null)); // TODO: check error
  }

  _refreshData() {
    // TODO: throttle refreshes? currently schedules an update for each get (even if redundant)
    const refreshdata = true; // fix/workaround https://github.com/egeback/node-ipmi/pull/1 Fix callback reuse when not refreshing
    this.server.getSensors((err, sensors) => {
      if (err) throw err;

       for (let i = 0; i < sensors.length; ++i) {
         const sensor = sensors[i];

         this.cache[sensor.data.name] = sensor.data.value;
       }
       //console.log('updated cache=',this.cache);
    }, refreshdata);
  }

  getTemperature(ipmiName, cb) {
    // degrees C
    cb(null, this.cache[ipmiName]);
    this._refreshData();
  }

  getFanOn(ipmiName, cb) {
    const on = this.cache[ipmiName] > 0;
    cb(null, on);
    this._refreshData();
  }

  getFanRotationSpeed(ipmiName, cb) {
    // RPM
    cb(null, this.cache[ipmiName]);
    this._refreshData();
  }

  getServices() {
    return this.sensors;
    this._refreshData();
  }
}

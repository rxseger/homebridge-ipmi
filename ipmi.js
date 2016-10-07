'use strict';

const IPMI = require('node-ipmi');

// TODO: configurable
const hostname = null;
const username = null;
const password = null;

const temperatureSensors = ['System Temp', 'Peripheral Temp'];
const fans = ['FAN 1', 'FAN 2', 'FAN 3', 'FAN A'];

const server = new IPMI(hostname, username, password);
server.getSensors((err, sensors) => {
  if (err) throw err;

  for (let i = 0; i < sensors.length; ++i) {
    const sensor = sensors[i];

    if (temperatureSensors.indexOf(sensor.data.name) !== -1) {
      console.log('Found temp sensor:', sensor.data.name, sensor.data.value);
    } else if (fans.indexOf(sensor.data.name) !== -1) {
      console.log('Found fan:', sensor.data.name, sensor.data.value);
    }
  }
});

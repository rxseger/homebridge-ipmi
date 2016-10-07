'use strict';

const IPMI = require('node-ipmi');

const hostname = null;
const username = null;
const password = null;

const server = new IPMI(hostname, username, password);
server.getSensors((err, sensors) => {
	console.log(err, sensors);
});

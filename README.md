# homebridge-ipmi

[IPMI](https://en.wikipedia.org/wiki/Intelligent_Platform_Management_Interface) plugin for [Homebridge](https://github.com/nfarina/homebridge)

Uses [node-ipmi](https://www.npmjs.com/package/node-ipmi), an [ipmitool](https://linux.die.net/man/1/ipmitool) wrapper, to
monitor server temperature and fan sensors via IPMI.

## Installation

1.	Install Homebridge using `npm install -g homebridge`
2.	Install this plugin `npm install -g homebridge-ipmi`
3.	Update your configuration file - see below for an example

## Configuration

* `accessory`: "IPMI"
* `name`: descriptive name
* `hostname`: server hostname, or null for local
* `username`: server username, or null for local
* `password`: server password, or null for local
* `temperatureSensors`, `fans`: an object mapping IPMI sensor names, to Homebridge display names

Run `ipmitool sensor` to show the available sensors.

Example configuration:

```json
    "accessories": [
        {
                "accessory": "IPMI",
                "name": "IPMI",
                "hostname": null,
                "username": null,
                "password": null,
                "temperatureSensors": {
                        "System Temp": "System",
                        "Peripheral Temp": "Peripheral"
                },
                "fans": {
                        "FAN 1": "Fan 1",
                        "FAN 2": "Fan 2",
                        "FAN 3": "Fan 3",
                        "FAN 4": "Fan 4",
                        "FAN A": "Fan A"
                }
        }
    ]
```

This plugin creates a TemperatureSensor or Fan service for each sensor specified.
Voltage monitoring, chassis intrusion detection sensors, and other functionality is not currently supported.

## License

MIT


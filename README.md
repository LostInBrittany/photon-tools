# photon-tools

A set of utilities used by photon-elements

## Install

[Node.js](http://nodejs.org) users can install from the [npm](https://www.npmjs.com/package/@photon-elements/photon-tools) registry using

    $ npm install --save @photon-elements/photon-tools


## Use    

All the tools are exposed as ES6 modules.

The tools currently available in this package are:

### photon-looseJSON

A JSON parser and serializer, based on standard JavaScript `JSON.parse()` and `JSON.stringify()`
but adding support for the much needed null, NaN and infinities, and big integers using 
[big.js](https://github.com/MikeMcl/big.js/).

It exports a `looseJSON` object with two methods, `looseJSON.parse()` and `looseJSON.stringify()`.


### photon-timeseries-tools

A set of tools to deal with time-series:

- `isArray()`
- `isTimeseries()`
- `jsonToStack()`
- `serializeTimeseriesMetadata()`
- `sameMetadata()`
- `isPlottable()`
- `isAnnotable()`
- `sort()`
- `timeRange()`
- `timeseriesToC3()`

### photon-timeseries-to-c3-worker

A [web worker] to parse Warp 10 JSON response and translate it to C3 data format


### photon-ts-plotting-tools

An utility class helping to deal with time-series plotting


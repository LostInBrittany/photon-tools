import looseJSON from './photon-looseJSON';


let _timeseriesTools = {};

/**
 * Returns true if @value is an Array
 * @param {{unknown}} value
 * @return {{Bolean}}
 */
_timeseriesTools.isArray = (value) => {
  return value && typeof value === 'object' && value instanceof Array && typeof value.length === 'number'
    && typeof value.splice === 'function' && !(value.propertyIsEnumerable('length'));
}


/**
 * Returns true if @timeseries is a valid Warp 10 timeseries
 *
 * @param {{timeseries}} timeseries
 * @return {{Boolean}}
 */
_timeseriesTools.isTimeseries = (timeseries) => {
  return !(!timeseries || timeseries === null || timeseries.c === null || timeseries.l === null ||
    timeseries.a === null || timeseries.v === null || !_timeseriesTools.isArray(timeseries.v));
};

/**
 * Generates a stack from the received JSON
 *
 * @param {{Array}} jsonList
 * @param {{Sting}} prefixId
 * @return {{Array}}
 */
_timeseriesTools.jsonToStack = (jsonList, prefixId) => {

  let stack = [];

  jsonList.forEach((item, index) => {
    if ((prefixId !== undefined) && (prefixId !== '')) {
      id = `${prefixId}-${index}`;
    } else {
      id = `${index}`;
    }

    if (_timeseriesTools.isArray(item)) {
      stack.push(... _timeseriesTools.jsonToStack(item, id));
    }
    if (_timeseriesTools.isTimeseries(item)) {
      item.id = id;
      stack.push(item);
    }
  });

  return stack;
}


/**
 * Generated a serialized version of a Warp 10 timeseries metadata
 *
 * @param {{timeseries}} timeseries The timeseries
 * @return {{String}}
 */
_timeseriesTools.serializeTimeseriesMetadata = (timeseries) => {
  let serializedLabels = [];

  Object.keys(timeseries.l).forEach((key) => {
    serializedLabels.push(key + '=' + timeseries.l[key]);
  });
  return `${timeseries.c}{${serializedLabels.join(',')}}`;
}


/**
 * Returns true if the two timeseries have the same metadata
 *
 * @param {{timeseries}} a
 * @param {{timeseries}} b
 * @return {{Boolean}}
 */
_timeseriesTools.sameMetadata = (a, b) => {
  if (a.c === undefined || b.c === undefined || a.l === undefined || b.l === undefined ||
    !(a.l instanceof Object) || !(b.l instanceof Object)) {
    console.error('[photon-timeseries-tools] sameMetadata - Error in timeseries, metadata is not well formed');
    return false;
  }
  if (a.c !== b.c) {
    return false;
  }
  for (let p in a.l) {
    if (!b.l.hasOwnProperty(p)) return false;
    if (a.l[p] !== b.l[p]) return false;
  }
  for (let p in b.l) {
    if (!a.l.hasOwnProperty(p)) return false;
  }
  return true;
}

/**
 * Returns true if @timeseries is a valid timeseries to plot
 *
 * @param {{timeseries}} timeseries
 * @return {{Boolean}}
 */
_timeseriesTools.isPlottable = (timeseries) => {
  if (!_timeseriesTools.isTimeseries(timeseries) || timeseries.v.length === 0) {
    return false;
  }
  // We look at the first non-null value, if it's a String or Boolean it's an timeseries of annotations,
  // if it's a number it's a timeseries to plot
  for (let i in timeseries.v) {
    if (timeseries.v[i][timeseries.v[i].length - 1] !== null) {
      if (typeof (timeseries.v[i][timeseries.v[i].length - 1]) === 'number' ||
        // if it's an instance of Big.js we get a `toFixed()` function in the prototype
        timeseries.v[i][timeseries.v[i].length - 1].constructor.prototype.toFixed !== undefined) {
        return true;
      }
      break;
    }
  }
  return false;
}

/**
 * Returns true if @timeseries is a valid timeseries to annotate
 *
 * @param {{timeseries}} timeseries
 * @return {{Boolean}}
 */
_timeseriesTools.isAnnotable = (timeseries) => {
  if (!_timeseriesTools.isTimeseries(timeseries) || timeseries.v.length === 0) {
    return false;
  }
  // We look at the first non-null value, if it's a String or Boolean it's an timeseries of annotations,
  // if it's a number it's a timeseries to plot
  for (let i in timeseries.v) {
    if (timeseries.v[i][timeseries.v[i].length - 1] !== null) {
      if (typeof (timeseries.v[i][timeseries.v[i].length - 1]) !== 'number' &&
        // if it's an instance of Big.js we get a `toFixed()` function in the prototype
        timeseries.v[i][timeseries.v[i].length - 1].constructor.prototype.toFixed === undefined) {
        return true;
      }
      break;
    }
  }
  return false;
}

/**
 * Sorts the timeseries
 *
 * @param {{timeseries}} timeseries
 */
_timeseriesTools.sort = (timeseries) => {
  if (timeseries.isSorted) {
    return;
  }
  timeseries.v = timeseries.v.sort(function (a, b) {
    return a[0] - b[0];
  });
  timeseries.isSorted = true;
}

/**
  * Gives the time range of the tiemseries.
  * If the timeseries isn't sorted, it sorts it
  *
  * @param {{timeseries}} timeseries
  * @return {{Array}}
  */
_timeseriesTools.timeRange = (timeseries) => {
  _timeseriesTools.sort(timeseries);
  if (timeseries.v.length === 0) {
    return null;
  }
  return [timeseries.v[0][0], timeseries.v[gts.v.length - 1][0]];
}

/**
  * Exports timeseries to C3 format
  * @param  {{Array}}  stack The stack, with optional metadata for `interpolate`, `name` and `color`
  * @param {{ interpolate: Array, labels: Array, colors: Array }} options
  * @return {{xs: {}, types: {}, names: {}, colors: {}, columns: Array}}
  * @private
  */
 _timeseriesTools.timeseriesToC3 = (stack, options, inTimestamp=false) => {
  let data = {
    xs: {},
    types: {},
    names: {},
    colors: {},
    columns: [],
  };
  stack.forEach((item, i) => {
    let x = ['X' + i];
    let y = ['Y' + i];
    item.v.forEach((val, j) => {
      let ts = val[0];
      if (!inTimestamp) {
        ts = Math.round(ts / 1000);
      }
      let value = val[val.length - 1];
      x.push(ts);
      y.push(value);
    });
    data.xs['Y' + i] = 'X' + i;

    if (item.interpolate) {
      data.types['Y' + i] = item.interpolate;
    }

    if (item.name) {
      data.names['Y' + i] = item.name;
    }  else {
      data.names['Y' + i] = _timeseriesTools.serializeTimeseriesMetadata(item);
    }

    if (item.color) {
      data.colors['Y' + i] = item.color;
    }

    data.columns.push(x);
    data.columns.push(y);
  });
  return data;
}

export const timeseriesTools = _timeseriesTools;
export default timeseriesTools;


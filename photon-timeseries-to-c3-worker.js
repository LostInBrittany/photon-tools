/**
 * Web Worker to parse Warp 10 responses and addapt them to C3.js format
 */
import looseJSON from './photon-looseJSON';
import timeseriesTools from './photon-timeseries-tools';

onmessage = (message) => {
  if (!message.data || !message.data || !message.data.stack) {
    console.error('[Worker: timeseries-to-c3] No Warp 10 stack found in message', message);
    return;
  }

  let json;

  try {
    json = looseJSON.parse(message.data.stack);
  } catch (e) {
    console.error('[Worker: timeseries-to-c3]  Warp 10 stack  non JSON compliant', message.data.stack);
    return;
  }
  console.log('[Worker: timerseries-to-c3] json', json);

  let stack = timeseriesTools.jsonToStack(json);
  console.log('[Worker: timerseries-to-c3] stack', stack);

  let c3Data = timeseriesTools.timeseriesToC3(stack);

  console.log('[Worker: timerseries-to-c3] c3Data', c3Data);
  postMessage({ c3: c3Data, __meta: message.data.__meta });
}
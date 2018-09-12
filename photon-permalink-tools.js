let fields = [
  'url',
  'execEndpoint',
  'findEndpoint',
  'fetchEndpoint',
  'updateEndpoint',
  'deleteEndpoint',
  'headerName',
];

let defaultBackend = {
  'id': 'default',
  'label': 'Default backend',
  'url': 'http://127.0.0.1:8080/api/v0',
  'execEndpoint': '/exec',
  'findEndpoint': '/find',
  'updateEndpoint': '/update',
  'deleteEndpoint': '/delete',
  'headerName': 'X-Warp10-Token',
}

let _photonPermalinkTools = {};

_photonPermalinkTools.encode = (payload, debug = false) => {
  let encoded = encodeURIComponent(
    btoa(
      unescape(
        encodeURIComponent(payload)
      )
    )
    .replace(/\//g, '_'));
  if (debug) {
    console.debug('[photonPermalinkTools] encodeWarpscript', { payload, encoded });
  }
  return encoded;
}

_photonPermalinkTools.encodeBackend = (backend, debug=false) => {
  if (!backend) {
    return;
  }
  let backendToEncode = {};

  fields.forEach((field) => {
    if (backend[field] !== defaultBackend[field]) {
      backendToEncode[field] = backend[field];
    }
  });
  if (debug) {
    console.debug('[photonPermalinkTools] encodeBackend- backendToEncode', backendToEncode);
  }
  return _photonPermalinkTools.encode(JSON.stringify(backendToEncode), debug);
} 

_photonPermalinkTools.decode = (permalink, debug = false) => {
  try {
    let decoded = decodeURIComponent(
      escape(
        atob(
          decodeURIComponent(permalink).replace(/_/g, '/')
        )
      )
    );
    if (debug) {
      console.debug('[photonPermalinkTools] decode', {permalink, decoded});
    }
    return decoded;
  } catch (err) {
    console.error('[photonPermalinkTools] decode - error decoding permalink', permalink, err);
    return false;
  }
}

_photonPermalinkTools.decodeBackend = (permalink, debug = false) => {
  let decoded = _photonPermalinkTools.decode(permalink, debug);
  if (!decoded) {
    return false;
  }
  let backend;
  try {
    backend = JSON.parse(decoded);
  } catch (e) {
    backend = {
      url: decoded,
    };
  }
  fields.forEach( (field) => {
    if (!backend[field]) {
      backend[field] = defaultBackend[field];
    }
  });
  if (debug) {
    console.debug('[photonPermalinkTools] decodeBackend - decode :', { permalink, backend });
  }
  return backend;
}

_photonPermalinkTools.generatePermalink = (warpscript, backend, debug=false) => {
  let encodedWarpscript = _photonPermalinkTools.encode(warpscript, debug);
  let encodedBackend = _photonPermalinkTools.encodeBackend(backend, debug);
  if (debug) {
    console.debug('[photonPermalinkTools] generatePermalink', `/${encodedWarpscript}/${encodedBackend}`);
  }
  return `/${encodedWarpscript}/${encodedBackend}`;
}

_photonPermalinkTools.decodePermalink = (permalink, debug=false) => {
  let permalinkFragments = permalink.split('/');
  // permalink should be #/page/encodedWarpscript/encodedBackend

  let warpscript = (permalinkFragments.length > 2 && permalinkFragments[2]) 
      ? _photonPermalinkTools.decode(permalinkFragments[2])
      : null;
  let backend = (permalinkFragments.length > 3 && permalinkFragments[3]) 
      ?_photonPermalinkTools.decodeBackend(permalinkFragments[3]) 
      : null;

  if (debug) {
    console.debug('[photonPermalinkTools] decodePermalink', { warpscript, backend });
  }
  return { warpscript, backend };
}

_photonPermalinkTools.cropPermalink = (permalink, maxDisplayLength,  debug=false) => {
  if (debug) {
    console.debug('[photonPermalinkTools cropPermalink', maxDisplayLength);
  }
  if (permalink.length > maxDisplayLength) {
    return permalink.slice(0, maxDisplayLength) + '...';
  }
  return permalink;
}

export const photonPermalinkTools = _photonPermalinkTools;
export default photonPermalinkTools;

import Big from './lib/big.esm.js';

let _looseJSON = {};

// LooseJSON.parse adapted from Canop's JSON,parseMore https://github.com/Canop/JSON.parseMore/
let at; // The index of the current character
let ch; // The current character
let escapee = {
  '"': '"',
  '\\': '\\',
  '/': '/',
  'b': '\b',
  'f': '\f',
  'n': '\n',
  'r': '\r',
  't': '\t',
};
let text;
let error = function(m) {
  throw new Error(`Syntax error - ${m} at char ${at} from '${text}'`);
};
let next = function(c) {
  return ch = text.charAt(at++);
};
let check = function(c) {
  if (c !== ch) {
    error('Expected \'' + c + '\' instead of \'' + ch + '\'');
  }
  ch = text.charAt(at++);
};
let number = function() {
  let string = '';
  if (ch === '-') {
    string = '-';
    check('-');
  }
  if (ch === 'I') {
    check('I');
    check('n');
    check('f');
    check('i');
    check('n');
    check('i');
    check('t');
    check('y');
    return -Infinity;
  }
  while (ch >= '0' && ch <= '9') {
    string += ch;
    next();
  }
  if (ch === '.') {
    string += '.';
    while (next() && ch >= '0' && ch <= '9') {
      string += ch;
    }
  }
  if (ch === 'e' || ch === 'E') {
    string += ch;
    next();
    if (ch === '-' || ch === '+') {
      string += ch;
      next();
    }
    while (ch >= '0' && ch <= '9') {
      string += ch;
      next();
    }
  }
  if ( +string > Number.MAX_SAFE_INTEGER) {
  /* eslint new-cap: "off" */
  console.log('[looseJSON] BigNumber', Big(string) );
    return Big(string);
  }
  return +string;
};
let string = function() {
  let hex;
  let i;
  let string = '';
  let uffff;
  if (ch === '"') {
    while (next()) {
      if (ch === '"') {
        next();
        return string;
      }
      if (ch === '\\') {
        next();
        if (ch === 'u') {
          uffff = 0;
          for (i = 0; i < 4; i ++) {
            hex = parseInt(next(), 16);
            if (!isFinite(hex)) {
              break;
            }
            uffff = uffff * 16 + hex;
          }
          string += String.fromCharCode(uffff);
        } else if (escapee[ch]) {
          string += escapee[ch];
        } else {
          break;
        }
      } else {
        string += ch;
      }
    }
  }
  error('Bad string');
};
let white = function() { // Skip whitespace.
  while (ch && ch <= ' ') {
    next();
  }
};
let word = function() {
  switch (ch) {
    case 't':
    check('t');
    check('r');
    check('u');
    check('e');
    return true;
    case 'f':
    check('f');
    check('a');
    check('l');
    check('s');
    check('e');
    return false;
    case 'n':
    check('n');
    check('u');
    check('l');
    check('l');
    return null;
    case 'N':
    check('N');
    check('a');
    check('N');
    return NaN;
    case 'I':
    check('I');
    check('n');
    check('f');
    check('i');
    check('n');
    check('i');
    check('t');
    check('y');
    return Infinity;
  } 
  error('Unexpected \'' + ch + '\'');
};
let array = function() {
  let array = [];
  if (ch === '[') {
    check('[');
    white();
    if (ch === ']') {
      check(']');
      return array; // empty array
    }
    while (ch) {
      array.push(value());
      white();
      if (ch === ']') {
        check(']');
        return array;
      }
      check(',');
      white();
    }
  }
  error('Bad array');
};
let object = function() {
  let key;
  let object = {};
  if (ch === '{') {
    check('{');
    white();
    if (ch === '}') {
      check('}');
      return object; // empty object
    }
    while (ch) {
      key = string();
      white();
      check(':');
      if (Object.hasOwnProperty.call(object, key)) {
        error('Duplicate key "' + key + '"');
      }
      object[key] = value();
      white();
      if (ch === '}') {
        check('}');
        return object;
      }
      check(',');
      white();
    }
  }
  error('Bad object');
};
let value = function() {
  white();
  switch (ch) {
    case '{':
    return object();
    case '[':
    return array();
    case '"':
    return string();
    case '-':
    return number();
    default:
    return ch >= '0' && ch <= '9' ? number() : word();
  }
};

_looseJSON.parse = function(source, reviver) {
  let result;
  text = source;
  at = 0;
  ch = ' ';
  result = value();
  white();
  if (ch) {
    error('Syntax error');
  }
  return typeof reviver === 'function'
  ? (function walk(holder, key) {
    let k;
    let v;
    let value = holder[key];
    if (value && typeof value === 'object') {
      for (k in value) {
        if (Object.prototype.hasOwnProperty.call(value, k)) {
          v = walk(value, k);
          if (v !== undefined) {
            value[k] = v;
          } else {
            delete value[k];
          }
        }
      }
    }
    return reviver.call(holder, key, value);
  }({'': result}, ''))
  : result;
};


_looseJSON.stringify = function(object) {
  console.debug('[looseJSON] stringify', object);

  let json = JSON.stringify(object, function(key, value) {
    if (value !== value) {
      return '__NaN__';
    }

    if (value === 1/0) {
      return '__Infinity__';
    }

    if (value === -1/0) {
      return '__-Infinity__';
    }

    // The replacer's `value` param is already an String for a BigInt
    // so we need to use `this[key]` to get the object BigInt
    if (this[key] instanceof Big ) {
      let bigIntValue = this[key].toString();
      console.debug('[looseJSON] stringify - BigInt - ', bigIntValue);
      return '__BigInt__'+bigIntValue+'__';
    }

    return value;
  })
  .replace(/"__BigInt__([0-9.-eE]*)__"/g, '$1')
  .replace(/"__NaN__"/g, 'NaN')
  .replace(/"__Infinity__"/g, 'Infinity')
  .replace(/"__-Infinity__"/g, '-Infinity');

  return json;
};

export const looseJSON = _looseJSON;
export default looseJSON;
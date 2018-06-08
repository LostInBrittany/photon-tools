/*
 *  big.js v5.1.2
 *  A small, fast, easy-to-use library for arbitrary-precision decimal arithmetic.
 *  Copyright (c) 2017 Michael Mclaughlin <M8ch88l@gmail.com>
 *  https://github.com/MikeMcl/big.js/LICENCE
 */


/************************************** EDITABLE DEFAULTS *****************************************/


  // The default values below must be integers within the stated ranges.

  /*
   * The maximum number of decimal places (DP) of the results of operations involving division:
   * div and sqrt, and pow with negative exponents.
   */
var DP = 20,          // 0 to MAX_DP

  /*
   * The rounding mode (RM) used when rounding to the above decimal places.
   *
   *  0  Towards zero (i.e. truncate, no rounding).       (ROUND_DOWN)
   *  1  To nearest neighbour. If equidistant, round up.  (ROUND_HALF_UP)
   *  2  To nearest neighbour. If equidistant, to even.   (ROUND_HALF_EVEN)
   *  3  Away from zero.                                  (ROUND_UP)
   */
  RM = 1,             // 0, 1, 2 or 3

  // The maximum value of DP and Big.DP.
  MAX_DP = 1E6,       // 0 to 1000000

  // The maximum magnitude of the exponent argument to the pow method.
  MAX_POWER = 1E6,    // 1 to 1000000

  /*
   * The negative exponent (NE) at and beneath which toString returns exponential notation.
   * (JavaScript numbers: -7)
   * -1000000 is the minimum recommended exponent value of a Big.
   */
  NE = -7,            // 0 to -1000000

  /*
   * The positive exponent (PE) at and above which toString returns exponential notation.
   * (JavaScript numbers: 21)
   * 1000000 is the maximum recommended exponent value of a Big.
   * (This limit is not enforced or checked.)
   */
  PE = 21,            // 0 to 1000000


/**************************************************************************************************/


  // Error messages.
  NAME = '[big.js] ',
  INVALID = NAME + 'Invalid ',
  INVALID_DP = INVALID + 'decimal places',
  INVALID_RM = INVALID + 'rounding mode',
  DIV_BY_ZERO = NAME + 'Division by zero',

  // The shared prototype object.
  P = {},
  UNDEFINED = void 0,
  NUMERIC = /^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;


/*
 * Create and return a Big constructor.
 *
 */
function _Big_() {

  /*
   * The Big constructor and exported function.
   * Create and return a new instance of a Big number object.
   *
   * n {number|string|Big} A numeric value.
   */
  function Big(n) {
    var x = this;

    // Enable constructor usage without new.
    if (!(x instanceof Big)) return n === UNDEFINED ? _Big_() : new Big(n);

    // Duplicate.
    if (n instanceof Big) {
      x.s = n.s;
      x.e = n.e;
      x.c = n.c.slice();
    } else {
      parse(x, n);
    }

    /*
     * Retain a reference to this Big constructor, and shadow Big.prototype.constructor which
     * points to Object.
     */
    x.constructor = Big;
  }

  Big.prototype = P;
  Big.DP = DP;
  Big.RM = RM;
  Big.NE = NE;
  Big.PE = PE;
  Big.version = '5.0.2';

  return Big;
}


/*
 * Parse the number or string value passed to a Big constructor.
 *
 * x {Big} A Big number instance.
 * n {number|string} A numeric value.
 */
function parse(x, n) {
  var e, i, nl;

  // Minus zero?
  if (n === 0 && 1 / n < 0) n = '-0';
  else if (!NUMERIC.test(n += '')) throw Error(INVALID + 'number');

  // Determine sign.
  x.s = n.charAt(0) == '-' ? (n = n.slice(1), -1) : 1;

  // Decimal point?
  if ((e = n.indexOf('.')) > -1) n = n.replace('.', '');

  // Exponential form?
  if ((i = n.search(/e/i)) > 0) {

    // Determine exponent.
    if (e < 0) e = i;
    e += +n.slice(i + 1);
    n = n.substring(0, i);
  } else if (e < 0) {

    // Integer.
    e = n.length;
  }

  nl = n.length;

  // Determine leading zeros.
  for (i = 0; i < nl && n.charAt(i) == '0';) ++i;

  if (i == nl) {

    // Zero.
    x.c = [x.e = 0];
  } else {

    // Determine trailing zeros.
    for (; nl > 0 && n.charAt(--nl) == '0';);
    x.e = e - i - 1;
    x.c = [];

    // Convert string to array of digits without leading/trailing zeros.
    for (e = 0; i <= nl;) x.c[e++] = +n.charAt(i++);
  }

  return x;
}


/*
 * Round Big x to a maximum of dp decimal places using rounding mode rm.
 * Called by stringify, P.div, P.round and P.sqrt.
 *
 * x {Big} The Big to round.
 * dp {number} Integer, 0 to MAX_DP inclusive.
 * rm {number} 0, 1, 2 or 3 (DOWN, HALF_UP, HALF_EVEN, UP)
 * [more] {boolean} Whether the result of division was truncated.
 */
function round(x, dp, rm, more) {
  var xc = x.c,
    i = x.e + dp + 1;

  if (i < xc.length) {
    if (rm === 1) {

      // xc[i] is the digit after the digit that may be rounded up.
      more = xc[i] >= 5;
    } else if (rm === 2) {
      more = xc[i] > 5 || xc[i] == 5 &&
        (more || i < 0 || xc[i + 1] !== UNDEFINED || xc[i - 1] & 1);
    } else if (rm === 3) {
      more = more || xc[i] !== UNDEFINED || i < 0;
    } else {
      more = false;
      if (rm !== 0) throw Error(INVALID_RM);
    }

    if (i < 1) {
      xc.length = 1;

      if (more) {

        // 1, 0.1, 0.01, 0.001, 0.0001 etc.
        x.e = -dp;
        xc[0] = 1;
      } else {

        // Zero.
        xc[0] = x.e = 0;
      }
    } else {

      // Remove any digits after the required decimal places.
      xc.length = i--;

      // Round up?
      if (more) {

        // Rounding up may mean the previous digit has to be rounded up.
        for (; ++xc[i] > 9;) {
          xc[i] = 0;
          if (!i--) {
            ++x.e;
            xc.unshift(1);
          }
        }
      }

      // Remove trailing zeros.
      for (i = xc.length; !xc[--i];) xc.pop();
    }
  } else if (rm < 0 || rm > 3 || rm !== ~~rm) {
    throw Error(INVALID_RM);
  }

  return x;
}


/*
 * Return a string representing the value of Big x in normal or exponential notation.
 * Handles P.toExponential, P.toFixed, P.toJSON, P.toPrecision, P.toString and P.valueOf.
 *
 * x {Big}
 * id? {number} Caller id.
 *         1 toExponential
 *         2 toFixed
 *         3 toPrecision
 *         4 valueOf
 * n? {number|undefined} Caller's argument.
 * k? {number|undefined}
 */
function stringify(x, id, n, k) {
  var e, s,
    Big = x.constructor,
    z = !x.c[0];

  if (n !== UNDEFINED) {
    if (n !== ~~n || n < (id == 3) || n > MAX_DP) {
      throw Error(id == 3 ? INVALID + 'precision' : INVALID_DP);
    }

    x = new Big(x);

    // The index of the digit that may be rounded up.
    n = k - x.e;

    // Round?
    if (x.c.length > ++k) round(x, n, Big.RM);

    // toFixed: recalculate k as x.e may have changed if value rounded up.
    if (id == 2) k = x.e + n + 1;

    // Append zeros?
    for (; x.c.length < k;) x.c.push(0);
  }

  e = x.e;
  s = x.c.join('');
  n = s.length;

  // Exponential notation?
  if (id != 2 && (id == 1 || id == 3 && k <= e || e <= Big.NE || e >= Big.PE)) {
    s = s.charAt(0) + (n > 1 ? '.' + s.slice(1) : '') + (e < 0 ? 'e' : 'e+') + e;

  // Normal notation.
  } else if (e < 0) {
    for (; ++e;) s = '0' + s;
    s = '0.' + s;
  } else if (e > 0) {
    if (++e > n) for (e -= n; e--;) s += '0';
    else if (e < n) s = s.slice(0, e) + '.' + s.slice(e);
  } else if (n > 1) {
    s = s.charAt(0) + '.' + s.slice(1);
  }

  return x.s < 0 && (!z || id == 4) ? '-' + s : s;
}


// Prototype/instance methods


/*
 * Return a new Big whose value is the absolute value of this Big.
 */
P.abs = function () {
  var x = new this.constructor(this);
  x.s = 1;
  return x;
};


/*
 * Return 1 if the value of this Big is greater than the value of Big y,
 *       -1 if the value of this Big is less than the value of Big y, or
 *        0 if they have the same value.
*/
P.cmp = function (y) {
  var isneg,
    x = this,
    xc = x.c,
    yc = (y = new x.constructor(y)).c,
    i = x.s,
    j = y.s,
    k = x.e,
    l = y.e;

  // Either zero?
  if (!xc[0] || !yc[0]) return !xc[0] ? !yc[0] ? 0 : -j : i;

  // Signs differ?
  if (i != j) return i;

  isneg = i < 0;

  // Compare exponents.
  if (k != l) return k > l ^ isneg ? 1 : -1;

  j = (k = xc.length) < (l = yc.length) ? k : l;

  // Compare digit by digit.
  for (i = -1; ++i < j;) {
    if (xc[i] != yc[i]) return xc[i] > yc[i] ^ isneg ? 1 : -1;
  }

  // Compare lengths.
  return k == l ? 0 : k > l ^ isneg ? 1 : -1;
};


/*
 * Return a new Big whose value is the value of this Big divided by the value of Big y, rounded,
 * if necessary, to a maximum of Big.DP decimal places using rounding mode Big.RM.
 */
P.div = function (y) {
  var x = this,
    Big = x.constructor,
    a = x.c,                  // dividend
    b = (y = new Big(y)).c,   // divisor
    k = x.s == y.s ? 1 : -1,
    dp = Big.DP;

  if (dp !== ~~dp || dp < 0 || dp > MAX_DP) throw Error(INVALID_DP);

  // Divisor is zero?
  if (!b[0]) throw Error(DIV_BY_ZERO);

  // Dividend is 0? Return +-0.
  if (!a[0]) return new Big(k * 0);

  var bl, bt, n, cmp, ri,
    bz = b.slice(),
    ai = bl = b.length,
    al = a.length,
    r = a.slice(0, bl),   // remainder
    rl = r.length,
    q = y,                // quotient
    qc = q.c = [],
    qi = 0,
    d = dp + (q.e = x.e - y.e) + 1;    // number of digits of the result

  q.s = k;
  k = d < 0 ? 0 : d;

  // Create version of divisor with leading zero.
  bz.unshift(0);

  // Add zeros to make remainder as long as divisor.
  for (; rl++ < bl;) r.push(0);

  do {

    // n is how many times the divisor goes into current remainder.
    for (n = 0; n < 10; n++) {

      // Compare divisor and remainder.
      if (bl != (rl = r.length)) {
        cmp = bl > rl ? 1 : -1;
      } else {
        for (ri = -1, cmp = 0; ++ri < bl;) {
          if (b[ri] != r[ri]) {
            cmp = b[ri] > r[ri] ? 1 : -1;
            break;
          }
        }
      }

      // If divisor < remainder, subtract divisor from remainder.
      if (cmp < 0) {

        // Remainder can't be more than 1 digit longer than divisor.
        // Equalise lengths using divisor with extra leading zero?
        for (bt = rl == bl ? b : bz; rl;) {
          if (r[--rl] < bt[rl]) {
            ri = rl;
            for (; ri && !r[--ri];) r[ri] = 9;
            --r[ri];
            r[rl] += 10;
          }
          r[rl] -= bt[rl];
        }

        for (; !r[0];) r.shift();
      } else {
        break;
      }
    }

    // Add the digit n to the result array.
    qc[qi++] = cmp ? n : ++n;

    // Update the remainder.
    if (r[0] && cmp) r[rl] = a[ai] || 0;
    else r = [a[ai]];

  } while ((ai++ < al || r[0] !== UNDEFINED) && k--);

  // Leading zero? Do not remove if result is simply zero (qi == 1).
  if (!qc[0] && qi != 1) {

    // There can't be more than one zero.
    qc.shift();
    q.e--;
  }

  // Round?
  if (qi > d) round(q, dp, Big.RM, r[0] !== UNDEFINED);

  return q;
};


/*
 * Return true if the value of this Big is equal to the value of Big y, otherwise return false.
 */
P.eq = function (y) {
  return !this.cmp(y);
};


/*
 * Return true if the value of this Big is greater than the value of Big y, otherwise return
 * false.
 */
P.gt = function (y) {
  return this.cmp(y) > 0;
};


/*
 * Return true if the value of this Big is greater than or equal to the value of Big y, otherwise
 * return false.
 */
P.gte = function (y) {
  return this.cmp(y) > -1;
};


/*
 * Return true if the value of this Big is less than the value of Big y, otherwise return false.
 */
P.lt = function (y) {
  return this.cmp(y) < 0;
};


/*
 * Return true if the value of this Big is less than or equal to the value of Big y, otherwise
 * return false.
 */
P.lte = function (y) {
  return this.cmp(y) < 1;
};


/*
 * Return a new Big whose value is the value of this Big minus the value of Big y.
 */
P.minus = P.sub = function (y) {
  var i, j, t, xlty,
    x = this,
    Big = x.constructor,
    a = x.s,
    b = (y = new Big(y)).s;

  // Signs differ?
  if (a != b) {
    y.s = -b;
    return x.plus(y);
  }

  var xc = x.c.slice(),
    xe = x.e,
    yc = y.c,
    ye = y.e;

  // Either zero?
  if (!xc[0] || !yc[0]) {

    // y is non-zero? x is non-zero? Or both are zero.
    return yc[0] ? (y.s = -b, y) : new Big(xc[0] ? x : 0);
  }

  // Determine which is the bigger number. Prepend zeros to equalise exponents.
  if (a = xe - ye) {

    if (xlty = a < 0) {
      a = -a;
      t = xc;
    } else {
      ye = xe;
      t = yc;
    }

    t.reverse();
    for (b = a; b--;) t.push(0);
    t.reverse();
  } else {

    // Exponents equal. Check digit by digit.
    j = ((xlty = xc.length < yc.length) ? xc : yc).length;

    for (a = b = 0; b < j; b++) {
      if (xc[b] != yc[b]) {
        xlty = xc[b] < yc[b];
        break;
      }
    }
  }

  // x < y? Point xc to the array of the bigger number.
  if (xlty) {
    t = xc;
    xc = yc;
    yc = t;
    y.s = -y.s;
  }

  /*
   * Append zeros to xc if shorter. No need to add zeros to yc if shorter as subtraction only
   * needs to start at yc.length.
   */
  if ((b = (j = yc.length) - (i = xc.length)) > 0) for (; b--;) xc[i++] = 0;

  // Subtract yc from xc.
  for (b = i; j > a;) {
    if (xc[--j] < yc[j]) {
      for (i = j; i && !xc[--i];) xc[i] = 9;
      --xc[i];
      xc[j] += 10;
    }

    xc[j] -= yc[j];
  }

  // Remove trailing zeros.
  for (; xc[--b] === 0;) xc.pop();

  // Remove leading zeros and adjust exponent accordingly.
  for (; xc[0] === 0;) {
    xc.shift();
    --ye;
  }

  if (!xc[0]) {

    // n - n = +0
    y.s = 1;

    // Result must be zero.
    xc = [ye = 0];
  }

  y.c = xc;
  y.e = ye;

  return y;
};


/*
 * Return a new Big whose value is the value of this Big modulo the value of Big y.
 */
P.mod = function (y) {
  var ygtx,
    x = this,
    Big = x.constructor,
    a = x.s,
    b = (y = new Big(y)).s;

  if (!y.c[0]) throw Error(DIV_BY_ZERO);

  x.s = y.s = 1;
  ygtx = y.cmp(x) == 1;
  x.s = a;
  y.s = b;

  if (ygtx) return new Big(x);

  a = Big.DP;
  b = Big.RM;
  Big.DP = Big.RM = 0;
  x = x.div(y);
  Big.DP = a;
  Big.RM = b;

  return this.minus(x.times(y));
};


/*
 * Return a new Big whose value is the value of this Big plus the value of Big y.
 */
P.plus = P.add = function (y) {
  var t,
    x = this,
    Big = x.constructor,
    a = x.s,
    b = (y = new Big(y)).s;

  // Signs differ?
  if (a != b) {
    y.s = -b;
    return x.minus(y);
  }

  var xe = x.e,
    xc = x.c,
    ye = y.e,
    yc = y.c;

  // Either zero? y is non-zero? x is non-zero? Or both are zero.
  if (!xc[0] || !yc[0]) return yc[0] ? y : new Big(xc[0] ? x : a * 0);

  xc = xc.slice();

  // Prepend zeros to equalise exponents.
  // Note: Faster to use reverse then do unshifts.
  if (a = xe - ye) {
    if (a > 0) {
      ye = xe;
      t = yc;
    } else {
      a = -a;
      t = xc;
    }

    t.reverse();
    for (; a--;) t.push(0);
    t.reverse();
  }

  // Point xc to the longer array.
  if (xc.length - yc.length < 0) {
    t = yc;
    yc = xc;
    xc = t;
  }

  a = yc.length;

  // Only start adding at yc.length - 1 as the further digits of xc can be left as they are.
  for (b = 0; a; xc[a] %= 10) b = (xc[--a] = xc[a] + yc[a] + b) / 10 | 0;

  // No need to check for zero, as +x + +y != 0 && -x + -y != 0

  if (b) {
    xc.unshift(b);
    ++ye;
  }

  // Remove trailing zeros.
  for (a = xc.length; xc[--a] === 0;) xc.pop();

  y.c = xc;
  y.e = ye;

  return y;
};


/*
 * Return a Big whose value is the value of this Big raised to the power n.
 * If n is negative, round to a maximum of Big.DP decimal places using rounding
 * mode Big.RM.
 *
 * n {number} Integer, -MAX_POWER to MAX_POWER inclusive.
 */
P.pow = function (n) {
  var x = this,
    one = new x.constructor(1),
    y = one,
    isneg = n < 0;

  if (n !== ~~n || n < -MAX_POWER || n > MAX_POWER) throw Error(INVALID + 'exponent');
  if (isneg) n = -n;

  for (;;) {
    if (n & 1) y = y.times(x);
    n >>= 1;
    if (!n) break;
    x = x.times(x);
  }

  return isneg ? one.div(y) : y;
};


/*
 * Return a new Big whose value is the value of this Big rounded to a maximum of dp decimal
 * places using rounding mode rm.
 * If dp is not specified, round to 0 decimal places.
 * If rm is not specified, use Big.RM.
 *
 * dp? {number} Integer, 0 to MAX_DP inclusive.
 * rm? 0, 1, 2 or 3 (ROUND_DOWN, ROUND_HALF_UP, ROUND_HALF_EVEN, ROUND_UP)
 */
P.round = function (dp, rm) {
  var Big = this.constructor;
  if (dp === UNDEFINED) dp = 0;
  else if (dp !== ~~dp || dp < 0 || dp > MAX_DP) throw Error(INVALID_DP);
  return round(new Big(this), dp, rm === UNDEFINED ? Big.RM : rm);
};


/*
 * Return a new Big whose value is the square root of the value of this Big, rounded, if
 * necessary, to a maximum of Big.DP decimal places using rounding mode Big.RM.
 */
P.sqrt = function () {
  var r, c, t,
    x = this,
    Big = x.constructor,
    s = x.s,
    e = x.e,
    half = new Big(0.5);

  // Zero?
  if (!x.c[0]) return new Big(x);

  // Negative?
  if (s < 0) throw Error(NAME + 'No square root');

  // Estimate.
  s = Math.sqrt(x.toString());

  // Math.sqrt underflow/overflow?
  // Re-estimate: pass x to Math.sqrt as integer, then adjust the result exponent.
  if (s === 0 || s === 1 / 0) {
    c = x.c.join('');
    if (!(c.length + e & 1)) c += '0';
    r = new Big(Math.sqrt(c).toString());
    r.e = ((e + 1) / 2 | 0) - (e < 0 || e & 1);
  } else {
    r = new Big(s.toString());
  }

  e = r.e + (Big.DP += 4);

  // Newton-Raphson iteration.
  do {
    t = r;
    r = half.times(t.plus(x.div(t)));
  } while (t.c.slice(0, e).join('') !== r.c.slice(0, e).join(''));

  return round(r, Big.DP -= 4, Big.RM);
};


/*
 * Return a new Big whose value is the value of this Big times the value of Big y.
 */
P.times = P.mul = function (y) {
  var c,
    x = this,
    Big = x.constructor,
    xc = x.c,
    yc = (y = new Big(y)).c,
    a = xc.length,
    b = yc.length,
    i = x.e,
    j = y.e;

  // Determine sign of result.
  y.s = x.s == y.s ? 1 : -1;

  // Return signed 0 if either 0.
  if (!xc[0] || !yc[0]) return new Big(y.s * 0);

  // Initialise exponent of result as x.e + y.e.
  y.e = i + j;

  // If array xc has fewer digits than yc, swap xc and yc, and lengths.
  if (a < b) {
    c = xc;
    xc = yc;
    yc = c;
    j = a;
    a = b;
    b = j;
  }

  // Initialise coefficient array of result with zeros.
  for (c = new Array(j = a + b); j--;) c[j] = 0;

  // Multiply.

  // i is initially xc.length.
  for (i = b; i--;) {
    b = 0;

    // a is yc.length.
    for (j = a + i; j > i;) {

      // Current sum of products at this digit position, plus carry.
      b = c[j] + yc[i] * xc[j - i - 1] + b;
      c[j--] = b % 10;

      // carry
      b = b / 10 | 0;
    }

    c[j] = (c[j] + b) % 10;
  }

  // Increment result exponent if there is a final carry, otherwise remove leading zero.
  if (b) ++y.e;
  else c.shift();

  // Remove trailing zeros.
  for (i = c.length; !c[--i];) c.pop();
  y.c = c;

  return y;
};


/*
 * Return a string representing the value of this Big in exponential notation to dp fixed decimal
 * places and rounded using Big.RM.
 *
 * dp? {number} Integer, 0 to MAX_DP inclusive.
 */
P.toExponential = function (dp) {
  return stringify(this, 1, dp, dp);
};


/*
 * Return a string representing the value of this Big in normal notation to dp fixed decimal
 * places and rounded using Big.RM.
 *
 * dp? {number} Integer, 0 to MAX_DP inclusive.
 *
 * (-0).toFixed(0) is '0', but (-0.1).toFixed(0) is '-0'.
 * (-0).toFixed(1) is '0.0', but (-0.01).toFixed(1) is '-0.0'.
 */
P.toFixed = function (dp) {
  return stringify(this, 2, dp, this.e + dp);
};


/*
 * Return a string representing the value of this Big rounded to sd significant digits using
 * Big.RM. Use exponential notation if sd is less than the number of digits necessary to represent
 * the integer part of the value in normal notation.
 *
 * sd {number} Integer, 1 to MAX_DP inclusive.
 */
P.toPrecision = function (sd) {
  return stringify(this, 3, sd, sd - 1);
};


/*
 * Return a string representing the value of this Big.
 * Return exponential notation if this Big has a positive exponent equal to or greater than
 * Big.PE, or a negative exponent equal to or less than Big.NE.
 * Omit the sign for negative zero.
 */
P.toString = function () {
  return stringify(this);
};


/*
 * Return a string representing the value of this Big.
 * Return exponential notation if this Big has a positive exponent equal to or greater than
 * Big.PE, or a negative exponent equal to or less than Big.NE.
 * Include the sign for negative zero.
 */
P.valueOf = P.toJSON = function () {
  return stringify(this, 4);
};


// Export


var Big = _Big_();

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

const looseJSON = _looseJSON;

let _timeseriesTools = {};

/**
 * Returns true if @value is an Array
 * @param {{unknown}} value
 * @return {{Bolean}}
 */
_timeseriesTools.isArray = (value) => {
  return value && typeof value === 'object' && value instanceof Array && typeof value.length === 'number'
    && typeof value.splice === 'function' && !(value.propertyIsEnumerable('length'));
};


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
};


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
};


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
};

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
};

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
};

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
};

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
};

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
};

const timeseriesTools = _timeseriesTools;

/**
 * Web Worker to parse Warp 10 responses and addapt them to C3.js format
 */

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
};

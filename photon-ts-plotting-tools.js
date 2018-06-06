
class _PhotonTsPlottingTools {
  constructor() {
    this.id = [];
    this.data = [];
    this.names = [];
    this.color = [];
    this.params = [];
    this.currentColorIndex = -1;
    this.palette = [
      '#001f3f', // NAVY
      '#0074D9', // BLUE
      '#7FDBFF', // AQUA
      '#39CCCC', // TEAL
      '#3D9970', // OLIVE
      '#2ECC40', // GREEN
      '#01FF70', // LIME
      '#FFDC00', // YELLOW
      '#FF851B', // ORANGE
      '#FF4136', // RED
      '#85144b', // MAROON
      '#F012BE', // FUSCHIA
      '#B10DC9', // PURPLE
      '#111111', // BLACK
      '#AAAAAA', // GRAY
      '#DDDDDD', // SILVER
    ];
    this.maxColors = 16;
    this.MIN_TS = 0;
    this.MAX_TS = Math.pow(2, 53) - 1;
  }

  isArray(value) {
    return value && typeof value === 'object' && value instanceof Array && typeof value.length === 'number'
      && typeof value.splice === 'function' && !(value.propertyIsEnumerable('length'));
  }
  isTs(ts) {
    return !((ts.c === null) || (ts.l === null)
      || (ts.values === null) || !this.isArray(ts.values));
  }
  isTsToPlot(ts) {
    if (!this.isTs(ts)) {
      return false;
    }
    // We look at the first value, if it's a String or Boolean it's an annotation GTS,
    // if it's a number it's a GTS to plot
    return typeof (ts.values[0].y) === 'number';
  }
  equalMetadata(a, b) {
    if (a.c === undefined || b.c === undefined ||
      a.l === undefined || b.l === undefined ||
      !(a.l instanceof Object) || !(b.l instanceof Object)) {
      console.error('[warp10-ts-plotting-tools] equalMetadata',
        'Error in GTS, metadata is not well formed');
      return false;
    }
    if (a.c !== b.c) {
      return false;
    }
    for (let p in a.l) { // eslint-disable-line guard-for-in
      if (!b.l.hasOwnProperty(p)) return false;
      if (a.l[p] !== b.l[p]) return false;
    }
    for (let p in b.l) {
      if (!a.l.hasOwnProperty(p)) return false;
    }
    return true;
  }

  getColor(index) {
    return this.palette[index % this.maxColors];
  }
  currentColor() {
    return this.getColor(this.currentColorIndex);
  }
  nextColor() {
    this.currentColorIndex += 1;
    return this.currentColor();
  }
  removeColorIfLast(color) {
    if (color === this.currentColor()) {
      return this.currentColorIndex -= 1;
    }
  }

  isPlotted(ts) {
    return ts && ts.id && this.id.indexOf(ts.id) >= 0;
  }
  tsColor(ts) {
    if (!this.isPlotted(ts)) {
      return '';
    }
    let index = this.id.indexOf(ts.id);
    return 'background-color:' + this.params[index].color + ';';
  }

  add(ts) {
    if (!this.isPlotted(ts)) {
      if (this.debug) {
        console.log('[warp10-ts-plotting-tools] add', ts);
      }
      this.data.push(ts);
      this.names.push({
        c: ts.c,
        l: ts.l,
        id: ts.id,
      });
      this.params.push({ color: this.nextColor() });
      this.id.push(ts.id);
    }
  }
  remove(ts) {
    let index;
    if (this.isPlotted(ts)) {
      index = this.id.indexOf(ts.id);
      if (index > -1) {
        this.id.splice(index, 1);
        this.data.splice(index, 1);
        this.names.splice(index, 1);
        this.removeColorIfLast(this.params[index].color);
        this.params.splice(index, 1);
      }
    }
  }

  refresh(tsList) {
    if (this.debug) {
      console.debug('[warp10-ts-plotting-tools] refresh', tsList);
    }

    // Variable to see if the GTS shown on graph still exists in new data
    let tsInPlottedStillExists = [];
    this.id.forEach((item) => {
      tsInPlottedStillExists.push(false);
    });
    if (this.debug) {
      console.debug('[warp10-ts-plotting-tools] refresh', tsInPlottedStillExists);
    }

    tsList.forEach((ts) => {
      if (this.isPlotted(ts)) {
        let i = this.id.indexOf(ts.id);
        if (this.equalMetadata(this.names[i], ts)) {
          this.data[i] = ts;
          tsInPlottedStillExists[i] = true;
        }
      }
    });

    for (let index = tsInPlottedStillExists.length - 1; index >= 0; index--) {
      if (!tsInPlottedStillExists[index]) {
        this.id.splice(index, 1);
        this.data.splice(index, 1);
        this.names.splice(index, 1);
        this.removeColorIfLast(this.params[index].color);
        this.params.splice(index, 1);
      }
    }
  }

  getTimeBounds(tsList) {
    let bounds = {};
    if (!this.isArray(tsList)) {
      return bounds;
    }

    bounds.min = this.MAX_TS;
    bounds.max = this.MIN_TS;

    for (let i = 0; i < tsList.length; i++) {
      let ts = tsList[i];

      if (bounds.min > ts.values[0].x) {
        bounds.min = ts.values[0].x;
      }
      if (bounds.max < ts.values[ts.values.length - 1].x) {
        bounds.max = ts.values[ts.values.length - 1].x;
      }
    }
    return bounds;
  }
}

export const PhotonTsPlottingTools = _PhotonTsPlottingTools;
export default PhotonTsPlottingTools;

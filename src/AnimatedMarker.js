L.AnimatedMarker = L.Marker.extend({
  options: {
    isStarted: false,
    isStopped: false,
    // meters
    distance: 200,
    // ms
    interval: 1000,
    // animate on add?
    autoStart: true,
    // callback onend
    onEnd: function(){},
    clickable: false
  },

  initialize: function (latlngs, options) {
    this.setLine(latlngs);
    L.Marker.prototype.initialize.call(this, latlngs[0], options);
  },

  // Breaks the line up into tiny chunks (see options) ONLY if CSS3 animations
  // are not supported.
  _chunk: function(latlngs) {
    var i,
        len = latlngs.length,
        chunkedLatLngs = [];

    for (i=1;i<len;i++) {
      var cur = latlngs[i-1],
          next = latlngs[i],
          dist = cur.distanceTo(next),
          factor = this.options.distance / dist,
          dLat = factor * (next.lat - cur.lat),
          dLng = factor * (next.lng - cur.lng);

      if (dist > this.options.distance) {
        while (dist > this.options.distance) {
          cur = new L.LatLng(cur.lat + dLat, cur.lng + dLng);
          dist = cur.distanceTo(next);
          chunkedLatLngs.push(cur);
        }
      } else {
        chunkedLatLngs.push(cur);
      }
    }
    chunkedLatLngs.push(latlngs[len-1]);

    return chunkedLatLngs;
  },

  onAdd: function (map) {
    L.Marker.prototype.onAdd.call(this, map);

    // Start animating when added to the map
   if (this.options.autoStart) {
      if (!this.options.isStarted) {
        this.start();
        this.options.isStarted = true;
      }
    }
  },

 animate: function(start) {
    if (!this.options.isStopped) {
        var self  = this,
          len   = this._latlngs.length,
          speed = this.options.interval;
          this.options.onStart(this._i, this);
        // Normalize the transition speed from vertex to vertex
        if (this._i < len && this.i > 0) {
          speed = this._latlngs[this._i-1].distanceTo(this._latlngs[this._i]) / this.options.distance * this.options.interval;
        }

        this.enableTransitions(speed);

        // Move to the next vertex
        this.setLatLng(this._latlngs[this._i]);
        this._i++;
        // Queue up the animation to the next next vertex
        this._tid = setTimeout(function(){
          if (self._i === len) {

            self.options.onEnd.apply(self, Array.prototype.slice.call(arguments));
          } else {
            self.animate();
          }
        }, start ? 0 : speed);
      }
  },
  /*
    Change animation speed function
  */
  setSpeed: function(speed){
	this.options.interval = speed;
  },

  // Start the animation
  start: function() {
    this.options.isStopped = false;
    if (!this._i) {
      this._i = 1;
    }

    this.animate();
  },
  /*
   Pause The animation.
   (The start function is called again to continue.)
  */
   pause: function () {
    if (this._tid) {
      clearTimeout(this._tid);
      this.options.isStopped = true;
    }
  },

  // Stop the animation in place
  stop: function() {
    if (this._tid) {
      clearTimeout(this._tid);
      this.options.isStopped = true;
    }
  },

  setLine: function(latlngs){
    if (L.DomUtil.TRANSITION) {
      // No need to to check up the line if we can animate using CSS3
      this._latlngs = latlngs;
    } else {
      // Chunk up the lines into options.distance bits
      this._latlngs = this._chunk(latlngs);
      this.options.distance = 10;
      this.options.interval = 30;
    }
    this._i = 0;
  }

});

L.animatedMarker = function (latlngs, options) {
  return new L.AnimatedMarker(latlngs, options);
};

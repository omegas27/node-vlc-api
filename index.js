var request = require('request'),
    url = require('url'),
    path = require('path'),
    util = require('util');

var Client = module.exports = function (opts) {
  if (!(this instanceof Client)) {
    return new Client(opts);
  }

  var client = this;

  // Document which api version.
  this.apiVersion = {
    vlc: '2.0.1 Twoflower',
    spec: "http://repo.or.cz/w/vlc.git/blob/HEAD:/share/lua/http/requests/README.txt"
  };

  opts = opts || {};

  this._base = this.base || util.format('http://%s:%d',
    opts.host || 'localhost',
    opts.port || 8080
  );

  // The rest of this constructor is defining all the convenience methods
  // that make this api useful. It may be nice to move this elsewhere. Unsure.

  // STATUS RESOURCE (almost everything is lumped onto this resource.)
  this.status = this.request.bind(this, 'status');
  // Add a song to the playlist.
  this.status.enqueue = function (uri, opts, cb) {
    if (typeof opts == 'function') {
      cb = opts;
      opts = {};
    }
    opts.command = 'in_enqueue';
    opts.input = uri;

    return client.status(opts, cb);
  };
  // Associate a subtitle file with the currently playing file.
  this.status.addSubtitle = function (uri, opts, cb) {
    if (typeof opts == 'function') {
      cb = opts;
      opts = {};
    }
    opts.command = 'addsubtitle';
    opts.val = uri;

    return client.status(opts, cb);
  };
  // Add song to playlist and immediately start playing.
  this.status.play = function (uri, opts, cb) {
    if (typeof opts == 'function') {
      cb = opts;
      opts = {};
    }
    opts.command = 'in_play';
    opts.input = uri;
    return client.status(opts, cb);
  };
  // Go to this song on the playlist.
  this.status.goto = function (id, opts, cb) {
    if (typeof id == 'function') {
      cb = id;
      id = null;
      opts = {};
    }
    else if (typeof opts == 'function') {
      cb = opts;
      opts = {};
    }
    opts.command = 'pl_play';
    opts.input = id;
    return client.status(opts, cb);
  };
  // Set pause status. Null status means toggle.
  this.status.pause = function (status, cb) {
    if (typeof status == 'function') {
      return client.status({command: 'pl_pause'}, status);
    }
    if (status) {
      return client.status({command: 'pl_forceresume'}, status);      
    }
    return client.status({command: 'pl_forcepause'}, status);      
  }
  // Stop playback.
  this.status.stop = this.request.bind(this, 'status', {command: 'pl_stop'});
  // Resume playback.
  this.status.resume
    = this.request.bind(this, 'status', {command: 'pl_forceresume'})
  ;
  // Next and previous.
  this.status.next = this.request.bind(this, 'status', {command: 'pl_next'});
  this.status.prev 
    = this.status.previous
    = this.request.bind(this, 'status', {command: 'pl_previous'})
  ;
  // UNSUPPORTED, but easy enough to add. Will see how it goes.
  this.status.delete = function (id, opts, cb) {
    if (typeof opts == 'function') {
      cb = opts;
      opts = {};
    }
    opts.command = 'pl_delete';
    opts.input = id;
    return client.status(opts, cb);
  };
  // Scrap the whole playlist, start over.
  this.status.empty = function (cb) {
    return client.status({
      command: 'pl_empty',
    }, cb);
  };
  // Set audio delay (sure, why not?)
  this.status.audioDelay = function (seconds, cb) {
    client.status({
      command: 'audiodelay',
      val: seconds
    }, cb);
  };
  // Set subtitle delay (sure, why not?)
  this.status.subtitleDelay = function (seconds, cb) {
    client.status({
      command: 'subdelay',
      val: seconds
    }, cb);
  };
  // Set aspect ratio (sure, why not?)
  this.status.aspectRatio = function (ratio, cb) {
    // Support a few ways of specifying the ratio.
    if (ratio.w && ratio.h) {
      ratio = ratio.w + ':' + ratio.h;
    }
    if (ratio.width && ratio.height) {
      ratio = ratio.width + ':' + ratio.height;
    }
    if (Array.isArray(ratio)) {
      ratio = ratio.join(':');
    }

    client.status({
      command: 'aspectratio',
      val: ratio
    }, cb);
  };
  // Sort the playlist.
  this.status.sort = function (mode, order, cb) {
    var err;
    if (typeof order == 'function') {
      cb = order;
      order = 0;
    }

    if (typeof order == 'string') {
      switch (order.toLowerCase()) {
        case 'forward':
          order = 0;
          break;
        case 'reverse':
          order = 1;
          break;
        default:
          // No match means this is an error. Callback and return.
          err = new Error('Order may be `forward` or `backward`.');
      }
    }

    if (typeof mode == 'string') {
      mode = ['id', 'name', null, 'author', null, 'random', null, 'track']
        .indexOf(mode.toLowerCase())
      ;
      if (mode == -1) {
        // No specified mode! Error time.
        err = err || cb(new Error('Modes are: `' + mode.join('`, `') + '`.'));
      }
    }

    // callback or throw as appropriate.
    if (err) {
      try {
        return cb(err);
      }
      catch (e) {
        throw err;
      }
    }

    client.status({
      command: 'pl_sort',
      id: order,
      val: mode
    }, cb);
  };
  // Toggle random
  this.status.random
    = this.request.bind(this, 'status', {command: 'pl_random'})
  ;
  // Toggle loop
  this.status.loop = function(cb) {
    return client.status({
      command: 'pl_loop',
    }, cb);
  };
    
  // Toggle repeat
  this.status.repeat = function(cb) {
    return client.status({
      command: 'pl_repeat',
    }, cb);
  };
    
  // Turn on service discovery modules.
  this.status.discovery = function (cb) {
    return client.status({
      command: 'pl_sd',
      val: val
    }, cb);
  };
  // Toggle fullscreen
  this.status.fullscreen
    = this.request.bind(this, 'status', {command: 'fullscreen'})
  ;
  // Set volume
  this.status.volume = function (vol, cb) {
    return client.status({
      command: 'volume',
      val: vol
    }, cb);
  };
  // Seek to some time
  this.status.seek = function (t, cb) {
    return client.status({
      command: 'seek',
      val: t
    }, cb);
  };
  // Set gain on preamp (dB)
  this.status.preamp = function (k, cb) {
    return client.status({
      command: 'volume',
      val: k
    }, cb);
  };
  // Set the gain on a particular band (dB)
  this.status.equalizer = function (band, k, cb) {

    return client.status({
      command: 'equalizer',
      band: band,
      val: k
    }, cb);
  };
  // Enable equalizer.
  this.status.equalizer.enable
    = this.request.bind(this, 'status', {command: 'enableeq', val: 1})
  ;
  // Disable equalizer.
  this.status.equalizer.disable
    = this.request.bind(this, 'status', {command: 'enableeq', val: 0})
  ;
  // Set equalizer presets
  this.status.equalizer.preset = function (pre, cb) {
    if (typeof pre == 'function') {
      cb = pre;
      pre = null;
    }
    return client.status({
      command: 'setpreset',
      val: pre
    }, cb);
  };
  // Set title
  this.status.title = function (text, cb) {
    return client.status({
      command: 'title',
      val: text
    }, cb);
  };
  // Set chapter
  this.status.chapter = function (text, cb) {
    return client.status({
      command: 'chapter',
      val: text
    }, cb);
  };
  // Set audio track
  this.status.audioTrack = function (val, cb) {
    return client.status({
      command: 'audio_track',
      val: val
    }, cb);
  };
  // Set video track
  this.status.videoTrack = function (val, cb) {
    return client.status({
      command: 'video_track',
      val: val
    }, cb);
  };
  // Set subtitle track
  this.status.subtitleTrack = function (val, cb) {
    return client.status({
      command: 'subtitle_track',
      val: val
    }, cb);
  };

  // PLAYLIST RESOURCE
  // returns a representation of the playlist.
  this.playlist = this.request.bind(this, 'playlist');

  // BROWSE RESOURCE
  // Browse for this particular uri.
  this.browse = function (uri, cb) {
    client.request('browse', {uri: uri}, cb);
  };
}

// Resolve a resource to the uri we need.
Client.prototype._resolve = function (resource) {
  return url.resolve(this._base, util.format('/requests/%s.json', resource));
}

function handleError(err, json, cb) {
  if (typeof json == 'function') {
    cb = json;
    json = null;
  }
   // Optional cb. Sometimes you want to fire and forget.
  if (cb) {
    cb(err, json);
  } else {
    throw err;
  }
}

// Base vlc api request client api.
Client.prototype.request = function (resource, opts, cb) {
  var client = this;

  if (typeof resource == 'function') {
    return cb(
      new Error('First argument to Client#request should be a resource.')
    );
  }
  if (typeof opts == 'function') {
    cb = opts;
    opts = {};
  }

  // From what I can tell, the api is completely GET-based.
  request({
    method: 'GET',
    uri: client._resolve(resource),
    qs: opts || {}
  }, function (err, res, body) {
    if (err) {
      return handleError(err, null, cb)
    }

    if (!res || !res.statusCode || !body) {
      return handleError(new Error("Missing VLC server"), null, cb);
    }

    // Documentation does not say which status codes to expect.
    // I'm filtering out 300-500 range codes here
    // as a sane default.
    switch (Math.floor(res.statusCode/100)) {
      case 1:
      case 2:
        break;
      case 3:
      case 4:
      case 5:
      default:
      return handleError(new Error(util.format('HTTP status %d', res.statusCode)), null, cb);
        break;
    }
      
    try {
      if (cb) {
        // Body should be JSON-parse-able.
        cb(null, JSON.parse(body.toString()))
      }
      return;
    } catch (e) {
      handleError(null, body.toString(), cb);
    }
  });
}

// Downloads art for current song.
// Completely different api from the "resource" api.
Client.prototype.art = function () {
  // Returns a request pipe that should be streaming down an image of some
  // kind.
  return request(url.resolve(this._base, 'art'));
};

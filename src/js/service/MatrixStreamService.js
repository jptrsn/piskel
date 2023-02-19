
(function () {
    var ns = $.namespace('pskl.service');
    var MAX_SEGMENT_LENGTH = 80;
  
    ns.MatrixStreamService = function (piskelController) {
      this.piskelController = piskelController;
      return this;
    };
  
    ns.MatrixStreamService.prototype.init = function () {
      this.attachWebsocketClient('192.168.1.213');
    };

    ns.MatrixStreamService.prototype.attachWebsocketClient = function (ip) {
      this.client = new WebSocket('ws://' + ip + '/ws');
      this.connected = false;
      this.client.onopen = () => {
        console.log('client open');
        this.connected = true;
      };
      this.client.onclose = () => {
        this.connected = false;
        console.log('closed', this);
        setTimeout(function() { 
          console.log('reattaching',this)
          this.init()
        }.bind(this), 5000);
      };
      this.client.onerror = (e) => {
        console.log('client error', e);
      }
    }

    ns.MatrixStreamService.prototype.render = function (frame) {
      if (this.client) {
        // console.log('connected', this.connected);
        if (this.connected) {
          var colors = [];
          for (var i = 0; i < frame.pixels.length; i++) {
            colors.push(pskl.utils.intToHex(frame.pixels[i]));
          }
          // var commands = this.gridToPixels_(colors);
          var commands = this.gridToSegments_(colors);
          console.log('commands', commands.length);
          for (let i in commands) {
            this.client.send(JSON.stringify(commands[i]));
          }
        } else {
          console.log('disconnected')
        }
      }
    }

    ns.MatrixStreamService.prototype.gridToSegments_ = function (grid, includeBlack = true) {
      let segments = [];
      let lastColor = grid[0];
      let start = 0;
      const rtn = [];
      for (let i = 0; i < grid.length; i++) {
        let thisColor = grid[i];
        if (thisColor !== lastColor) {
          // We are at a colour change point. Save the segment colour as a variable
          let colorString = lastColor.substring(1,7);
          // If the segment colour is not black, capture as a segment of pixel colours
          if (colorString !== '000000' || includeBlack) {
            segments.push(start, i, colorString.toUpperCase());
          }
          start = i;
          lastColor = thisColor;
        }
        if (segments.length > MAX_SEGMENT_LENGTH) {
          rtn.push(this.arrayToApiCommand_(segments));
          segments = [];
        }
      }
      if (lastColor !== '#000000' || includeBlack) {
        segments.push(start, grid.length, lastColor.substring(1,7))
      }
      if (segments.length) {
        rtn.push(this.arrayToApiCommand_(segments));
      }
      return rtn;
    }

    ns.MatrixStreamService.prototype.gridToPixels_ = function(grid, includeBlack = true) {
      let segments = [];
      const rtn = [];
      for (let i = 0; i < grid.length; i++) {
        if (includeBlack) {
          var colorString = grid[i].substring(1,7).toUpperCase();
          segments.push(i, colorString)
        } else if (grid[i] !== "#000000") {
          var colorString = grid[i].substring(1,7).toUpperCase();
          segments.push(i, colorString)
        }
        if (segments.length > MAX_SEGMENT_LENGTH) {
          rtn.push(this.arrayToApiCommand_(segments));
          segments = [];
        }
      }
      if (segments.length) {
        rtn.push(this.arrayToApiCommand_(segments));
      }
      return rtn;
    }

    ns.MatrixStreamService.prototype.arrayToApiCommand_ = function(arr) {
      return {"on": true, "bri": 100, "seg": { "i": arr}};
    }
  })();
  

(function () {
    var ns = $.namespace('pskl.service');
    
  
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
      };
      this.client.onerror = (e) => {
        console.log('client error', e);
      }
    }

    ns.MatrixStreamService.prototype.render = function (frame) {
      if (this.client) {
        console.log('connected', this.connected, frame.pixels.length);
        var colors = [];
        for (var i = 0; i < frame.pixels.length; i++) {
          colors.push(pskl.utils.intToHex(frame.pixels[i]));
        }
        var commands = this.gridToPixels_(colors);
        if (this.connected) {
          for (let i in commands) {
            this.client.send(JSON.stringify(commands[i]));
          }
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
        if (segments.length > 200) {
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
        if (segments.length > 200) {
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
  
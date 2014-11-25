$(function() {
  var position;
  var times;

  var metonicDate = function(date) {
    var leapYears = [2, 5, 7, 10, 13, 16, 18];
    var yearZero = 1054;

    var firstYear = date.getFullYear() - (date.getFullYear() % 19);
    var began_at = new Date(firstYear, 1, 1);

    var n = Math.floor((+date - +began_at) / 86400000);
    var i = 0;
    var y, m, d;

    for (y = 1; y <= 19; y++) {
      for (m = 1; m <= 13; m++) {
        switch (m) {
        case 1:
        case 3:
        case 5:
        case 7:
        case 9:
        case 11:
          d = 30;
          break;
        case 2:
        case 4:
        case 6:
        case 8:
        case 10:
          d = 29;
          break;
        case 12:
          d = leapYears.indexOf(y) && y % 2 ? 30 : 29;
          break;
        case 13:
          d = leapYears.indexOf(y) ? 30 : 0;
          break;
        }

        if (i + d > n) {
          d = n - i + 1;
          y = y + began_at.getFullYear() - yearZero - 1;
          m = m + 1;
          return { year: y, month: m, day: d };
        } else {
          i += d;
        }
      }
    }
  }

  var decimalTime = function(date) {
    var midnight = times.nadir;
    var seconds = Math.floor((+date - +midnight) / 1000);
    var centiday = Math.floor(seconds / 864);
    var beat = Math.floor(((1000 * seconds) / 864) % 1000);

    return { centiday: centiday, beat: beat };
  }

  var colors = {
    day: [[222, 40, 45], [210, 35, 55], [210, 45, 75]],
    night: [[240, 33, 10], [225, 40, 10], [240, 20, 20]],
    twilight: [[240, 25, 35], [270, 5, 55], [20, 35, 80]]
  }

  var hsl = function(args) {
    var h = args[0];
    var s = args[1];
    var l = args[2];

    return 'hsl(' + h + ', ' + s + '%, ' + l + '%)';
  }

  var interpolation = function(x, x0, x1, y0, y1) {
    return Math.floor(y0 + (y1 - y0) * (x - x0) / (x1 - x0));
  }

  var skyGradient = function(time) {
    var a = [[], [], []];
    var a0, a1, x, i, j;

    var sunrise = decimalTime(times.sunrise).centiday;
    var sunset = decimalTime(times.sunset).centiday;

    if (time < sunrise - 3.0) {
      x = 0;
      a0 = colors.night;
      a1 = colors.night;
    } else if (time < sunrise) {
      x = interpolation(time, sunrise - 3.0, sunrise, 0, 100);
      a0 = colors.night;
      a1 = colors.twilight;
    } else if (time < sunrise + 3.0) {
      x = interpolation(time, sunrise, sunrise + 3.0, 0, 100);
      a0 = colors.twilight;
      a1 = colors.day;
    } else if (time < sunset - 3.0) {
      x = 0;
      a0 = colors.day;
      a1 = colors.day;
    } else if (time < sunset) {
      x = interpolation(time, sunset - 3.0, sunset, 0, 100);
      a0 = colors.day;
      a1 = colors.twilight;
    } else if (time < sunset + 3.0) {
      x = interpolation(time, sunset, sunset + 3.0, 0, 100);
      a0 = colors.twilight;
      a1 = colors.night;
    } else {
      x = 0;
      a0 = colors.night;
      a1 = colors.night;
    }

    for (i = 0; i < 3; i++) {
      for (j = 0; j < 3; j++) {
        a[i][j] = interpolation(x, 0, 100, a0[i][j], a1[i][j]);
      }
    }

    return 'linear-gradient(to bottom, ' + hsl(a[0]) + ' 0%, ' + hsl(a[1]) + ' 70%, ' + hsl(a[2]) + ' 100%)';
  }

  $(document).ready(function() {
    var date = new Date();
    var today = date.getDate();

    navigator.geolocation.getCurrentPosition(function(pos) {
      console.log('got current position');

      position = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude
      };

      times = SunCalc.getTimes(date, position.latitude, position.longitude);

      window.setInterval(function() {
        date = new Date();

        if (today !== date.getDate()) { // new day
          today = date.getDate();
          times = SunCalc.getTimes(date, position.latitude, position.longitude);
        }

        var cal = $.extend({}, metonicDate(date), decimalTime(date));
        var time = parseFloat('' + cal.centiday + '.' + cal.beat) % 100;

        $('body').css('background', skyGradient(time));

        for (var k in cal) {
          var v = '' + cal[k];
          var n = (k == 'year' || k == 'beat' ? 3 : 2);

          while (v.length < n) {
            v = '0' + v;
          }

          $('time .' + k).html(v);
        }
      }, 100);
    });
  });
});

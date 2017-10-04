var path = require('path');
var qs = require('qs');
var async = require('async');
var later = require('later');
var request = require('simple-oauth2/node_modules/request');
module.exports = function OauthTimedTaskModule(pb) {

    //pb dependencies
    var util          = pb.util;
    var PluginService = pb.PluginService;
    var OauthService  = PluginService.getService('oauthService', 'oauth-pencilblue');

    function OauthTimedTask() {}
    util.inherits(OauthTimedTask, pb.BaseController);
    // this.updateDailyData();
    // console.log(this);
    var textSched = later.parse.text('every 1 min');

  // execute logTime one time on the next occurrence of the text schedule
  var timer = later.setTimeout(logTime, textSched);

  // execute logTime for each successive occurrence of the text schedule
  var timer2 = later.setInterval(logTime, textSched);

  // function to execute
  function logTime() {
    console.log(getInfos("/123","eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE0NTgwMTQzNzEsInNjb3BlcyI6InJociByc2xlIHJhY3QiLCJzdWIiOiI0QzlKRDYiLCJhdWQiOiIyMjdHVFQiLCJpc3MiOiJGaXRiaXQiLCJ0eXAiOiJhY2Nlc3NfdG9rZW4iLCJpYXQiOjE0NTgwMTA3NzF9.-dOR-ZrDonDuvHozEespCC-xR3B4O-4T6gYko9EDu3g"),cb);

  }

  // clear the interval timer when you are done
  timer2.clear();
    
    

    function getInfos(uri,token, cb) {
        var self = this;
        var options = {
            uri: uri,
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        };
        request(options, function(err, result) {
            if (util.isError(err)) {
                cb(err, result);
            }
            else {
                cb(err, result.body);
            }
        });

    };


    //exports
    return OauthTimedTask;
};
/*
    Copyright (C) 2015  PencilBlue, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var request = require('simple-oauth2/node_modules/request');
var oauth2  = require('simple-oauth2');
var async = require('async');

module.exports = function(pb) {

    var util = pb.util;
    //4C7J4R

    var fitbit = {
        clientID : pb.config.fitbit.clientID,
        clientSecret : pb.config.fitbit.clientSecret,
        site : 'https://www.fitbit.com',
        tokenPath : '/oauth2/token',
        authorizationPath : '/oauth2/authorize'

    }
    
    function OauthService(provider) {

        this.provider = provider;
        this.credential = null;
        this.oauth = null;
    }

    OauthService.init = function(cb) {
        cb(null, true);
    };

    OauthService.getName = function() {
        return "oauthService";
    };

    OauthService.prototype.getOauth = function(cb) {

        var self = this;
        this.oauth = null;
        if (this.oauth == null) {
            var pluginService = new pb.PluginService();
            pluginService.getSettings('oauth-pencilblue', function(err, oauthSettings) {     
                self.credential = fitbit;
                self.oauth = oauth2(self.credential);
                //console.log(self.oauth);
                cb(null, true);   
            });
        }
        else {
            // this.oauth = null;
            // var pluginService = new pb.PluginService();
            // pluginService.getSettings('oauth-pencilblue', function(err, oauthSettings) {     
            //     self.credential = fitbit;
            //     self.oauth = oauth2(self.credential);
            //     //console.log(self.oauth);
            //     cb(null, true);   
            // });
            cb(null, true); 
        }
    };

    OauthService.prototype.getAuthorizationUri = function(cb) {
        // console.log(tmp);
        var self = this;
        this.getOauth(function(err, results) {
            if (util.isError(err)) {
                cb(err, results);
            }
            else {
                var url = self.oauth.authCode.authorizeURL({
                    redirect_uri: pb.config.siteRoot + '/oauth/fitbit/callback',
                    scope: 'profile weight activity heartrate sleep nutrition',
                    response_type: 'code'
                });
                // console.log(url);
                cb(null, url);
            }
        })
        
    };

    OauthService.prototype.getToken = function(code, cb) {
        var self = this;
        this.getOauth(function(err, result) {
            if (util.isError(err)) {
                cb(err, result);
            }
            else {
                self.oauth.authCode.getToken({
                    code: code,
                    redirect_uri: pb.config.siteRoot + '/oauth/fitbit/callback'
                }, cb);
            }
        });
    };

    OauthService.prototype.createToken = function(token, cb) {
        var self = this;
        this.getOauth(function(err, result) {
            if (util.isError(err)) {
                cb(err, result);
            }
            else {
                cb(null, self.oauth.accessToken.create(token));
            }
        });
    };

    OauthService.prototype.getYesterday = function(){
        var today = new Date();
        today.setDate(today.getDate() - 1);
          var yd = today,
            month = '' + (yd.getMonth() + 1),
            day = '' + yd.getDate(),
            year = yd.getFullYear();

          if (month.length < 2) month = '0' + month;
          if (day.length < 2) day = '0' + day;


          return [year, month, day].join('-');
    };

    OauthService.prototype.updateDailyData = function(user,access_token,cb){
        var self = this;
        var user_data = {};
        var yesterday = self.getYesterday();
        var dao = new pb.DAO();
        // console.log(yesterday);
       
        user_data.userId = user._id;
        user_data.username = user.username;

        var activity_uri = 'https://api.fitbit.com/1/user/' + user.fitbit_userId + '/activities/steps/date/' + yesterday + '/1d.json';
        self.getInfos(activity_uri,access_token, function (err, activityData) {
            if (util.isError(err)) {
                self.renderError(err, cb);
            }
            else {
                user_data.fitbit_activityData = JSON.parse(activityData);
                // console.log(activityData);
                
                var heartrate_uri = 'https://api.fitbit.com/1/user/' + user.fitbit_userId + '/activities/heart/date/' + yesterday + '/1d.json'
                self.getInfos(heartrate_uri,access_token, function (err2, heartrateData) {
                    if (util.isError(err2)) {
                        self.renderError(err2, cb);
                    }
                    else {
                        user_data.fitbit_heartrateData = JSON.parse(heartrateData);
                        // console.log(heartrateData);

                        var sleep_uri = 'https://api.fitbit.com/1/user/' + user.fitbit_userId + '/sleep/date/'+ yesterday +'.json';
                        self.getInfos(sleep_uri,access_token, function (err3, sleepData) {
                            if (util.isError(err3)) {
                                self.renderError(err3, cb);
                            }else{
                                user_data.sleepData = JSON.parse(sleepData);

                                var fitbit = pb.DocumentCreator.create('fitbit_data', user_data);
                                dao.save(fitbit, function(err, data) {
                                    if(util.isError(err)) {
                                      cb({
                                        code: 500,
                                        content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
                                      });
                                      return;
                                    }
                                    cb({
                                      code: 200,
                                      content: 'ok'
                                    });
                                });
                                
                            }
                        });
                    }
                });
            }//else getInfos
        }); 
    };

    OauthService.prototype.getInfos = function(uri,token, cb) {
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

    return OauthService;
};

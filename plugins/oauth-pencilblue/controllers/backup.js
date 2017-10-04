var path = require('path');
var qs = require('qs');
var async = require('async');

module.exports = function OauthCallbackModule(pb) {

    //pb dependencies
    var util          = pb.util;
    var PluginService = pb.PluginService;
    var OauthService  = PluginService.getService('oauthService', 'oauth-pencilblue');

    function OauthCallback() {}
    util.inherits(OauthCallback, pb.BaseController);

    OauthCallback.prototype.render = function(cb) {
        var self = this;
        var vars = this.pathVars;
        var code = this.query.code;
        var user = self.session.authentication.child_user != null ? self.session.authentication.child_user : self.session.authentication.user;
        var dao = new pb.DAO();
        var service = new OauthService(vars.provider);
        // console.log(self);
        service.getToken(code, function(err, result) {
            console.log(result.user_id);
            var serv = new OauthService();
            if (util.isError(err)) {
                self.renderError(err, cb);
            }
            else {
                self.saveTokenWithUserID(user._id,result,cb);
                // self.updateFitbitdata(cb);
            }
        });




    };

    OauthCallback.getRoutes = function(cb) {
        var routes = [
            {
                method: 'get',
                path: '/oauth/fitbit/callback',
                auth_required: false,
                content_type: 'text/html'
            }
        ];
        cb(null, routes);
    };

    OauthCallback.prototype.renderError = function(err, cb) {
        cb({
            content_type: 'text/json',
            code: 200,
            content: err.message
        });
    };

    OauthCallback.prototype.saveTokenWithUserID = function(userId , result,cb) {    
        var self = this;
        var post = {};

        post.access_token = result.access_token;
        post.refresh_token = result.refresh_token;
        post.fitbit_userId = result.user_id;
        // post.fitbit_userId = 
        var dao = new pb.DAO();
        dao.loadById(userId,'user',function(err, user){
            if(util.isError(err)) {
               cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, errMsg)
              });
              return;
            }
            pb.DocumentCreator.update(post, user);
            dao.save(user, function(err, result) {
                if(util.isError(err)) {
                   cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, errMsg)
                  });
                  return;
                }
                console.log("yyyyyy");
                self.updateFitbitdata(cb);
                cb({
                    code:200,
                    content: 'Successfully'
                });
            });
        });

    }

    OauthCallback.prototype.updateFitbitdata = function(cb) {       
        var self = this;  
        var post = {};
        var service = new OauthService();
        var dao = new pb.DAO();
        var j = 0;
        dao.q('user',{},function(err, users){
            for(var i = 0; i < users.length; i++,j++){
                // console.log(i + " : " + users[i].access_token);
                console.log("duobi");
                if(users[i].access_token != null){
                    console.log("first: " + i);
                    console.log(users[i]);
                    var user_data = {};
                    var yesterday = service.getYesterday();
                    // console.log(yesterday);
                    user_data.userId = users[i]._id;
                    user_data.username = users[i].username;

                    var activity_uri = 'https://api.fitbit.com/1/user/' + users[i].fitbit_userId + '/activities/steps/date/' + yesterday + '/1d.json';
                    console.log("first_1: " + i + "," + j);
                    var access_token = users[i].access_token;
                    service.getInfos(activity_uri,access_token, function (err, activityData) {
                        console.log("first_2: " + i + "," + j);
                        if (util.isError(err)) {
                            self.renderError(err, cb);
                        }
                        else {
                            // console.log("first_2: " + i + "," + j);
                            user_data.fitbit_activityData = JSON.parse(activityData);
                            console.log("first_3: " + i);
                            // console.log(activityData);
                            console.log("==========");
                            console.log("second: " + i);
                            console.log(users[i]);
                            var heartrate_uri = 'https://api.fitbit.com/1/user/' + users[i].fitbit_userId + '/activities/heart/date/' + yesterday + '/1d.json';
                            service.getInfos(heartrate_uri,users[i].access_token, function (err2, heartrateData) {
                                if (util.isError(err2)) {
                                    self.renderError(err2, cb);
                                }
                                else {
                                    console.log("+++++++++");
                                    console.log("third: " + i);
                                    console.log(users[i]);
                                    // console.log(heartrateData);
                                    user_data.fitbit_heartrateData = JSON.parse(heartrateData);
                                    // console.log(heartrateData);

                                    var sleep_uri = 'https://api.fitbit.com/1/user/' + users[i].fitbit_userId + '/sleep/date/'+ yesterday +'.json';
                                    service.getInfos(sleep_uri,users[i].access_token, function (err3, sleepData) {
                                        if (util.isError(err3)) {
                                            self.renderError(err3, cb);
                                        }else{
                                            // console.log(sleepData);
                                            user_data.sleepData = JSON.parse(sleepData);
                                            
                                            var fitbit = pb.DocumentCreator.create('fitbit_data', user_data);
                                            // console.log(fitbit);
                                            dao.save(fitbit, function(err, result) {
                                                if(util.isError(err)) {
                                                   cb({
                                                    code: 400,
                                                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, errMsg)
                                                  });
                                                  return;
                                                }
                    
                                            });
                                        }//else sleep
                                    });//sleep
                                }//else heartrate
                            });//heartrate
                        }//else activity
                    });//activity
                }//if
            }//for
        });   
    };


    //exports
    return OauthCallback;
};

















var path = require('path');
var qs = require('qs');
var async = require('async');

module.exports = function OauthCallbackModule(pb) {

    //pb dependencies
    var util          = pb.util;
    var PluginService = pb.PluginService;
    var OauthService  = PluginService.getService('oauthService', 'oauth-pencilblue');

    function OauthCallback() {}
    util.inherits(OauthCallback, pb.BaseController);

    OauthCallback.prototype.render = function(cb) {
        var self = this;
        var vars = this.pathVars;
        var code = this.query.code;
        var user = self.session.authentication.child_user != null ? self.session.authentication.child_user : self.session.authentication.user;
        var dao = new pb.DAO();
        var service = new OauthService(vars.provider);
        // console.log(self);
        service.getToken(code, function(err, result) {
            console.log(result.user_id);
            var serv = new OauthService();
            if (util.isError(err)) {
                self.renderError(err, cb);
            }
            else {
                self.saveTokenWithUserID(user._id,result,cb);
            }
        });

        self.updateFitbitdata(cb);



    };

    OauthCallback.getRoutes = function(cb) {
        var routes = [
            {
                method: 'get',
                path: '/oauth/fitbit/callback',
                auth_required: false,
                content_type: 'text/html'
            }
        ];
        cb(null, routes);
    };

    OauthCallback.prototype.renderError = function(err, cb) {
        cb({
            content_type: 'text/json',
            code: 200,
            content: err.message
        });
    };

    OauthCallback.prototype.saveTokenWithUserID = function(userId , result,cb) {    
        var self = this;
        var post = {};

        post.access_token = result.access_token;
        post.refresh_token = result.refresh_token;
        post.fitbit_userId = result.user_id;
        // post.fitbit_userId = 
        var dao = new pb.DAO();
        dao.loadById(userId,'user',function(err, user){
            if(util.isError(err)) {
               cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, errMsg)
              });
              return;
            }
            pb.DocumentCreator.update(post, user);
            dao.save(user, function(err, result) {
                if(util.isError(err)) {
                   cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, errMsg)
                  });
                  return;
                }
                cb({
                    code:200,
                    content: 'Successfully'
                });
            });
        });

    }

    OauthCallback.prototype.updateFitbitdata = function(cb) {       
        var self = this;  
        var post = {};
        var service = new OauthService();
        var dao = new pb.DAO();
        
        dao.q('user',{},function(err, users){
            for(var user of users){
                if(user.hasOwnProperty('access_token') === true){
                    console.log(user);
                    var user_data = {};
                    var yesterday = service.getYesterday();
                    // console.log(yesterday);
                    user_data.userId = user._id;
                    user_data.username = user.username;

                    var activity_uri = 'https://api.fitbit.com/1/user/' + user.fitbit_userId + '/activities/steps/date/' + yesterday + '/1d.json';
                    service.getInfos(activity_uri,user.access_token, function (err, activityData) {
                        if (util.isError(err)) {
                            self.renderError(err, cb);
                        }
                        else {
                            user_data.fitbit_activityData = JSON.parse(activityData);
                            // console.log(activityData);
                            console.log("==========");
                            console.log(user);
                            var heartrate_uri = 'https://api.fitbit.com/1/user/' + user.fitbit_userId + '/activities/heart/date/' + yesterday + '/1d.json'
                            service.getInfos(heartrate_uri,user.access_token, function (err2, heartrateData) {
                                if (util.isError(err2)) {
                                    self.renderError(err2, cb);
                                }
                                else {
                                    console.log("+++++++++");
                                    console.log(user);
                                    // console.log(heartrateData);
                                    user_data.fitbit_heartrateData = JSON.parse(heartrateData);
                                    // console.log(heartrateData);

                                    var sleep_uri = 'https://api.fitbit.com/1/user/' + user.fitbit_userId + '/sleep/date/'+ yesterday +'.json';
                                    service.getInfos(sleep_uri,user.access_token, function (err3, sleepData) {
                                        if (util.isError(err3)) {
                                            self.renderError(err3, cb);
                                        }else{
                                            // console.log(sleepData);
                                            user_data.sleepData = JSON.parse(sleepData);
                                            
                                            var fitbit = pb.DocumentCreator.create('fitbit_data', user_data);
                                            // console.log(fitbit);
                                            dao.save(fitbit, function(err, result) {
                                                if(util.isError(err)) {
                                                   cb({
                                                    code: 400,
                                                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, errMsg)
                                                  });
                                                  return;
                                                }
                    
                                            });
                                        }//else sleep
                                    });//sleep
                                }//else heartrate
                            });//heartrate
                        }//else activity
                    });//activity
                }//if
            }//for
        });   
    };


    //exports
    return OauthCallback;
};
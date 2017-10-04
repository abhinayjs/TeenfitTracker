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

//dependencies
var async = require('async');
var request = require('simple-oauth2/node_modules/request');
var later = require('later');
var oauth2  = require('simple-oauth2');
var schedule = require('node-schedule');


module.exports = function DataExtractionModule(pb) {

  //pb dependencies
  var util = pb.util;
  var BaseController = pb.BaseController;
  var FormController = pb.FormController;
  var fitbit_credential = {
    clientID : pb.config.fitbit.clientID,
    clientSecret : pb.config.fitbit.clientSecret,
    site : 'https://www.fitbit.com',
    tokenPath : '/oauth2/token',
    authorizationPath : '/oauth2/authorize'
  }
  var errPointer = 0;
  var errData = [];
  /**
  * Creates an READER level user
  */
  function DataExtraction(){}
  util.inherits(DataExtraction, FormController);

  DataExtraction.prototype.render = function(cb) {
      var self = this;
      this.getJSONPostParams(function(err, post) {
          console.log(post.dateRange.start_date + " : " + post.dateRange.end_date);
          var days = self.calDays(post.dateRange.start_date,post.dateRange.end_date) + 1;
          console.log(days);
          var i = 1;
          for(; i <= days; i++){
                var currDate = self.getDate(post.dateRange.start_date,i);
                console.log(currDate);
                // self.sleep(10000);
                self.updateFitbitdata(post.register_children,currDate,cb);
          }

          // cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, "Successful",errData)});
          var cbInterval = setTimeout(cbTimer, days * 5000);
          function cbTimer() {
              cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, "Successful",errData)});
          }
          // setTimeout(100000);
          // cb({content: "Successful"});
          // async.parallel(self.asyncRunTask(post.dateRange.start_date,post.dateRange.end_date,post.register_children,cb));
          // cb({content: "Successful"});
      });//end getJSONPostParam
      
  };//end render

  // DataExtraction.prototype.asyncRunTask = function(start_date,end_date,register_children,cb){
  //       var self = this;
  //       var days = self.calDays(start_date,end_date) + 1;
  //         console.log(days);
  //         var i = 1;
  //         for(; i <= days; i++){
  //               var currDate = self.getDate(start_date,i);
  //               console.log(currDate);
  //               // self.sleep(10000);
  //               self.updateFitbitdata(register_children,currDate,cb);
  //         }
          
  // }

  DataExtraction.prototype.updateFitbitdata = function(users,currDate,cb) { 
        var self = this;  
        var dao = new pb.DAO();
        self.session.authentication.fitbit_pb_userId = [];
        for(var i = 0; i < users.length; i++){
            if(users[i].access_token != null){
                self.session.authentication.fitbit_pb_userId[users[i].fitbit_userId] = users[i]._id;
                self.refreshToken(users[i].refresh_token,users[i]._id, function(err1, result){
                    if(result == null){
                        console.log("wrong1");
                        pb.settings.get('email_settings', function(err, emailSettings) {
                            if (util.isError(err)) {
                                //return self.formError(err.message, returnURL, cb);
                            }
                            else if (!emailSettings) {
                                //return self.formError(self.ls.get('EMAIL_NOT_CONFIGURED'), returnURL, cb);
                            }else{
                                pb.users.sendFitbitError_Email_child(err1,util.cb);
                                pb.users.sendFitbitError_Email_teacher(err1,util.cb);
                                console.log("wrong msg");
                                // console.log(err1)
                                // console.log(users[i]);
                                // var errDataItem = {};
                                // errDataItem.userId = err1;
                                // errDataItem.date = currDate;
                                // errData[errPointer++] = errDataItem;
                                
                            }                              
                            
                        });
                    }else{
                        //console.log(result);
                        console.log("win1");
                        self.sleep(10000);
                        self.saveTokenWithUserID(currDate,result,cb);    
                    }
                    // self.saveTokenWithUserID(result); 
                    
                });
            }//if
        }//for
          
    };



    DataExtraction.prototype.saveTokenWithUserID = function(currDate,result,cb) {    
        var self = this;
        var post = {};
        post.access_token = result.access_token;
        post.refresh_token = result.refresh_token;
        post.fitbit_userId = result.user_id;

        var userId = self.session.authentication.fitbit_pb_userId[post.fitbit_userId];

        // console.log("userID is "+userId);
        // console.log("Fitbit userID is "+post.fitbit_userId);
        var dao = new pb.DAO();
        dao.loadById(userId,'user',function(err, user){
            if(util.isError(err)) {
               cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, errMsg)
              });
              return;
            }
            var userWhere = {
              _id: user._id
            };
            var userUpdate = {
              $set: {
                  access_token: result.access_token,
                  refresh_token: result.refresh_token,
                  fitbit_userId: result.user_id
                }
            };
            var updateOptions = {
              multi: false
            };
            //update new user refresh token and access token
            dao.updateFields('user', userWhere, userUpdate, updateOptions, function(err, result1){});

            var profile_uri = 'https://api.fitbit.com/1/user/' + user.fitbit_userId + '/profile.json';
            self.getInfos(profile_uri, result.access_token, function (err, profile){
                if (util.isError(err)) {
                }
                else {
                    var profileData = JSON.parse(profile);
                    var fitbitProfile = {};
                    console.log("````````````````````````````````````````````````````````````````````````````");
                  console.log(profileData);
                    fitbitProfile.age = profileData.user.age;
                    fitbitProfile.averageDailySteps = profileData.user.averageDailySteps;
                    fitbitProfile.displayName = profileData.user.displayName;
                    fitbitProfile.distanceUnit = profileData.user.distanceUnit;
                    fitbitProfile.encodedId = profileData.user.encodedId;
                    fitbitProfile.fullName = profileData.user.fullName;
                    fitbitProfile.gender = profileData.user.gender;
                    fitbitProfile.height = profileData.user.height;
                    fitbitProfile.locale = profileData.user.locale;
                    fitbitProfile.memberSince = profileData.user.memberSince;
                    fitbitProfile.strideLengthRunning = profileData.user.strideLengthRunning;
                    fitbitProfile.strideLengthWalking = profileData.user.strideLengthWalking;
                    fitbitProfile.timezone = profileData.user.timezone;
                    fitbitProfile.weight = profileData.user.weight;
                    fitbitProfile.weightUnit = profileData.user.weightUnit;
                    fitbitProfile.userid = pb.DAO.getObjectId(userId);
                    fitbitProfile.updateTime = self.getDate(new Date(), 0);;
                    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + fitbitProfile.updateTime);

                    
                    //console.log(fitbitProfile);
                    var opts = {
                        where: {
                            userid: pb.DAO.getObjectId(userId)
                        }
                    };
                    dao.q('userFitbitProfile', opts, function(err, user_profile){

                        if(user_profile[0] != null){
                            pb.DocumentCreator.update(fitbitProfile, user_profile[0]);
                            dao.save(user_profile[0], function(err, result) {
                            });
                        }else{
                            pb.DocumentCreator.create('userFitbitProfile', fitbitProfile);
                            dao.save(fitbitProfile, function(err, result) {
                            });
                        }
                        
                    });
                    
                }//else activity
            });//profile
            
            var option_date = {
                where:{
                  date : self.getDate(currDate,1),
                  userId : pb.DAO.getObjectId(user._id) 
                }
            };
            console.log(option_date);
            dao.q('fitbit_data',option_date, function(err, fitbitDataItem){
                // console.log(fitbitDataItem);
                console.log("test:" + currDate);
                if(fitbitDataItem == null || fitbitDataItem.length == 0){
                    console.log("create");
                    var user_data = {};
                    user_data.userId = user._id;
                    user_data.username = user.username;
                    
                    var activity_uri = 'https://api.fitbit.com/1/user/' + user.fitbit_userId + '/activities/steps/date/' + currDate + '/1d/15min.json';
                    self.getInfos(activity_uri,result.access_token, function (err, activityData) {
                        if (util.isError(err)) {
                            self.renderError(err, cb);
                        }
                        else {
                            user_data.fitbit_activityData = JSON.parse(activityData);
                            var heartrate_uri = 'https://api.fitbit.com/1/user/' + user.fitbit_userId + '/activities/heart/date/' + currDate + '/1d/1min.json';
                            self.getInfos(heartrate_uri,result.access_token, function (err, heartrateData) {
                                if (util.isError(err)) {
                                    self.renderError(err, cb);
                                }else {
                                    // console.log(heartrateData);
                                    user_data.fitbit_heartrateData = JSON.parse(heartrateData);
                                    var sleep_uri = 'https://api.fitbit.com/1/user/' + user.fitbit_userId + '/sleep/date/'+ currDate +'.json';
                                    self.getInfos(sleep_uri,result.access_token, function (err, sleepData){
                                        if (util.isError(err)) {
                                            self.renderError(err, cb);
                                        }else{
                                            // console.log(sleepData);
                                            user_data.fitbit_sleepData = JSON.parse(sleepData);
                                            var theDayAfterCurrDate = self.getDate(currDate,0);
                                            //var activityList_uri = 'https://api.fitbit.com/1/user/' + user.fitbit_userId + '/activities/list.json?afterDate='+theDayAfterCurrDate+'&sort=asc&limit=20&offset=1';
                                            var activityList_uri = 'https://api.fitbit.com/1/user/' + user.fitbit_userId + '/activities/date/'+currDate+'.json';
                                            // console.log(activityList_uri);
                                            self.getInfos(activityList_uri,result.access_token, function (err, activityListData){
                                                if (util.isError(err)) {
                                                    self.renderError(err, cb);
                                                }else{
                                                    // console.log(activityListData);
                                                    user_data.fitbit_activityListData = JSON.parse(activityListData);
                                                    // console.log(JSON.parse(activityListData));
                                                    //nutrition calories
                                                    var nutrition_uri = 'https://api.fitbit.com/1/user/' + user.fitbit_userId + '/foods/log/date/'+ currDate +'.json';
                                                    self.getInfos(nutrition_uri,result.access_token, function (err, nutritionData){
                                                        if (util.isError(err)) {
                                                            self.renderError(err, cb);
                                                        }else{
                                                            // console.log(sleepData);
                                                            user_data.fitbit_nutritionData = JSON.parse(nutritionData);
                                                            user_data.date = currDate;
                                                            
                                                            var fitbit = pb.DocumentCreator.create('fitbit_data', user_data);
                                                            // console.log(fitbit);
                                                            dao.save(fitbit, function(err1, result) {
                                                                if(util.isError(err1)) {
                                                                   cb({
                                                                    code: 400,
                                                                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, errMsg)
                                                                  });

                                                                  return;
                                                                }
                                                                
                                                            });
                                                        }//else nutrition

                                                    });//nutrition
                                                }//else activity list
                                            });//activity list
                                        }//else sleep
                                    });//sleep
                                }//else heartrate
                            });//heartrate
                        }//else activity
                    });//activity          
                }//end if
                else{
                    console.log("update");
                    var user_data = {};
                    user_data.userId = user._id;
                    user_data.username = user.username;
                    
                    var activity_uri = 'https://api.fitbit.com/1/user/' + user.fitbit_userId + '/activities/steps/date/' + currDate + '/1d/15min.json';
                    self.getInfos(activity_uri,result.access_token, function (err, activityData) {
                        if (util.isError(err)) {
                            self.renderError(err, cb);
                        }
                        else {
                            user_data.fitbit_activityData = JSON.parse(activityData);
                            var heartrate_uri = 'https://api.fitbit.com/1/user/' + user.fitbit_userId + '/activities/heart/date/' + currDate + '/1d/1min.json';
                            self.getInfos(heartrate_uri,result.access_token, function (err, heartrateData) {
                                if (util.isError(err)) {
                                    self.renderError(err, cb);
                                }else {
                                    // console.log(heartrateData);
                                    user_data.fitbit_heartrateData = JSON.parse(heartrateData);
                                    var sleep_uri = 'https://api.fitbit.com/1/user/' + user.fitbit_userId + '/sleep/date/'+ currDate +'.json';
                                    self.getInfos(sleep_uri,result.access_token, function (err, sleepData){
                                        if (util.isError(err)) {
                                            self.renderError(err, cb);
                                        }else{
                                            // console.log(sleepData);
                                            user_data.fitbit_sleepData = JSON.parse(sleepData);

                                            var theDayAfterCurrDate = self.getDate(currDate,0);
                                            //var activityList_uri = 'https://api.fitbit.com/1/user/' + user.fitbit_userId + '/activities/list.json?afterDate='+theDayAfterCurrDate+'&sort=asc&limit=20&offset=1';
                                            var activityList_uri = 'https://api.fitbit.com/1/user/' + user.fitbit_userId + '/activities/date/'+currDate+'.json';
                                            self.getInfos(activityList_uri,result.access_token, function (err, activityListData){
                                                if (util.isError(err)) {
                                                    self.renderError(err, cb);
                                                }else{
                                                    // console.log(activityListData);
                                                    user_data.fitbit_activityListData = JSON.parse(activityListData);
                                                    // console.log(JSON.parse(activityListData));

                                                    var nutrition_uri = 'https://api.fitbit.com/1/user/' + user.fitbit_userId + '/foods/log/date/'+ currDate +'.json';
                                                    self.getInfos(nutrition_uri,result.access_token, function (err, nutritionData){
                                                        if (util.isError(err)) {
                                                            self.renderError(err, cb);
                                                        }else{
                                                            // console.log(sleepData);
                                                            user_data.fitbit_nutritionData = JSON.parse(nutritionData);
                                                            user_data.date = currDate;
                                                
                                                            var fitbitWhere = {
                                                              date : self.getDate(currDate,1),
                                                              userId : pb.DAO.getObjectId(user._id)
                                                            };
                                                            var fitbitUpdate = {
                                                              $set: {
                                                                  fitbit_activityData: user_data.fitbit_activityData,
                                                                  fitbit_heartrateData: user_data.fitbit_heartrateData,
                                                                  fitbit_sleepData: user_data.fitbit_sleepData,
                                                                  fitbit_nutritionData: user_data.fitbit_nutritionData,
                                                                  fitbit_activityListData: user_data.fitbit_activityListData
                                                                }
                                                            };
                                                            var fitbitUpdateOptions = {
                                                              multi: false
                                                            };
                                                            dao.updateFields('fitbit_data', fitbitWhere, fitbitUpdate, fitbitUpdateOptions, function(err1, result1){
                                                                // console
                                                                if(util.isError(err1)) {
                                                                   cb({
                                                                    code: 400,
                                                                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, "wrong")
                                                                  });
                                                                  return;
                                                                }
                                                                // return;
                                                    
                                                            });
                                                        }//else nutrition

                                                    });//nutrition
                                                }//else activitylist
                                            });//end activitylist log
                                        }//else sleep
                                    });//sleep
                                }//else heartrate
                            });//heartrate
                        }//else activity
                    });//activity

                }//end else
            });//end dao.q option_date

        });
    };

    DataExtraction.prototype.getInfos = function(uri,token, cb) {
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

    DataExtraction.prototype.refreshToken = function(refresh, userId, cb) {
        var self = this;
        self.credential = fitbit_credential;
        self.oauth = oauth2(self.credential);
        self.oauth.authCode.getToken({
            grant_type : 'refresh_token',
            refresh_token : refresh,
            redirect_uri: pb.config.siteRoot + '/oauth/fitbit/callback'
        }, function(err, result){
            if(result != null){
                cb(err, result);
            }else{
                var err = userId;
                cb(err, result);
            }
            
        });
    };

     DataExtraction.prototype.sleep = function(milliseconds) {
        var start = new Date().getTime();
        for (var i = 0; i < 1e7; i++) {
            if ((new Date().getTime() - start) > milliseconds){
              break;
            }
        }
    };

    DataExtraction.prototype.getDate = function(date,bias) {
      var currDate = new Date(date);
      currDate.setDate(currDate.getDate() + bias);
      var td = currDate,
        month = '' + (td.getMonth() + 1),
        day = '' + td.getDate(),
        year = td.getFullYear();

      if (month.length < 2) month = '0' + month;
      if (day.length < 2) day = '0' + day;

      return [year, month, day].join('-');
    };

    DataExtraction.prototype.compareDates = function(date1, date2){
      var d1 = new Date(date1);
      var d2 = new Date(date2);
      // console.log(d1.getTime());
      // console.log(d2.getTime());
      return d1.getTime() < d2.getTime();
    };

    DataExtraction.prototype.calDays = function(date1, date2){
      var d1 = new Date(date1);
      var d2 = new Date(date2);
      var oneDay = 24*60*60*1000;
      // console.log(d1.getDate());
      // console.log(d2.getDate());
      return Math.round(Math.abs((d1.getTime() - d2.getTime())/(oneDay)));;
    };

  //exports
  return DataExtraction;
};

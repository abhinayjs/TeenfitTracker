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
var oauth2 = require('simple-oauth2');
var schedule = require('node-schedule');
var ObjectID = require('mongodb').ObjectID;
var path = require('path');

module.exports = function SchedulerExecutionModule(pb) {

    //pb dependencies
    var util = pb.util;
    var BaseController = pb.BaseController;
    var FormController = pb.FormController;
    var fitbit_credential = {
        clientID : pb.config.fitbit.clientID,
        clientSecret : pb.config.fitbit.clientSecret,
        site: 'https://www.fitbit.com',
        tokenPath: '/oauth2/token',
        authorizationPath: '/oauth2/authorize'
    }

    var rule = null;
    var times = null;
    var timedSchedule = null;

    var errPointer = 0;
    var errData = [];
    /**
     * Creates an READER level user
     */
    function SchedulerExecution() {}
    util.inherits(SchedulerExecution, FormController);

    SchedulerExecution.prototype.render = function(cb) {
        var self = this;
        this.getJSONPostParams(function(err, post) {

            // console.log(post);
            var schedulerExecutionTime = post.schedulerExecutionTime;
            // console.log(schedulerExecutionTime);
            var hour_min = schedulerExecutionTime.split(":");
            var hh = parseInt(hour_min[0]);
            var mm = parseInt(hour_min[1]);
            console.log("Scheduler Execution Time: " + hh + " : " + mm);
            if (timedSchedule != null) {
                timedSchedule.cancel();
            }
            //for test
            // rule = new schedule.RecurrenceRule();
            // times = [30];
            // rule.second = times;
            // timedSchedule = schedule.scheduleJob(rule, function(){
            //   self.runExecution(cb);
            // });
            //end for test

            // correct
            rule = schedule.scheduleJob({ hour: hh, minute: mm, dayOfWeek: [0, 1, 2, 3, 4, 5, 6] }, function() {
                self.runExecution(cb);
                var cbInterval = setTimeout(cbTimer, 10000);

                function cbTimer() {
                    self.updateActivity(cb);
                }

                var cbInterval1 = setTimeout(cbTimer1, 20000);

                function cbTimer1() {
                    self.updateScore(cb);
                }
            });
            cb({ content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, "Successful", errData) });
        }); //end getJSONPostParam     
    }; //end render

    SchedulerExecution.prototype.runExecution = function(cb) {
        var self = this;
        var yesterday = self.getDate(new Date(), -1);
        var parentUserId = self.session.authentication.user_id;

        pb.users.getRegisterChildrenInUser(parentUserId, function(err, register_children) {
            if (util.isError(err)) {
                return cb(err, null);
            }

            self.updateFitbitdata(register_children, yesterday, cb);

            // var cbInterval = setTimeout(cbTimer, 5000);
            // function cbTimer() {
            //     cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, "Successful",errData)});
            // }

        }); //end getChildrenInUser


    };

    SchedulerExecution.prototype.updateFitbitdata = function(users, currDate, cb) {
        var self = this;
        var dao = new pb.DAO();
        self.session.authentication.fitbit_pb_userId = [];
        for (var i = 0; i < users.length; i++) {
            if (users[i].access_token != null) {
                self.session.authentication.fitbit_pb_userId[users[i].fitbit_userId] = users[i]._id;
                self.refreshToken(users[i].refresh_token, users[i]._id, function(err1, result) {
                    if (result == null) {
                        console.log("wrong1");
                        pb.settings.get('email_settings', function(err, emailSettings) {
                            if (util.isError(err)) {
                                //return self.formError(err.message, returnURL, cb);
                            } else if (!emailSettings) {
                                //return self.formError(self.ls.get('EMAIL_NOT_CONFIGURED'), returnURL, cb);
                            } else {
                                pb.users.sendFitbitError_Email_child(err1, util.cb);
                                pb.users.sendFitbitError_Email_teacher(err1, util.cb);
                                console.log("wrong msg");
                                // console.log(err1)
                                // console.log(users[i]);
                                // var errDataItem = {};
                                // errDataItem.userId = err1;
                                // errDataItem.date = currDate;
                                // errData[errPointer++] = errDataItem;

                            }

                        });
                    } else {
                        //console.log(result);
                        console.log("win1");
                        self.sleep(10000);
                        self.saveTokenWithUserID(currDate, result, cb);
                    }
                    // self.saveTokenWithUserID(result); 

                });
            } //if
        } //for

    };



    SchedulerExecution.prototype.saveTokenWithUserID = function(currDate, result, cb) {
        var self = this;
        var post = {};
        post.access_token = result.access_token;
        post.refresh_token = result.refresh_token;
        post.fitbit_userId = result.user_id;

        var userId = self.session.authentication.fitbit_pb_userId[post.fitbit_userId];

        // console.log("userID is "+userId);
        // console.log("Fitbit userID is "+post.fitbit_userId);
        var dao = new pb.DAO();
        dao.loadById(userId, 'user', function(err, user) {
            if (util.isError(err)) {
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
            dao.updateFields('user', userWhere, userUpdate, updateOptions, function(err, result1) {});

            var profile_uri = 'https://api.fitbit.com/1/user/' + user.fitbit_userId + '/profile.json';

            self.getInfos(profile_uri, result.access_token, function(err, profile) {
                if (util.isError(err)) {} else {
                    var profileData = JSON.parse(profile);
                    var fitbitProfile = {};
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
                    fitbitProfile.updateTime = self.getYesterday();
                    var opts = {
                        where: {
                            userid: userId
                        }
                    };
                    dao.q('userFitbitProfile', opts, function(err, user_profile) {

                        if (user_profile[0] != null) {
                            pb.DocumentCreator.update(fitbitProfile, user_profile[0]);
                            dao.save(user_profile[0], function(err, result) {});
                        } else {
                            pb.DocumentCreator.create('userFitbitProfile', fitbitProfile);
                            dao.save(fitbitProfile, function(err, result) {});
                        }

                    });

                } //else activity
            }); //profile

            var option_date = {
                where: {
                    date: self.getDate(currDate, 1),
                    userId: pb.DAO.getObjectId(user._id)
                }
            };

            dao.q('fitbit_data', option_date, function(err, fitbitDataItem) {
                // console.log(fitbitDataItem);
                console.log("test:" + currDate);
                if (fitbitDataItem == null || fitbitDataItem.length == 0) {
                    console.log("create");
                    var user_data = {};
                    user_data.userId = user._id;
                    user_data.username = user.username;

                    var activity_uri = 'https://api.fitbit.com/1/user/' + user.fitbit_userId + '/activities/steps/date/' + currDate + '/1d/15min.json';
                    self.getInfos(activity_uri, result.access_token, function(err, activityData) {
                        if (util.isError(err)) {
                            self.renderError(err, cb);
                        } else {
                            user_data.fitbit_activityData = JSON.parse(activityData);
                            var heartrate_uri = 'https://api.fitbit.com/1/user/' + user.fitbit_userId + '/activities/heart/date/' + currDate + '/1d/1min.json';
                            self.getInfos(heartrate_uri, result.access_token, function(err, heartrateData) {
                                if (util.isError(err)) {
                                    self.renderError(err, cb);
                                } else {
                                    // console.log(heartrateData);
                                    user_data.fitbit_heartrateData = JSON.parse(heartrateData);
                                    var sleep_uri = 'https://api.fitbit.com/1/user/' + user.fitbit_userId + '/sleep/date/' + currDate + '.json';
                                    self.getInfos(sleep_uri, result.access_token, function(err, sleepData) {
                                        if (util.isError(err)) {
                                            self.renderError(err, cb);
                                        } else {
                                            // console.log(sleepData);
                                            user_data.fitbit_sleepData = JSON.parse(sleepData);
                                            var theDayAfterCurrDate = self.getDate(currDate, 0);
                                            var activityList_uri = 'https://api.fitbit.com/1/user/' + user.fitbit_userId + '/activities/list.json?afterDate=' + theDayAfterCurrDate + '&sort=asc&limit=20&offset=1';
                                            // console.log(activityList_uri);
                                            self.getInfos(activityList_uri, result.access_token, function(err, activityListData) {
                                                if (util.isError(err)) {
                                                    self.renderError(err, cb);
                                                } else {
                                                    // console.log(activityListData);
                                                    user_data.fitbit_activityListData = JSON.parse(activityListData);
                                                    // console.log(JSON.parse(activityListData));
                                                    //nutrition calories
                                                    var nutrition_uri = 'https://api.fitbit.com/1/user/' + user.fitbit_userId + '/foods/log/date/' + currDate + '.json';
                                                    self.getInfos(nutrition_uri, result.access_token, function(err, nutritionData) {
                                                        if (util.isError(err)) {
                                                            self.renderError(err, cb);
                                                        } else {
                                                            // console.log(sleepData);
                                                            user_data.fitbit_nutritionData = JSON.parse(nutritionData);
                                                            user_data.date = currDate;

                                                            var fitbit = pb.DocumentCreator.create('fitbit_data', user_data);
                                                            // console.log(fitbit);
                                                            dao.save(fitbit, function(err1, result) {
                                                                if (util.isError(err1)) {
                                                                    cb({
                                                                        code: 400,
                                                                        content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, errMsg)
                                                                    });

                                                                    return;
                                                                }

                                                            });
                                                        } //else nutrition

                                                    }); //nutrition
                                                } //else activity list
                                            }); //activity list
                                        } //else sleep
                                    }); //sleep
                                } //else heartrate
                            }); //heartrate
                        } //else activity
                    }); //activity          
                } //end if
                else {
                    console.log("update");
                    var user_data = {};
                    user_data.userId = user._id;
                    user_data.username = user.username;

                    var activity_uri = 'https://api.fitbit.com/1/user/' + user.fitbit_userId + '/activities/steps/date/' + currDate + '/1d/15min.json';
                    self.getInfos(activity_uri, result.access_token, function(err, activityData) {
                        if (util.isError(err)) {
                            self.renderError(err, cb);
                        } else {
                            user_data.fitbit_activityData = JSON.parse(activityData);
                            var heartrate_uri = 'https://api.fitbit.com/1/user/' + user.fitbit_userId + '/activities/heart/date/' + currDate + '/1d/1min.json';
                            self.getInfos(heartrate_uri, result.access_token, function(err, heartrateData) {
                                if (util.isError(err)) {
                                    self.renderError(err, cb);
                                } else {
                                    // console.log(heartrateData);
                                    user_data.fitbit_heartrateData = JSON.parse(heartrateData);
                                    var sleep_uri = 'https://api.fitbit.com/1/user/' + user.fitbit_userId + '/sleep/date/' + currDate + '.json';
                                    self.getInfos(sleep_uri, result.access_token, function(err, sleepData) {
                                        if (util.isError(err)) {
                                            self.renderError(err, cb);
                                        } else {
                                            // console.log(sleepData);
                                            user_data.fitbit_sleepData = JSON.parse(sleepData);

                                            var theDayAfterCurrDate = self.getDate(currDate, 0);
                                            var activityList_uri = 'https://api.fitbit.com/1/user/' + user.fitbit_userId + '/activities/list.json?afterDate=' + theDayAfterCurrDate + '&sort=asc&limit=20&offset=1';
                                            // console.log(activityList_uri);
                                            self.getInfos(activityList_uri, result.access_token, function(err, activityListData) {
                                                if (util.isError(err)) {
                                                    self.renderError(err, cb);
                                                } else {
                                                    // console.log(activityListData);
                                                    user_data.fitbit_activityListData = JSON.parse(activityListData);
                                                    // console.log(JSON.parse(activityListData));

                                                    var nutrition_uri = 'https://api.fitbit.com/1/user/' + user.fitbit_userId + '/foods/log/date/' + currDate + '.json';
                                                    self.getInfos(nutrition_uri, result.access_token, function(err, nutritionData) {
                                                        if (util.isError(err)) {
                                                            self.renderError(err, cb);
                                                        } else {
                                                            // console.log(sleepData);
                                                            user_data.fitbit_nutritionData = JSON.parse(nutritionData);
                                                            user_data.date = currDate;

                                                            var fitbitWhere = {
                                                                date: self.getDate(currDate, 1),
                                                                userId: pb.DAO.getObjectId(user._id)
                                                            };
                                                            var fitbitUpdate = {
                                                                $set: {
                                                                    fitbit_activityData: user_data.fitbit_activityData,
                                                                    fitbit_heartrateData: user_data.fitbit_heartrateData,
                                                                    fitbit_sleepData: user_data.fitbit_sleepData,
                                                                    fitbit_nutritionData: user_data.fitbit_nutritionData
                                                                }
                                                            };
                                                            var fitbitUpdateOptions = {
                                                                multi: false
                                                            };
                                                            dao.updateFields('fitbit_data', fitbitWhere, fitbitUpdate, fitbitUpdateOptions, function(err1, result1) {
                                                                // console
                                                                if (util.isError(err1)) {
                                                                    cb({
                                                                        code: 400,
                                                                        content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, "wrong")
                                                                    });
                                                                    return;
                                                                }
                                                                // return;

                                                            });
                                                        } //else nutrition

                                                    }); //nutrition
                                                } //else activitylist
                                            }); //end activitylist log
                                        } //else sleep
                                    }); //sleep
                                } //else heartrate
                            }); //heartrate
                        } //else activity
                    }); //activity

                } //end else
            }); //end dao.q option_date

        });
    };

    SchedulerExecution.prototype.updateActivity = function(cb) {
        console.log("start to update activity");
        var self = this;
        var dao = new pb.DAO();
        var option_user = {
            where: {
                admin: 1
            }
        };
        dao.q("user", option_user, function(err, users) {
            for (var i = 0; i < users.length; i++) {
                self.updateActivityWithUserID(users[i]._id);
            };
        });
    }
    SchedulerExecution.prototype.updateActivityWithUserID = function(userID) {
        var self = this;
        var yesterday = self.getYesterday();
        var dao = new pb.DAO();
        var option_fitbit = {
            where: {
                date: yesterday,
                userId: userID
            }
        };
        dao.q("fitbit_data", option_fitbit, function(err, fitbitData) {
            if (err) {
                return;
            };
            if (fitbitData == null || fitbitData.length == 0) {
                return;
            };
            var METPath = path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'data', 'events.json');
            pb.users.loadJSONFile(METPath, function(err, eventsList) {
                if (util.isError(err)) {
                    return cb(err);
                }
                var option_events = {
                    where: {
                        end_date: { '$regex': yesterday },
                        user_id: userID + ""
                    }
                };
                dao.q("events", option_events, function(err, eventsData) {
                    if (fitbitData[0].fitbit_activityListData) {
                        //遍历当前child的activity in Fitbit
                        for (var j = 0; j < fitbitData[0].fitbit_activityListData.activities.length; j++) {
                            //然后根据当前activity 去json文件中找对应的METS 和 name
                            for (var n = 0; n < eventsList.length; n++) {
                                if (eventsList[n].adult_code) {
                                    // if (fitbitData[0].fitbit_activityListData.activities[j].activityTypeId == eventsList[n].adult_code) {
                                    if (fitbitData[0].fitbit_activityListData.activities[j].activityId == eventsList[n].adult_code) {
                                        //根据json文件中的activity 来比较 child 在pencil blue中的activity
                                        var m = 0;
                                        for (; m < eventsData.length; m++) {
                                            if (eventsList[n].eventName.substring(0, eventsData[m].event_name.length) == eventsData[m].event_name) {
                                                if (fitbitData[0].fitbit_activityListData.activities[j].duration / 60000 >= eventsData[m].durationTime) {
                                                    eventsData[m].durationTime = fitbitData[0].fitbit_activityListData.activities[j].duration / 60000;
                                                    eventsData[m].finished = "true";
                                                    eventsData[m].durationMETS = eventsList[n].METS;
                                                    dao.save(eventsData[m], function(err, events) {});
                                                    break;
                                                };
                                            }
                                        };
                                        if (m == eventsData.length) {
                                            var activity = {};
                                            activity.event_name = eventsList[n].eventName;
                                            activity.user_id = userID + "";
                                            activity.scheduledMETS = 0;
                                            activity.start_date = yesterday + " 00:00"; // no specific time for the start time
                                            activity.end_date = yesterday + " 00:00"; //no specific time for the start time
                                            activity.durationTime = fitbitData[0].fitbit_activityListData.activities[j].duration / 60000;
                                            activity.durationMETS = eventsList[n].METS;
                                            activity.finished = "true";
                                            var activity_save = pb.DocumentCreator.create('events', activity);
                                            dao.save(activity_save, function(err1, result) {});
                                        };
                                    };
                                } else if (eventsList[n].young_code) {
                                    // if (fitbitData[0].fitbit_activityListData.activities[j].activityTypeId == eventsList[n].young_code) {
                                    if (fitbitData[0].fitbit_activityListData.activities[j].activityId == eventsList[n].young_code) {
                                        //根据json文件中的activity 来比较 child 在pencil blue中的activity
                                        var m = 0;
                                        for (; m < eventsData.length; m++) {
                                            if (eventsList[n].eventName.substring(0, eventsData[m].event_name.length) == eventsData[m].durationTime) {
                                                if (fitbitData[0].fitbit_activityListData.activities[j].duration / 60000 >= eventsData[m].durationTime) {
                                                    eventsData[m].durationTime = fitbitData[0].fitbit_activityListData.activities[j].duration / 60000;
                                                    eventsData[m].finished = "true";
                                                    eventsData[m].durationMETS = eventsList[n].METS;
                                                    dao.save(eventsData[m], function(err, events) {});
                                                    break;
                                                };
                                            }
                                        };
                                        if (m == eventsData.length) {
                                            var activity = {};
                                            activity.event_name = eventsList[n].eventName;
                                            activity.user_id = userID + "";
                                            activity.scheduledMETS = 0;
                                            activity.start_date = yesterday + " 00:00"; // no specific time for the start time
                                            activity.end_date = yesterday + " 00:00"; //no specific time for the start time
                                            activity.durationTime = fitbitData[0].fitbit_activityListData.activities[j].duration / 60000;
                                            activity.durationMETS = eventsList[n].METS;
                                            activity.finished = "true";
                                            var activity_save = pb.DocumentCreator.create('events', activity);
                                            dao.save(activity_save, function(err1, result) {});
                                        };
                                    };
                                };
                            }; //end loop for n
                        }; //end loop for j
                    }; // if fitbitData.fitbit_activityListData
                }); //end dao.q events

            }); //end loadJSONFile

        });
    };
    SchedulerExecution.prototype.updateScore = function(cb) {
        console.log("start to update score");
        var self = this;
        var dao = new pb.DAO();
        var option_fitbitProfile = {
            where: {
                updateTime: self.getYesterday()
            }
        };
        console.log(">>>>>>>>>>>>>>>"+self.session.authentication.user);
        dao.q("userFitbitProfile", option_fitbitProfile, function(err, userFitbitProfile) {
            for (var i = 0; i < userFitbitProfile.length; i++) {
              console.log("&&&&&&&&&&&&&&&&&&&&&&&&&:" + userFitbitProfile[i].userid);
                self.saveSocres(userFitbitProfile[i].userid);
            };
        });
        return;
    };

    SchedulerExecution.prototype.saveSocres = function(userId) {
        console.log("SAve Scores");
        var self = this;
        var dao = new pb.DAO();
        var option_fitbitProfile = {
            where: {
                userid: self.getObjectId(userId)
            }
        };
        var children_info = new Array();
        children_info[0] = self.session.authentication.user;
        dao.q("userFitbitProfile", option_fitbitProfile, function(err, userFitbitProfile) {
            children_info[0]._id = userId;
            children_info[0].age = userFitbitProfile[0].age;
            children_info[0]['height'] = userFitbitProfile[0]['height'] / 100;
            children_info[0].weight = userFitbitProfile[0].weight;
            children_info[0].gender = userFitbitProfile[0].gender;
            children_info[0].BMI = (children_info[0].weight) / (children_info[0]['height'] * children_info[0]['height']);
            if (children_info[0].gender == 'MALE') {
                if (children_info[0].BMI < 25) {
                    children_info[0].BEE = 68 - 43.3 * children_info[0].age + 712 * children_info[0]['height'] + 19.2 * children_info[0].weight;
                } else {
                    children_info[0].BEE = 419.9 - 33.5 * children_info[0].age + 418.9 * children_info[0]['height'] + 16.7 * children_info[0].weight;
                }
            } else {
                if (children_info[0].BMI < 25) {
                    children_info[0].BEE = 189 - 17.6 * children_info[0].age + 625 * children_info[0]['height'] + 7.9 * children_info[0].weight;
                } else {
                    children_info[0].BEE = 515.8 - 26.8 * children_info[0].age + 347 * children_info[0]['height'] + 12.4 * children_info[0].weight;
                }
            }
            var yesterdayDate = self.getDate(new Date(), -1) + "";
            var option_events = {
                where: {
                    finished: 'true',
                    end_date: { $regex: ".*" + yesterdayDate + "." },
                    user_id: userId + ""
                }
            };

            dao.q("events", option_events, function(err, eventsData) {
                for (var i = 0; i < children_info.length; i++) {
                    children_info[i].PAL = 0;
                    children_info[i].PA = 0;
                    for (var j = 0; j < eventsData.length; j++) {
                        if (eventsData[j].user_id == userId) {
                            //console.log("temp PAL socre is "+ ((eventsData[j].durationMETS-1)*((1.15/0.9)*eventsData[j].durationTime)/1440) / (children_info[i].BEE / (0.0175 * 1440 * children_info[i]['weight'])));
                            children_info[i].PAL += ((eventsData[j].durationMETS - 1) * ((1.15 / 0.9) * eventsData[j].durationTime) / 1440) / (children_info[i].BEE / (0.0175 * 1440 * children_info[i]['weight']));
                        }
                    };
                    if (children_info[i].PAL != 0) {
                        children_info[i].PAL += 1.1;
                    };
                    if (children_info[i].PAL >= 1.9) {
                        children_info[i].PA = 1.42;
                    } else if (children_info[i].PAL >= 1.6) {
                        children_info[i].PA = 1.26;
                    } else if (children_info[i].PAL >= 1.4) {
                        children_info[i].PA = 1.13;
                    } else if (children_info[i].PAL >= 1) {
                        children_info[i].PA = 1;
                    }
                    if (children_info[i].gender == 'MALE') {
                        if (children_info[i].BMI < 25) {
                            children_info[i].TEE = 88.5 - 61.9 * children_info[i].age + children_info[i].PA * (26.7 * children_info[i].weight + 903 * children_info[i]['height']);
                        } else {
                            children_info[i].TEE = 114 - 50.9 * children_info[i].age + children_info[i].PA * (19.5 * children_info[i].weight + 1161.4 * children_info[i]['height']);
                        }
                    } else {
                        if (children_info[i].BMI < 25) {
                            children_info[i].TEE = 135.3 - 30.8 * children_info[i].age + children_info[i].PA * (10 * children_info[i].weight + 934 * children_info[i]['height']);
                        } else {
                            children_info[i].TEE = 389 - 41.2 * children_info[i].age + children_info[i].PA * (15 * children_info[i].weight + 701.6 * children_info[i]['height']);
                        }
                    }
                };
                var pal_score = {};
                pal_score.user_id = userId;
                pal_score.BEE = children_info[0].BEE.toFixed(2);
                pal_score.PAL = children_info[0].PAL.toFixed(2);
                pal_score.PA = children_info[0].PA.toFixed(2);
                pal_score.TEE = Math.max(children_info[0].TEE, 0).toFixed(2);
                pal_score.activity_coefficient = (pal_score.TEE / pal_score.BEE).toFixed(2);
                pal_score.ipal_daily = 0;
                pal_score.weekly_bonus = 0;
                pal_score.date = self.getYesterday();
                pal_score.ipal_cumulative = 0;
                pal_score.playGame = false;

                if (pal_score.activity_coefficient <= 0) {
                    pal_score.activity_coefficient = 0;
                };
                if (pal_score.activity_coefficient >= 1.4 && pal_score.activity_coefficient < 1.6) {
                    pal_score.ipal_daily += 1;
                } else if (pal_score.activity_coefficient >= 1.6 && pal_score.activity_coefficient <= 1.9) {
                    pal_score.ipal_daily += 2;
                } else if (pal_score.activity_coefficient > 1.9) {
                    pal_score.ipal_daily += 3;
                };
                console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^:" + pal_score.user_id);
                    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^:" + pal_score.BEE);
                    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^:" + pal_score.PAL);
                    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^:" + pal_score.PA);
                    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^:" + pal_score.TEE);
                    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^:" + pal_score.activity_coefficient);
                    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^:" + pal_score.ipal_daily);
                //log in today
                if (pal_score.ipal_daily != 0) {
                    pal_score.ipal_daily += 1;
                    var options_socre = {
                        where: {
                            date: self.getDate(new Date(), -2),
                            user_id: userId
                        }
                    };
                    dao.q("PAL", options_socre, function(err, pal_socre_before_yesterday) {
                        if (err || pal_socre_before_yesterday.length == 0 || pal_socre_before_yesterday[0].ipal_daily <= 0) {
                            pal_score.ipal_cumulative = 0;
                        } else {
                            pal_score.ipal_cumulative = pal_socre_before_yesterday.ipal_cumulative;
                        }

                        var todayDate = new Date();
                        todayDate.setDate(todayDate.getDate() - 1);
                        if (todayDate.getDay() == 0) {
                            var randomInt = Math.floor(Math.random() * (0 - 6 + 1) + 0);
                            pal_score.mysteryStep = randomInt;
                            //pal_score.mysteryStep = false;
                            var option_score_week_ago = {
                                where: {
                                    date: self.getDate(new Date(), -7),
                                    user_id: userId
                                }
                            };
                            dao.q("PAL", option_score_week_ago, function(err, pal_socre_before_week) {
                                if (pal_socre_before_week.length == 0) {
                                    var collection = 'PAL';
                                    pal_score.ipal_cumulative += pal_score.ipal_daily;
                                    if (pal_score.prev_ipal == undefined) {
                                        pal_score.prev_ipal = 0;
                                        if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                            pal_score.prev_ipal = pal_score.ipal_cumulative;
                                            pal_score.playGame = true;
                                        }
                                    } else {

                                        pal_score.ipal_cumulative = 10;
                                        if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                            pal_score.prev_ipal = pal_score.ipal_cumulative;
                                            pal_score.playGame = true;
                                        }
                                    }
                                    var newScore = pb.DocumentCreator.create(collection, pal_score);
                                    dao.save(newScore, function(err, data) {});
                                } else {
                                    pal_score.weekly_bonus = pal_score.ipal_daily - 10 - pal_socre_before_week.ipal_daily;
                                    pal_score.ipal_cumulative += pal_score.weekly_bonus + pal_score.ipal_daily;
                                    if (pal_score.prev_ipal == undefined) {
                                        pal_score.prev_ipal = 0;
                                        if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                            pal_score.prev_ipal = pal_score.ipal_cumulative;
                                            pal_score.playGame = true;
                                        }
                                    } else {
                                        if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                            pal_score.prev_ipal = pal_score.ipal_cumulative;
                                            pal_score.playGame = true;
                                        }
                                    }
                                    var collection = 'PAL';
                                    var newScore = pb.DocumentCreator.create(collection, pal_score);
                                    dao.save(newScore, function(err, data) {});
                                }
                            });
                        } else {
                            pal_score.ipal_cumulative += pal_score.ipal_daily;
                            pal_score.ipal_cumulative = 10;
                            if (pal_score.prev_ipal == undefined) {
                                pal_score.prev_ipal = 0;
                                if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                    pal_score.prev_ipal = pal_score.ipal_cumulative;
                                    pal_score.playGame = true;
                                }
                            } else {
                                if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                    pal_score.prev_ipal = pal_score.ipal_cumulative;
                                    pal_score.playGame = true;
                                }
                            }
                            var collection = 'PAL';
                            var newScore = pb.DocumentCreator.create(collection, pal_score);
                            dao.save(newScore, function(err, data) {});
                        }
                    }); //end for the dao.q PAL
                } else {
                    var options_socre = {
                        where: {
                            date: self.getDate(new Date(), -2),
                            user_id: userId
                        }
                    };
                    dao.q("PAL", options_socre, function(err, pal_socre_before_yesterday) {
                        // ipal in the day before yesterday is  0
                        if (err || pal_socre_before_yesterday.length == 0) {
                            pal_score.ipal_cumulative = 0;
                            if (pal_score.prev_ipal == undefined) {
                                pal_score.prev_ipal = 0;
                                if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                    pal_score.prev_ipal = pal_score.ipal_cumulative;
                                    pal_score.playGame = true;
                                }
                            } else {
                                if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                    pal_score.prev_ipal = pal_score.ipal_cumulative;
                                    pal_score.playGame = true;
                                }
                            }
                            var collection = 'PAL';
                            var newScore = pb.DocumentCreator.create(collection, pal_score);
                            dao.save(newScore, function(err, data) {});
                            return;
                        } else if (pal_socre_before_yesterday[0].ipal_daily <= 0) {
                            pal_score.ipal_cumulative = pal_socre_before_yesterday[0].ipal_cumulative;
                            var options_score_before = {
                                where: {
                                    date: self.getDate(new Date(), -3),
                                    user_id: userId
                                }
                            };
                            dao.q("PAL", options_socre, function(err, pal_socre_before_before_yesterday) {
                                // ipal in the day before before yesterday is  0
                                if (pal_socre_before_before_yesterday.length == 0 || pal_socre_before_before_yesterday[0].ipal_daily <= 0) {
                                    pal_score.ipal_daily--;
                                    var todayDate = new Date();
                                    todayDate.setDate(todayDate.getDate() - 1);
                                    if (todayDate.getDay() == 0) {
                                        var randomInt = Math.floor(Math.random() * (0 - 6 + 1) + 0);
                                        pal_score.mysteryStep = randomInt;
                                        var option_score_week_ago = {
                                            where: {
                                                date: self.getDate(new Date(), -7),
                                                user_id: userId
                                            }
                                        };
                                        dao.q("PAL", option_score_week_ago, function(err, pal_socre_before_week) {
                                            if (pal_socre_before_week.length == 0) {
                                                pal_score.ipal_cumulative += pal_score.ipal_daily;
                                                if (pal_score.prev_ipal == undefined) {
                                                    pal_score.prev_ipal = 0;
                                                    if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                                        pal_score.prev_ipal = pal_score.ipal_cumulative;
                                                        pal_score.playGame = true;
                                                    }
                                                } else {
                                                    if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                                        pal_score.prev_ipal = pal_score.ipal_cumulative;
                                                        pal_score.playGame = true;
                                                    }
                                                }
                                                var collection = 'PAL';
                                                var newScore = pb.DocumentCreator.create(collection, pal_score);
                                                dao.save(newScore, function(err, data) {});
                                            } else {
                                                pal_score.weekly_bonus = pal_score.ipal_daily - 10 - pal_socre_before_week[0].ipal_daily;
                                                pal_score.ipal_cumulative += pal_score.ipal_daily + pal_score.weekly_bonus;
                                                if (pal_score.prev_ipal == undefined) {
                                                    pal_score.prev_ipal = 0;
                                                    if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                                        pal_score.prev_ipal = pal_score.ipal_cumulative;
                                                        pal_score.playGame = true;
                                                    }
                                                } else {
                                                    if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                                        pal_score.prev_ipal = pal_score.ipal_cumulative;
                                                        pal_score.playGame = true;
                                                    }
                                                }
                                                var collection = 'PAL';
                                                var newScore = pb.DocumentCreator.create(collection, pal_score);
                                                dao.save(newScore, function(err, data) {});
                                            }
                                        });
                                        // ipal in the day before before yesterday is not  0
                                    } else {
                                        pal_score.ipal_cumulative += pal_score.ipal_daily;
                                        if (pal_score.prev_ipal == undefined) {
                                            pal_score.prev_ipal = 0;
                                            if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                                pal_score.prev_ipal = pal_score.ipal_cumulative;
                                                pal_score.playGame = true;
                                            }
                                        } else {
                                            if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                                pal_score.prev_ipal = pal_score.ipal_cumulative;
                                                pal_score.playGame = true;
                                            }
                                        }
                                        var collection = 'PAL';
                                        var newScore = pb.DocumentCreator.create(collection, pal_score);
                                        dao.save(newScore, function(err, data) {});
                                    }
                                } else {
                                    pal_score.ipal_cumulative = pal_socre_before_yesterday[0].ipal_cumulative;
                                    var todayDate = new Date();
                                    todayDate.setDate(todayDate.getDate() - 1);
                                    if (todayDate.getDay() == 0) {
                                        var randomInt = Math.floor(Math.random() * (0 - 6 + 1) + 0);
                                        pal_score.mysteryStep = randomInt;
                                        var option_score_week_ago = {
                                            where: {
                                                date: self.getDate(new Date(), -7),
                                                user_id: userId
                                            }
                                        };
                                        dao.q("PAL", option_score_week_ago, function(err, pal_socre_before_week) {
                                            if (pal_socre_before_week.length == 0) {
                                                pal_score.ipal_cumulative += pal_score.ipal_daily;
                                                if (pal_score.prev_ipal == undefined) {
                                                    pal_score.prev_ipal = 0;
                                                    if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                                        pal_score.prev_ipal = pal_score.ipal_cumulative;
                                                        pal_score.playGame = true;
                                                    }
                                                } else {
                                                    if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                                        pal_score.prev_ipal = pal_score.ipal_cumulative;
                                                        pal_score.playGame = true;
                                                    }
                                                }
                                                var collection = 'PAL';
                                                var newScore = pb.DocumentCreator.create(collection, pal_score);
                                                dao.save(newScore, function(err, data) {});
                                            } else {
                                                pal_score.weekly_bonus = pal_score.ipal_daily - 10 - pal_socre_before_week[0].ipal_daily;
                                                pal_score.ipal_cumulative += pal_score.ipal_daily + pal_score.weekly_bonus;
                                                if (pal_score.prev_ipal == undefined) {
                                                    pal_score.prev_ipal = 0;
                                                    if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                                        pal_score.prev_ipal = pal_score.ipal_cumulative;
                                                        pal_score.playGame = true;
                                                    }
                                                } else {
                                                    if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                                        pal_score.prev_ipal = pal_score.ipal_cumulative;
                                                        pal_score.playGame = true;
                                                    }
                                                }
                                                var collection = 'PAL';
                                                var newScore = pb.DocumentCreator.create(collection, pal_score);
                                                dao.save(newScore, function(err, data) {});
                                            }
                                        });
                                    } else {
                                        pal_score.ipal_cumulative += pal_score.ipal_daily;
                                        if (pal_score.prev_ipal == undefined) {
                                            pal_score.prev_ipal = 0;
                                            if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                                pal_score.prev_ipal = pal_score.ipal_cumulative;
                                                pal_score.playGame = true;
                                            }
                                        } else {
                                            if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                                pal_score.prev_ipal = pal_score.ipal_cumulative;
                                                pal_score.playGame = true;
                                            }
                                        }
                                        var collection = 'PAL';
                                        var newScore = pb.DocumentCreator.create(collection, pal_score);
                                        dao.save(newScore, function(err, data) {});
                                    }
                                }
                            }); //end dao.q PAL
                        } else {
                            var todayDate = new Date();
                            todayDate.setDate(todayDate.getDate() - 1);
                            if (todayDate.getDay() == 0) {
                                var randomInt = Math.floor(Math.random() * (0 - 6 + 1) + 0);
                                pal_score.mysteryStep = randomInt;
                                var option_score_week_ago = {
                                    where: {
                                        date: self.getDate(new Date(), -7),
                                        user_id: userId
                                    }
                                };
                                dao.q("PAL", option_score_week_ago, function(err, pal_socre_before_week) {
                                    if (pal_socre_before_week == null) {
                                        pal_score.ipal_cumulative += pal_score.ipal_daily;
                                        if (pal_score.prev_ipal == undefined) {
                                            pal_score.prev_ipal = 0;
                                            if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                                pal_score.prev_ipal = pal_score.ipal_cumulative;
                                                pal_score.playGame = true;
                                            }
                                        } else {
                                            if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                                pal_score.prev_ipal = pal_score.ipal_cumulative;
                                                pal_score.playGame = true;
                                            }
                                        }
                                        var collection = 'PAL';
                                        var newScore = pb.DocumentCreator.create(collection, pal_score);
                                        dao.save(newScore, function(err, data) {});
                                    } else {
                                        pal_score.weekly_bonus = pal_score.ipal_daily - 10 - pal_socre_before_week[0].ipal_daily;
                                        pal_score.ipal_cumulative += pal_score.ipal_daily + pal_score.weekly_bonus;
                                        if (pal_score.prev_ipal == undefined) {
                                            pal_score.prev_ipal = 0;
                                            if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                                pal_score.prev_ipal = pal_score.ipal_cumulative;
                                                pal_score.playGame = true;
                                            }
                                        } else {
                                            if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                                pal_score.prev_ipal = pal_score.ipal_cumulative;
                                                pal_score.playGame = true;
                                            }
                                        }
                                        var collection = 'PAL';
                                        var newScore = pb.DocumentCreator.create(collection, pal_score);
                                        dao.save(newScore, function(err, data) {});
                                    }
                                });
                            } else {
                                pal_score.ipal_cumulative += pal_score.ipal_daily;
                                if (pal_score.prev_ipal == undefined) {
                                    pal_score.prev_ipal = 0;
                                    if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                        pal_score.prev_ipal = pal_score.ipal_cumulative;
                                        pal_score.playGame = true;
                                    }
                                } else {
                                    if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                        pal_score.prev_ipal = pal_score.ipal_cumulative;
                                        pal_score.playGame = true;
                                    }
                                }
                                var collection = 'PAL';
                                var newScore = pb.DocumentCreator.create(collection, pal_score);
                                dao.save(newScore, function(err, data) {});
                            }
                        }
                    }); //end dao.q pal_socre_before_yesterday
                }

            }); //end dao.q events
        });
    };

    SchedulerExecution.prototype.getObjectId = function(oid) {
        try {
            return new ObjectID(oid + '');
        } catch (err) {
            return oid;
        }
    };
    SchedulerExecution.prototype.getYesterday = function() {
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
    SchedulerExecution.prototype.getTheDayBeforeYesterday = function() {
        var today = new Date();
        today.setDate(today.getDate() - 2);
        var yd = today,
            month = '' + (yd.getMonth() + 1),
            day = '' + yd.getDate(),
            year = yd.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;


        return [year, month, day].join('-');
    };

    SchedulerExecution.prototype.getInfos = function(uri, token, cb) {
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
            } else {
                cb(err, result.body);
            }
        });

    };

    SchedulerExecution.prototype.refreshToken = function(refresh, userId, cb) {
        var self = this;
        self.credential = fitbit_credential;
        self.oauth = oauth2(self.credential);
        self.oauth.authCode.getToken({
            grant_type: 'refresh_token',
            refresh_token: refresh,
            redirect_uri: pb.config.siteRoot + '/oauth/fitbit/callback'
        }, function(err, result) {
            if (result != null) {
                cb(err, result);
            } else {
                var err = userId;
                cb(err, result);
            }

        });
    };

    SchedulerExecution.prototype.sleep = function(milliseconds) {
        var start = new Date().getTime();
        for (var i = 0; i < 1e7; i++) {
            if ((new Date().getTime() - start) > milliseconds) {
                break;
            }
        }
    };

    SchedulerExecution.prototype.getDate = function(date, bias) {
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

    SchedulerExecution.prototype.compareDates = function(date1, date2) {
        var d1 = new Date(date1);
        var d2 = new Date(date2);
        // console.log(d1.getTime());
        // console.log(d2.getTime());
        return d1.getTime() < d2.getTime();
    };

    SchedulerExecution.prototype.calDays = function(date1, date2) {
        var d1 = new Date(date1);
        var d2 = new Date(date2);
        var oneDay = 24 * 60 * 60 * 1000;
        // console.log(d1.getDate());
        // console.log(d2.getDate());
        return Math.round(Math.abs((d1.getTime() - d2.getTime()) / (oneDay)));;
    };
    //exports
    return SchedulerExecution;
};

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
var ObjectID = require('mongodb').ObjectID;
var path = require('path');
module.exports = function(pb) {

    //pb dependencies
    var util        = pb.util;
    var UserService = pb.UserService;
    var UrlService  = pb.UrlService;
    var fitbit_credential = {
        clientID : pb.config.fitbit.clientID,
        clientSecret : pb.config.fitbit.clientSecret,
        site : 'https://www.fitbit.com',
        tokenPath : '/oauth2/token',
        authorizationPath : '/oauth2/authorize'
    }
    var rule = null;
    var times = null;
    var timedSchedule = null;
    /**
     * Interface for logged in user to manage account information
     * @class ManageAccount
     * @constructor
     * @extends FormController
     */
    function ManageAccount(){}
    util.inherits(ManageAccount, pb.FormController);
    
    /**
     * Initializes the controller
     * @method init
     * @param {Object} context
     * @param {Function} cb
     */
    ManageAccount.prototype.init = function(context, cb) {
        var self = this;
        var init = function(err) {
            
            /**
             * 
             * @property service
             * @type {TopicService}
             */
            self.service = new UserService(self.getServiceContext());

    //         if(timedSchedule != null){
    //             timedSchedule.cancel();
    //         }
    //         rule = new schedule.RecurrenceRule();
    //          times = [50];
    // 　　     rule.second = times;
    //          timedSchedule = schedule.scheduleJob(rule, function(){
    //             self.updateFitbitdata(cb);
    //         });
            // var tasks = {
            //     fitbit: function(callback) {
            //         self.updateFitbitdata(callback);
            //     }
            // };

            // async.parallel(tasks, function(cb){
            //   self.updateScore(cb);
            // });

             //self.updateFitbitdata(cb);
             //self.updateActivity(cb);
             //self.updateScore(cb);

            cb(err, true);
        };

        ManageAccount.super_.prototype.init.apply(this, [context, init]);

    };

    /**
     *
     * @method render
     * @param {Function}
     */
    ManageAccount.prototype.render = function(cb) {
        var self = this;
        var get  = this.query;
        var dao = new pb.DAO();

        this.gatherData(get.user_id, function(err, data) {
            if(util.isError(err)) {
                return cb(err);
            }
            else if (data.user === null) {
                return self.redirect(UrlService.createSystemUrl('/'), cb);
            }
            
            
            delete data.user.password;
            
            if(self.session.authentication.user.admin == 0){

                if(get.user_id != null){

                    pb.users.getUserByUserID(get.user_id, function(err, child_user){
                        var option_fitbit = {
                            where :{ userId: child_user._id}
                        };
                        dao.q("fitbit_data", option_fitbit, function(err, fitbitData){
                           for (var i = 0; i < fitbitData.length; i++) {
                                if(fitbitData[i]){
                                    console.log(fitbitData[i].fitbit_activityData['activities-steps']);
                                    var stepPoints  = 0;
                                    var sleepPoints = 0;
                                    if(fitbitData[i].fitbit_activityData &&fitbitData[i].fitbit_activityData['activities-steps'] && fitbitData[i].fitbit_activityData['activities-steps'][0] && fitbitData[i].fitbit_activityData['activities-steps'][0]['value']){
                                        stepPoints = (Math.min(15000,fitbitData[i].fitbit_activityData['activities-steps'][0]['value'])-5000)/100;
                                    }
                                    if (fitbitData[i].fitbit_sleepData && fitbitData[i].fitbit_sleepData['summary'] && fitbitData[i].fitbit_sleepData['summary'].totalMinutesAsleep) {
                                        sleepPoints = (fitbitData[i].fitbit_sleepData['summary'].totalMinutesAsleep - 480) / 10;
                                    };
                                     

                                    var hearRatePoints = 0;
                                    var hearRatePoints_FatBurn = 0;
                                    var hearRatePoints_Cardio = 0;
                                    var hearRatePoints_Peak = 0;
                                    for (var k = 1; k < 4; k++) {
                                        if (fitbitData[i].fitbit_heartrateData && fitbitData[i].fitbit_heartrateData['activities-heart'] && fitbitData[i].fitbit_heartrateData['activities-heart'][0] && fitbitData[i].fitbit_heartrateData['activities-heart'][0]['value']  && fitbitData[i].fitbit_heartrateData['activities-heart'][0]['value'].heartRateZones[k].minutes) {
                                            if(k == 1){
                                                hearRatePoints_FatBurn = Math.min(150, fitbitData[i].fitbit_heartrateData['activities-heart'][0]['value'].heartRateZones[k].minutes * 3);
                                            }else if(k == 2){
                                                hearRatePoints_Cardio = fitbitData[i].fitbit_heartrateData['activities-heart'][0]['value'].heartRateZones[k].minutes * 3;
                                            }else{
                                                hearRatePoints_Peak = fitbitData[i].fitbit_heartrateData['activities-heart'][0]['value'].heartRateZones[k].minutes * 3;
                                            }

                                        }
                                    }
                                    hearRatePoints = hearRatePoints_FatBurn + Math.min(300, hearRatePoints_Cardio + hearRatePoints_Peak);

                                    if(stepPoints < 0){
                                        stepPoints = 0;
                                    }
                                    if(sleepPoints < 0){
                                        sleepPoints = 0;
                                    }
                                    fitbitData[i].hearRatePoints = hearRatePoints;
                                    fitbitData[i].stepPoints = stepPoints;
                                    fitbitData[i].sleepPoints = sleepPoints;
                                }else{
                                    fitbitData[i].fitbit_data = 1;
                                }

                                    
                            };

                            self.setPageName(self.ls.get('MANAGE_ACCOUNT'));
                            self.ts.registerLocal('image_title', self.ls.get('USER_PHOTO'));
                            data.daily_reports = fitbitData;
                            data.user = child_user;
                            data.parentUser = self.session.authentication.user;
                            self.ts.registerLocal('angular_objects', new pb.TemplateValue(pb.ClientJs.getAngularObjects(data), false));
                            self.ts.load('user/manage_account', function(err, result) {
                                cb({content: result});
                            });
                        });
                    });
                }
                else{
                    pb.users.getChildrenInUser(self.session.authentication.user_id,function(err, children){
                        if (util.isError(err)) {
                            return cb(err, null);
                        }

                        var register_children_Ids = [];
                        var register_children = [];
                        for(var i = 0,j = 0; i < children.length; i++){
                            if(children[i]['access_token']){
                                register_children[j] = children[i];
                                register_children_Ids[j] = children[i]._id;
                                j++;
                            }

                        }

                        var option_date = {
                            where :{ 
                                userId: {'$in' : register_children_Ids}
                            }
                        };
                        dao.q("fitbit_data",option_date,function(err1,fitbitDataItem){
                            // console.log(fitbitDataItem);

                            for(var i = 0; i < register_children.length; i++){
                                // console.log("child " + i + " : ");
                                // console.log(register_children[i]);
                                var regChild_userId = register_children[i]._id + "";
                                var latestDate = new Date("0001-01-01");
                                
                                for(var j = 0; j < fitbitDataItem.length; j++){
                                    // console.log(register_children[i]._id);
                                    // console.log(fitbitDataItem[j].userId);
                                    if(regChild_userId == fitbitDataItem[j].userId && self.compareTwoDates(latestDate,fitbitDataItem[j].date)){
                                        latestDate = fitbitDataItem[j].date;
                                        // console.log(latestDate);
                                    }
                                }
                                
                                if(new Date(latestDate).getTime() == new Date("0001-01-01").getTime()){
                                    register_children[i].lastDataExtractionDate = "";
                                }else{
                                    register_children[i].lastDataExtractionDate = latestDate;
                                }
                                // register_children[i].lastDataExtractionDate = latestDate;
                                
                            }

                            self.setPageName(self.ls.get('MANAGE_ACCOUNT'));
                            self.ts.registerLocal('image_title', self.ls.get('USER_PHOTO'));

                            data.parentUser = self.session.authentication.user;
                            data.register_children = register_children;
                            self.ts.registerLocal('angular_objects', new pb.TemplateValue(pb.ClientJs.getAngularObjects(data), false));
                            self.ts.load('user/manage_account', function(err, result) {
                                cb({content: result});
                            });

                        });//end q


                    });//end users.getChildren
                }//end else

            }else{
                var opts = {
                        where: {
                            userid: self.session.authentication.user._id
                        }
                    };
                dao.q('userFitbitProfile', opts, function(err, user_profile){

                    data.user = self.session.authentication.user;
                    data.fitbitUser = user_profile[0];
                    self.setPageName(self.ls.get('MANAGE_ACCOUNT'));
                    self.ts.registerLocal('image_title', self.ls.get('USER_PHOTO'));
                    data.parentUser = self.session.authentication.user;
                    self.ts.registerLocal('angular_objects', new pb.TemplateValue(pb.ClientJs.getAngularObjects(data), false));
                    self.ts.load('user/manage_account', function(err, result) {
                        cb({content: result});
                    });
                    
                });
            }//end admin else
        });//end gaterData
    };//end render

    /**
     *
     * @method gatherData
     * @param {Function} cb
     * @return {Array}
     */
    ManageAccount.prototype.gatherData = function(userid,cb) {
        var self = this;
        var tasks = {

            navigation: function(callback) {
                callback(null, self.getNavigation(userid));
            },

            pills: function(callback) {
                callback(null, self.getPills());
            },

            topMenu: function(callback) {
                callback(null, self.getTopMenu());
            },

            tabs: function(callback) {
                callback(null, self.getTabs());
            },
            
            locales: function(callback) {
                callback(null, pb.Localization.getSupportedWithDisplay());
            },
            
            user: function(callback) {
                self.service.get(self.session.authentication.user_id, callback);
            }
        };
        async.parallel(tasks, cb);
    };
    
    /**
     *
     * @method getNavigation
     * @return {Array}
     */
    ManageAccount.prototype.getNavigation = function(userid) {
        var user_name = this.session.authentication.user.username;
        var all_child = new Array();
        if (this.session.authentication.user.admin == 1) {
            all_child[0] = {
                id: 'account',
                title: this.ls.get('ACCOUNT'),
                icon: 'user',
                href: '#',
                dropdown: true,
                children: 
                [
                    {
                        id: 'manage',
                        active: 'active',
                        title: this.ls.get('MANAGE_ACCOUNT'),
                        icon: 'cog',
                        href: '/user/manage_account',
                    },
                    {
                        id: 'change_password',
                        title: this.ls.get('CHANGE_PASSWORD'),
                        icon: 'key',
                        href: '/user/change_password',
                    },
                    {
                        id: 'fitbit_data',
                        title: 'Fitbit Data',
                        icon: 'child',
                        href: '/oauth/fitbit/login'
                    }
                ]
            };
        }else{
            all_child[0] = {
                id: 'account',
                title: this.ls.get('ACCOUNT'),
                icon: 'user',
                href: '#',
                dropdown: true,
                children: 
                [
                    {
                        id: 'manage',
                        active: 'active',
                        title: this.ls.get('MANAGE_ACCOUNT'),
                        icon: 'cog',
                        href: '/user/manage_account',
                    },
                    {
                        id: 'change_password',
                        title: this.ls.get('CHANGE_PASSWORD'),
                        icon: 'key',
                        href: '/user/change_password',
                    },
                    {
                        id: 'add_child',
                        title: this.ls.get('Add a child'),
                        icon: 'plus',
                        // icon: '/img/icons/32/blue-02.png',
                        href: '#'
                    },
                    {
                        id: 'set_scheduler',
                        title: this.ls.get('Set Scheduler'),
                        icon: 'clock-o',
                        // icon: '/img/icons/32/blue-11.png',
                        href: '/user/set_scheduler'
                    }

                ]
            };
        }
        
        if(userid == null){
            all_child[0].active = 'active';
        }
        var i = 1;
        pb.users.getChildren(this.session.authentication.user._id,  function(error, children) {
            if(children != null){
                children.forEach(function(child) {
                all_child[i] = {
                    id: 'account'+i,
                    title: child.child_username,
                    icon: 'user',
                    href :'#',
                    dropdown: true,
                    children:
                    [
                        {
                            id: child.child_username,
                            title: 'Manage account',
                            icon: 'cog',
                            href: '/user/manage_account?user_id=' + child.child_id
                        },
                        {
                            id: 'change_password',
                            title: 'Change password',
                            icon: 'key',
                            href: '/user/change_password?user_id=' + child.child_id
                        }
                    ]
                    
                };

                if(userid != null && child.child_id == userid){
                    all_child[i].active = 'active';
                }
                i = i + 1;
              });
            }

        });

        return all_child;
    };
    
    /**
     *
     * @method getTabs
     * @return {Array}
     */
    ManageAccount.prototype.getTabs = function() {
        var self = this;
        var adminLevel = self.session.authentication.user.admin;
        if(adminLevel == 1){
            return [
                {
                    active: 'active',
                    href: '#account_info',
                    icon: 'cog',
                    title: this.ls.get('ACCOUNT_INFO')
                },
                {
                    href: '#personal_info',
                    icon: 'user',
                    title: this.ls.get('PERSONAL_INFO')
                },
                {
                    href: '#fitbit_info',
                    icon: 'child',
                    title: 'Fitbit Profile'
                }
            ];
        }else{
           return [
                {
                    active: 'active',
                    href: '#account_info',
                    icon: 'cog',
                    title: this.ls.get('ACCOUNT_INFO')
                },
                {
                    href: '#personal_info',
                    icon: 'user',
                    title: this.ls.get('PERSONAL_INFO')
                },
                {
                    href: '#daily_report',
                    icon: 'dashboard',
                    title: 'Fitbit Report',
                    id: 'daily_reports'

                },
                {
                    href: '#calculate_ipal',
                    icon: 'dashboard',
                    title: 'Calculate Ipal'

                }
            ]; 
        }
        
    };
    
    /**
     *
     * @method getPills
     * @return {Array}
     */
    ManageAccount.prototype.getPills = function() {
        var self = this;
        var adminLevel = self.session.authentication.user.admin;
        return [
            {
                name: 'manage_account',
                title: this.ls.get('MANAGE_ACCOUNT'),
                icon: 'refresh',
                href: '/user/manage_account'
            }
        ];
        
    };

    ManageAccount.prototype.getTopMenu = function() {
        return [
            {
                name: 'manage_account',
                title: 'Manage Account',
                icon: 'user',
                // icon: '/img/icons/64/blue-35.png',
                href: '/user/manage_account'
            },
            {
                name: 'manage_friend',
                title: 'Manage Friend',
                icon: 'group',
                href: '/user/manage_friend'
            },
            {
                name: 'manage_calendar',
                title: 'Activity Calendar',
                icon: 'calendar',
                // icon: '/img/icons/64/blue-06.png',
                href: '/user/manage_calendar'
            },
            {
                name: 'manage_daily',
                title: 'Manage Daily Activity',
                icon: 'tasks',
                href: '/user/manage_daily'
            },
            {
                name: 'manage_goals',
                title: 'Manage Goals',
                icon: 'joomla',
                href: '/user/manage_goals'
            },
            //change the chart link to report link
            // {
            //     name: 'activity_tracking',
            //     title: 'Activity Tracking',
            //     icon: 'area-chart',
            //     href: '/user/activity_tracking'
            // },
            {
                name: 'activity_tracking',
                title: 'Activity Tracking',
                icon: 'area-chart',
                href: '/user/activity_report'
            },
            {
                name: 'help_doc',
                title: 'Help Documentation',
                icon: 'question-circle',
                href: '/user/help_doc'
            },
            {
                name: 'log_out',
                title: 'Log out',
                icon: 'power-off',
                href: '/actions/logout'
            }
        ];
    };


    ManageAccount.prototype.updateFitbitdata = function(cb) {       
        var self = this;  
        var dao = new pb.DAO();
        self.session.authentication.fitbit_pb_userId = [];
        dao.q('user',{},function(err, users){
            var j = 0;
            for(var i = 0; i < users.length; i++){
                // var user = users[i];
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
                                    // pb.users.sendFitbitError_Email_child(err1,util.cb);
                                    // pb.users.sendFitbitError_Email_teacher(err1,util.cb);
                                }                              
                                
                            });
                        }else{
                            //console.log(result);
                            console.log("win1");
                            self.sleep(10000);
                            self.saveTokenWithUserID(result);  
                        }
                        
                    });
                }//if
            }//for
        });
        return;
    };

    ManageAccount.prototype.updateScore = function(cb){
        var self = this;
        var dao = new pb.DAO();
        var option_fitbitProfile = {
            where:{
                updateTime : self.getYesterday()
            }
        };
        dao.q("userFitbitProfile", option_fitbitProfile, function(err, userFitbitProfile){
            console.log(userFitbitProfile);
            for (var i = 0; i < userFitbitProfile.length; i++) {
                self.saveSocres(userFitbitProfile[i].userid); 
            };
        });
        return;
    };

    ManageAccount.prototype.updateActivity = function(cb){
        var self = this;
        var dao = new pb.DAO();
        var option_user = {
            where : {
                admin : 1
            }
        };
        dao.q("user", option_user, function(err, users){
            for (var i = 0; i < users.length; i++) {
                self.updateActivityWithUserID(users[i]._id);
            };
        });
    }
    ManageAccount.prototype.updateActivityWithUserID = function(userID) {
        var self = this;
        var yesterday = self.getYesterday();
        var dao = new pb.DAO();
        var option_fitbit = {
            where:{
                date : yesterday,
                userId: userID
            }
        };
        dao.q("fitbit_data", option_fitbit, function(err, fitbitData){
            if (err) {
                return;
            };
            if (fitbitData == null) {
                return;
            };
            var METPath = path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'data', 'events.json');
             pb.users.loadJSONFile(METPath,function(err,eventsList){
                if(util.isError(err)) {
                    return cb(err);
                }
                var option_events = {
                    where:{
                        end_date : {'$regex': yesterday},
                        user_id: userID+""
                    }
                };
                dao.q("events", option_events, function(err, eventsData){
                        if (fitbitData.fitbit_activityListData) {
                            //遍历当前child的activity in Fitbit
                            for (var j = 0; j < fitbitData.fitbit_activityListData.activities.length; j++) {
                                //然后根据当前activity 去json文件中找对应的METS 和 name
                                for (var n = 0; n < eventsList.length; n++) {
                                    if (eventsList[n].adult_code) {
                                        if (fitbitData.fitbit_activityListData.activities[j].activityTypeId == eventsList[n].adult_code) {
                                            //根据json文件中的activity 来比较 child 在pencil blue中的activity
                                            var m = 0;
                                            for (; m < eventsData.length; m++) {
                                                if(eventsList[n].eventName.substring(0,eventsData[m].event_name.length) == eventsData[m].event_name){
                                                    //console.log("cccc");
                                                    if (fitbitData.fitbit_activityListData.activities[j].duration/60000 >= eventsData[m].durationTime) {
                                                        eventsData[m].durationTime = fitbitData.fitbit_activityListData.activities[j].duration/60000;
                                                        eventsData[m].finished = "true";
                                                        eventsData[m].durationMETS = eventsList[n].METS;
                                                        dao.save(eventsData[m], function(err, events){
                                                        });
                                                        break;
                                                    };
                                                }
                                            };
                                            if (m == children_info[i].pencilblueActivity.length) {
                                                var activity = {};
                                                activity.event_name = eventsList[n].eventName;
                                                activity.user_id = userID +"";
                                                activity.scheduledMETS = 0;
                                                activity.start_date = yesterday + " 00:00";// no specific time for the start time
                                                activity.end_date = yesterday + " 00:00";//no specific time for the start time
                                                activity.durationTime = fitbitData.fitbit_activityListData.activities[j].duration/60000;
                                                activity.durationMETS = eventsList[n].METS;
                                                activity.finished = "true";
                                                var activity_save = pb.DocumentCreator.create('events', activity);
                                                dao.save(activity_save, function(err1, result) {});
                                            };
                                        };
                                    }else if (eventsList[n].young_code) {
                                        if (children_info[i].fitbit_data.fitbit_activityListData.activities[j].activityTypeId == eventsList[n].young_code) {
                                            //根据json文件中的activity 来比较 child 在pencil blue中的activity
                                            var m = 0;
                                            for (; m < eventsData.length; m++) {
                                                if(eventsList[n].eventName.substring(0,eventsData[m].event_name.length) == eventsData[m].durationTime){
                                                    if (children_info[i].fitbit_data.fitbit_activityListData.activities[j].duration/60000 >= eventsData[m].durationTime) {
                                                        eventsData[m].durationTime = fitbitData.fitbit_activityListData.activities[j].duration/60000;
                                                        eventsData[m].finished = "true";
                                                        eventsData[m].durationMETS = eventsList[n].METS;
                                                        dao.save(eventsData[m], function(err, events){
                                                        });
                                                        break;
                                                    };
                                                }
                                            };
                                            if (m == children_info[i].pencilblueActivity.length) {
                                                var activity = {};
                                                activity.event_name = eventsList[n].eventName;
                                                activity.user_id = userID +"";
                                                activity.scheduledMETS = 0;
                                                activity.start_date = yesterday + " 00:00";// no specific time for the start time
                                                activity.end_date = yesterday + " 00:00";//no specific time for the start time
                                                activity.durationTime = fitbitData.fitbit_activityListData.activities[j].duration/60000;
                                                activity.durationMETS = eventsList[n].METS;
                                                activity.finished = "true";
                                                var activity_save = pb.DocumentCreator.create('events', activity);
                                                dao.save(activity_save, function(err1, result) {});
                                            };
                                        };
                                    };
                                };//end loop for n
                            };//end loop for j
                        };// if fitbitData.fitbit_activityListData
                });//end dao.q events

             });//end loadJSONFile

        });
    };


    ManageAccount.prototype.saveTokenWithUserID = function(result) {    
        var self = this;
        var post = {};

        post.access_token = result.access_token;
        post.refresh_token = result.refresh_token;
        post.fitbit_userId = result.user_id;

        var userId = self.session.authentication.fitbit_pb_userId[post.fitbit_userId];
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
            var user_data = {};
            var yesterday = self.getYesterday();
            var theDayBeforeYesterday = self.getTheDayBeforeYesterday();

            user_data.userId = user._id;
            user_data.username = user.username;

            var profile_uri = 'https://api.fitbit.com/1/user/' + user.fitbit_userId + '/profile.json';

            self.getInfos(profile_uri, result.access_token, function (err, profile){

                if (util.isError(err)) {
                }
                else {
                    var profileData = JSON.parse(profile);
                    //console.log(profileData);
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
                    fitbitProfile.userid = userId;
                    fitbitProfile.updateTime = self.getYesterday();
                    var opts = {
                        where: {
                            userid: userId
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

            var activity_uri = 'https://api.fitbit.com/1/user/' + user.fitbit_userId + '/activities/steps/date/' + yesterday + '/1d/15min.json';
            self.getInfos(activity_uri,result.access_token, function (err, activityData) {
                if (util.isError(err)) {
                    self.renderError(err, cb);
                }
                else {
                    user_data.fitbit_activityData = JSON.parse(activityData);
                    user_data.date = yesterday;

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
                }//else activity
            });//activity

            var heartrate_uri = 'https://api.fitbit.com/1/user/' + user.fitbit_userId + '/activities/heart/date/' + yesterday + '/1d/1min.json';
            self.getInfos(heartrate_uri,result.access_token, function (err, heartrateData) {
                if (util.isError(err)) {
                    self.renderError(err, cb);
                }else {
                    // console.log(heartrateData);
                    user_data.fitbit_heartrateData = JSON.parse(heartrateData);
                    user_data.date = yesterday;

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
                }//else heartrate
            });//heartrate
            var sleep_uri = 'https://api.fitbit.com/1/user/' + user.fitbit_userId + '/sleep/date/'+ yesterday +'.json';
            self.getInfos(sleep_uri,result.access_token, function (err, sleepData){
                if (util.isError(err)) {
                    self.renderError(err, cb);
                }else{
                    user_data.fitbit_sleepData = JSON.parse(sleepData);
                    user_data.date = yesterday;
                    
                    var fitbit = pb.DocumentCreator.create('fitbit_data', user_data);
                    dao.save(fitbit, function(err1, result) {
                        if(util.isError(err1)) {
                           cb({
                            code: 400,
                            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, errMsg)
                          });
                          return;
                        }

                    });
                }//else sleep
            });//sleep

            var activityList_uri = 'https://api.fitbit.com/1/user/' + user.fitbit_userId + '/activities/list.json?afterDate='+theDayBeforeYesterday+'&sort=asc&limit=20&offset=1';
            self.getInfos(activityList_uri,result.access_token, function (err, activityListData){
                if (util.isError(err)) {
                    self.renderError(err, cb);
                }else{
                    // console.log(activityListData);
                    user_data.fitbit_activityListData = JSON.parse(activityListData);
                    //console.log(JSON.parse(activityListData));
                    user_data.date = yesterday;
                    
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
                }//else activity list
            });//activity list

            //nutrition calories
            var nutrition_uri = 'https://api.fitbit.com/1/user/' + user.fitbit_userId + '/foods/log/date/'+ yesterday +'.json';
            self.getInfos(nutrition_uri,result.access_token, function (err, nutritionData){
                if (util.isError(err)) {
                    self.renderError(err, cb);
                }else{
                    // console.log(sleepData);
                    user_data.fitbit_nutritionData = JSON.parse(nutritionData);
                    user_data.date = yesterday;
                    
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

        });
    };

    ManageAccount.prototype.saveSocres = function(userId){
        //var userId = result.user_id;
        var self = this;
        var dao = new pb.DAO();
        // console.log(result);
        // console.log(self.session.authentication.fitbit_pb_userId);
        // var userId = self.session.authentication.fitbit_pb_userId[result.user_id];
        console.log("jdfjaksdjfakl");
         console.log(userId);
        var option_fitbitProfile = {
            where:{
                userid : self.getObjectId(userId)
            }
        };
        var children_info = new Array();
            children_info[0] = self.session.authentication.user;
            dao.q("userFitbitProfile", option_fitbitProfile, function(err, userFitbitProfile){
                children_info[0].age = userFitbitProfile[0].age;
                children_info[0]['height'] = userFitbitProfile[0]['height'] / 100;
                children_info[0].weight = userFitbitProfile[0].weight;
                children_info[0].gender = userFitbitProfile[0].gender;
                children_info[0].BMI = (children_info[0].weight) / (children_info[0]['height'] * children_info[0]['height']);
                if(children_info[0].gender == 'MALE'){
                    if(children_info[0].BMI < 25){
                        children_info[0].BEE = 68 - 43.3*children_info[0].age + 712*children_info[0]['height'] + 19.2*children_info[0].weight;
                    }else{
                        children_info[0].BEE = 419.9 - 33.5*children_info[0].age + 418.9*children_info[0]['height'] + 16.7*children_info[0].weight;
                    }
                }else{
                    if(children_info[0].BMI < 25){
                        children_info[0].BEE = 189 - 17.6*children_info[0].age + 625*children_info[0]['height'] + 7.9*children_info[0].weight;
                    }else{
                        children_info[0].BEE = 515.8- 26.8*children_info[0].age + 347*children_info[0]['height'] + 12.4*children_info[0].weight;
                    }
                }
                var yesterdayDate = self.getDate(-1);
                var option_events = {
                        where:{
                            finished : 'true',
                            end_date : {'$regex': yesterdayDate},
                            user_id: userId
                        }
                    };
                    dao.q("events", option_events, function(err, eventsData){
                        for (var i = 0; i < children_info.length; i++) {
                            children_info[i].PAL = 0;
                            children_info[i].PA = 0;
                            for (var j = 0; j < eventsData.length; j++) {
                                if(eventsData[j].user_id == children_info[i]._id+""){
                                    children_info[i].PAL += ((eventsData[j].durationMETS-1)*((1.15/0.9)*eventsData[j].durationTime)/1440) / (children_info[i].BEE / (0.0175 * 1440 * children_info[i]['weight']));
                                }
                            };
                            if (children_info[i].PAL != 0) {
                                children_info[i].PAL += 1.1;
                            };
                            if (children_info[i].PAL >= 1.9 ) {
                                children_info[i].PA = 1.42;
                            }else if(children_info[i].PAL >= 1.6){
                                children_info[i].PA = 1.26;
                            }else if(children_info[i].PAL >= 1.4){
                                children_info[i].PA = 1.13;
                            }else if(children_info[i].PAL >= 1){
                                children_info[i].PA = 1;
                            }
                            if(children_info[i].gender == 'MALE'){
                                if(children_info[i].BMI < 25){
                                    children_info[i].TEE = 88.5 - 61.9*children_info[i].age + children_info[i].PA * (26.7 * children_info[i].weight + 903 * children_info[i]['height']);
                                }else{
                                    children_info[i].TEE = 114 - 50.9*children_info[i].age + children_info[i].PA * (19.5 * children_info[i].weight + 1161.4 * children_info[i]['height']);
                                }
                            }else{
                                if(children_info[i].BMI < 25){
                                    children_info[i].TEE = 135.3 - 30.8*children_info[i].age + children_info[i].PA * (10 * children_info[i].weight + 934 * children_info[i]['height']);
                                }else{
                                    children_info[i].TEE = 389 - 41.2*children_info[i].age + children_info[i].PA * (15 * children_info[i].weight + 701.6 * children_info[i]['height']);
                                }
                            }
                        };
                        pal_score.user_id = userId;
                        pal_score.BEE = children_info[0].BEE;
                        pal_score.PAL = children_info[0].PAL;
                        pal_score.PA = children_info[0].PA;
                        pal_score.TEE = Math.max(children_info[0].TEE, 0);
                        pal_score.activity_coefficient = pal_score.TEE / pal_score.BEE;
                        pal_score.ipal_daily = 0;
                        pal_score.weekly_bonus = 0;
                        pal_score.date = self.getYesterday();
                        pal_score.ipal_cumulative = 0;
                        if (pal_score.activity_coefficient <= 0) {
                            pal_score.activity_coefficient = 0;
                        };
                        if (pal_score.activity_coefficient >= 1.4 && pal_score.activity_coefficient < 1.6) {
                            pal_score.ipal_daily += 1;
                        }else if (pal_score.activity_coefficient >= 1.6 && pal_score.activity_coefficient <= 1.9) {
                            pal_score.ipal_daily += 2;
                        }else if (pal_score.activity_coefficient > 1.9) {
                            pal_score.ipal_daily += 3;
                        };
                        //log in today
                        if (pal_score.ipal_daily != 0) {
                            pal_score.ipal_daily += 1;
                            var options_socre = {
                                 where:{
                                    date : self.getDate(-2),
                                    user_id: userId
                                }
                            };
                            dao.q("PAL", options_socre, function(err, pal_socre_before_yesterday){
                                if (err || pal_socre_before_yesterday.length == 0 || pal_socre_before_yesterday[0].ipal_daily <= 0) {
                                    pal_score.ipal_cumulative = 0;
                                }else{
                                    pal_score.ipal_cumulative = pal_socre_before_yesterday.ipal_cumulative;
                                }
                                var todayDate = new Date();
                                todayDate.setDate(todayDate.getDate()-1);
                                if (todayDate.getDay() == 0) {
                                    var option_score_week_ago = {
                                        where:{
                                            date : self.getDate(-7),
                                            user_id: userId
                                        }
                                    };
                                    dao.q("PAL", option_score_week_ago, function(err, pal_socre_before_week){
                                        if (pal_socre_before_week.length == 0) {
                                            var collection = 'PAL';
                                            pal_score.ipal_cumulative += pal_score.ipal_daily;
                                            var newScore = pb.DocumentCreator.create(collection, pal_score);
                                            dao.save(newScore, function(err, data){}); 
                                        }else{
                                            pal_score.weekly_bonus = pal_score.ipal_daily - 10 - pal_socre_before_week.ipal_daily;
                                            pal_score.ipal_cumulative += pal_score.weekly_bonus + pal_score.ipal_daily;
                                            var collection = 'PAL';
                                            var newScore = pb.DocumentCreator.create(collection, pal_score);
                                            dao.save(newScore, function(err, data){}); 
                                        }
                                    });
                                }else{
                                    pal_score.ipal_cumulative += pal_score.ipal_daily;
                                    var collection = 'PAL';
                                    var newScore = pb.DocumentCreator.create(collection, pal_score);
                                    dao.save(newScore, function(err, data){});
                                }
                            });//end for the dao.q PAL
                        }else{
                            var options_socre = {
                                 where:{
                                    date : self.getDate(-2),
                                    user_id: userId
                                }
                            };
                            dao.q("PAL", options_socre, function(err, pal_socre_before_yesterday){
                                // ipal in the day before yesterday is  0
                                if (err || pal_socre_before_yesterday.length == 0) {
                                    pal_score.ipal_cumulative = 0;
                                    var collection = 'PAL';
                                    var newScore = pb.DocumentCreator.create(collection, pal_score);
                                    dao.save(newScore, function(err, data){});
                                    return;
                                }else if (pal_socre_before_yesterday[0].ipal_daily <= 0) {
                                    pal_score.ipal_cumulative = pal_socre_before_yesterday[0].ipal_cumulative;
                                    var options_score_before = {
                                        where:{
                                            date : self.getDate(-3),
                                            user_id: userId
                                        }
                                    };
                                    dao.q("PAL", options_socre, function(err, pal_socre_before_before_yesterday){
                                        // ipal in the day before before yesterday is  0
                                        if (pal_socre_before_before_yesterday.length == 0 || pal_socre_before_before_yesterday[0].ipal_daily <= 0) {
                                            pal_score.ipal_daily--;
                                            var todayDate = new Date();
                                            todayDate.setDate(todayDate.getDate()-1);
                                            if (todayDate.getDay() == 0) {
                                                var option_score_week_ago = {
                                                    where:{
                                                        date : self.getDate(-7),
                                                        user_id: userId
                                                    }
                                                };
                                                dao.q("PAL", option_score_week_ago, function(err, pal_socre_before_week){
                                                    if (pal_socre_before_week.length == 0) {
                                                        pal_score.ipal_cumulative += pal_score.ipal_daily;
                                                        var collection = 'PAL';
                                                        var newScore = pb.DocumentCreator.create(collection, pal_score);
                                                        dao.save(newScore, function(err, data){}); 
                                                    }else{
                                                        pal_score.weekly_bonus = pal_score.ipal_daily - 10 - pal_socre_before_week[0].ipal_daily;
                                                        pal_score.ipal_cumulative += pal_score.ipal_daily +  pal_score.weekly_bonus;
                                                        var collection = 'PAL';
                                                        var newScore = pb.DocumentCreator.create(collection, pal_score);
                                                        dao.save(newScore, function(err, data){}); 
                                                    }
                                                });
                                                // ipal in the day before before yesterday is not  0
                                            }else{
                                                pal_score.ipal_cumulative += pal_score.ipal_daily;
                                                var collection = 'PAL';
                                                var newScore = pb.DocumentCreator.create(collection, pal_score);
                                                dao.save(newScore, function(err, data){}); 
                                            }
                                        }else{
                                            pal_score.ipal_cumulative = pal_socre_before_yesterday[0].ipal_cumulative;
                                            var todayDate = new Date();
                                            todayDate.setDate(todayDate.getDate()-1);
                                            if (todayDate.getDay() == 0) {
                                                var option_score_week_ago = {
                                                    where:{
                                                        date : self.getDate(-7),
                                                        user_id: userId
                                                    }
                                                };
                                                dao.q("PAL", option_score_week_ago, function(err, pal_socre_before_week){
                                                    if (pal_socre_before_week.length == 0) {
                                                        pal_score.ipal_cumulative += pal_score.ipal_daily;
                                                        var collection = 'PAL';
                                                        var newScore = pb.DocumentCreator.create(collection, pal_score);
                                                        dao.save(newScore, function(err, data){});
                                                    }else{
                                                        pal_score.weekly_bonus = pal_score.ipal_daily - 10 - pal_socre_before_week[0].ipal_daily;
                                                        pal_score.ipal_cumulative += pal_score.ipal_daily +  pal_score.weekly_bonus;
                                                        var collection = 'PAL';
                                                        var newScore = pb.DocumentCreator.create(collection, pal_score);
                                                        dao.save(newScore, function(err, data){}); 
                                                    }
                                                });
                                            }else{
                                                pal_score.ipal_cumulative += pal_score.ipal_daily;
                                                var collection = 'PAL';
                                                var newScore = pb.DocumentCreator.create(collection, pal_score);
                                                dao.save(newScore, function(err, data){});
                                            }
                                        }
                                    });//end dao.q PAL
                                }else{
                                    // ipal in the day before yesterday is not 0
                                    var todayDate = new Date();
                                    todayDate.setDate(todayDate.getDate()-1);
                                    if (todayDate.getDay() == 0) {
                                        var option_score_week_ago = {
                                            where:{
                                                date : self.getDate(-7),
                                                user_id: userId
                                            }
                                        };
                                        dao.q("PAL", option_score_week_ago, function(err, pal_socre_before_week){
                                            if (pal_socre_before_week == null) {
                                                pal_score.ipal_cumulative += pal_score.ipal_daily;
                                                var collection = 'PAL';
                                                var newScore = pb.DocumentCreator.create(collection, pal_score);
                                                dao.save(newScore, function(err, data){}); 
                                            }else{
                                                pal_score.weekly_bonus = pal_score.ipal_daily - 10 - pal_socre_before_week[0].ipal_daily;
                                                pal_score.ipal_cumulative += pal_score.ipal_daily +  pal_score.weekly_bonus;
                                                var collection = 'PAL';
                                                var newScore = pb.DocumentCreator.create(collection, pal_score);
                                                dao.save(newScore, function(err, data){}); 
                                            }
                                        });
                                    }else{
                                        pal_score.ipal_cumulative += pal_score.ipal_daily;
                                        var collection = 'PAL';
                                        var newScore = pb.DocumentCreator.create(collection, pal_score);
                                        dao.save(newScore, function(err, data){});
                                    }
                                }
                            });//end dao.q pal_socre_before_yesterday
                        }
                        
                    });//end dao.q events
            });
    };

    ManageAccount.prototype.getInfos = function(uri,token, cb) {
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

    ManageAccount.prototype.getYesterday = function(){
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
    ManageAccount.prototype.getTheDayBeforeYesterday = function(){
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

    ManageAccount.prototype.refreshToken = function(refresh, userId, cb) {
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

     ManageAccount.prototype.sleep = function(milliseconds) {
        var start = new Date().getTime();
        for (var i = 0; i < 1e7; i++) {
            if ((new Date().getTime() - start) > milliseconds){
              break;
            }
        }
    };
    ManageAccount.prototype.getDate = function(bias) {
          var currDate = new Date();
          currDate.setDate(currDate.getDate() + bias);
          var td = currDate,
            month = '' + (td.getMonth() + 1),
            day = '' + td.getDate(),
            year = td.getFullYear();

          if (month.length < 2) month = '0' + month;
          if (day.length < 2) day = '0' + day;
          return [year, month, day].join('-');
    };
    ManageAccount.prototype.getObjectId = function(oid) {
        try {
           return new ObjectID(oid + '');
        }
        catch(err) {
            return oid;
        }
    };

    ManageAccount.prototype.compareTwoDates = function(startOn, nextOn){
        var so = new Date(startOn), no = new Date(nextOn);
          
        return so.getTime() <= no.getTime();
    };
    //exports
    return ManageAccount;
};

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
var path = require('path');
var ObjectID = require('mongodb').ObjectID;
module.exports = function(pb) {

    //pb dependencies
    var util        = pb.util;
    var UserService = pb.UserService;
    var UrlService  = pb.UrlService;

    /**
     * Interface for logged in user to manage account information
     * @class ActivityReport
     * @constructor
     * @extends FormController
     */
    function ActivityReport(){}
    util.inherits(ActivityReport, pb.FormController);
    
    /**
     * Initializes the controller
     * @method init
     * @param {Object} context
     * @param {Function} cb
     */
    ActivityReport.prototype.init = function(context, cb) {
        var self = this;
        var init = function(err) {
            
            /**
             * 
             * @property service
             * @type {TopicService}
             */
            self.service = new UserService(self.getServiceContext());
                
            cb(err, true);
        };
        ActivityReport.super_.prototype.init.apply(this, [context, init]);
    };

    /**
     *
     * @method render
     * @param {Function}
     */
     ActivityReport.prototype.render = function(cb) {
        var self = this;
        var dao = new pb.DAO();

        this.gatherData(function(err, data) {
            
            if(util.isError(err)) {
                return cb(err);
            }
            else if (data.user === null) {
                return self.redirect(UrlService.createSystemUrl('/user/login'), cb);
            }
            delete data.user.password;
            
            var user_id = self.session.authentication.user._id+'';

            var opts = {
                where: {
                    parent_id : user_id
                }
            };
            if (self.session.authentication.user.admin == 1) {
                delete opts.where.parent_id;
                opts.where.child_id = user_id;
            };
            dao.q("member", opts, function(err, members){
                var childIDs = new Array();
                var newIDs = new Array();
                for (var i = members.length - 1; i >= 0; i--) {
                    childIDs[i] = self.getObjectId(members[i].child_id);
                    newIDs[i] = members[i].child_id;
                };
                var option = {
                    where:{
                        _id : { '$in': childIDs}
                    }
                };
                dao.q("user", option, function(err, children){
                    var children_info = [];
                    for (var i = children.length - 1; i >= 0; i--) {
                        children_info[i] = children[i];
                    };
                    var todayDate = self.getDate(0);
                    var oneWeekAgo = self.getDate(-8);
                    var yesterdayDate = self.getDate(-1);
                    var option_fitbit = {
                        where:{
                            date : {$gt : oneWeekAgo, $lt : todayDate},
                            userId: { '$in': childIDs}
                        }
                    };
                    var golas_option = {
                        where:{
                            user_id : {'$in': newIDs}
                        }
                    };
                    dao.q("goals", golas_option, function(err, goalsData){
                        for (var i = 0; i < children_info.length; i++) {
                            for (var j = 0; j < goalsData.length; j++) {
                                if (children_info[i]._id+"" == goalsData[j].user_id) {
                                    children_info[i][goalsData[j].type+"_require"] = goalsData[j].goal;
                                };
                            };
                        };

                        dao.q("fitbit_data", option_fitbit, function(err, fitbitData){
                            for (var i = 0; i < children_info.length; i++) {
                                for (var j = 0; j < fitbitData.length; j++) {
                                    if(fitbitData[j].userId == children_info[i]._id+"" && fitbitData[j].date == yesterdayDate){
                                        children_info[i].fitbit_data = fitbitData[j];
                                        break;
                                    }
                                };
                            };
                            for (var i = 0; i < children_info.length; i++) {
                                // children_info[i].Sleep_finish = 0;
                                // children_info[i].HR_finish = 0;
                                children_info[i].Steps_finish = 0;
                                if(children_info[i].fitbit_data){
                                    //console.log(children_info[i].fitbit_data);
                                    var stepPoints = (Math.min(15000,children_info[i].fitbit_data.fitbit_activityData['activities-steps'][0]['value'])-5000)/100;
                                    if (children_info[i].Steps_require) {
                                        if (children_info[i].fitbit_data.fitbit_activityData['activities-steps'][0]['value'] - children_info[i].Steps_require >= 0) {
                                            children_info[i].Steps_finish = 1;
                                        };
                                    };
                                    var sleepPoints = (children_info[i].fitbit_data.fitbit_sleepData['summary'].totalMinutesAsleep - 480) / 10;

                                    var hearRatePoints = 0;
                                    var hearRatePoints_FatBurn = 0;
                                    var hearRatePoints_Cardio = 0;
                                    var hearRatePoints_Peak = 0;
                                    for (var k = 1; k < 4; k++) {
                                        if (children_info[i].fitbit_data.fitbit_heartrateData['activities-heart'][0]['value'].heartRateZones[k].minutes) {
                                            if(k == 1){
                                                hearRatePoints_FatBurn = Math.min(150, children_info[i].fitbit_data.fitbit_heartrateData['activities-heart'][0]['value'].heartRateZones[k].minutes * 3);
                                            }else if(k == 2){
                                                hearRatePoints_Cardio = children_info[i].fitbit_data.fitbit_heartrateData['activities-heart'][0]['value'].heartRateZones[k].minutes * 3;
                                            }else{
                                                hearRatePoints_Peak = children_info[i].fitbit_data.fitbit_heartrateData['activities-heart'][0]['value'].heartRateZones[k].minutes * 3;
                                            }
                                        };
                                    };
                                    hearRatePoints = hearRatePoints_FatBurn + Math.min(300, hearRatePoints_Cardio + hearRatePoints_Peak);

                                    if(stepPoints < 0){
                                        stepPoints = 0;
                                    }
                                    if(sleepPoints < 0){
                                        sleepPoints = 0;
                                    }
                                    children_info[i].hearRatePoints = hearRatePoints;
                                    children_info[i].stepPoints = stepPoints;
                                    children_info[i].sleepPoints = sleepPoints;
                                    //console.log(children_info[i].fitbit_data.fitbit_activityListData.activities);
                                }else{
                                    children_info[i].fitbit_data = 1;
                                }
                                
                            };

                            var option_events = {
                                
                            }

                            //weekly
                            var fitbit_data = [];
                            for (var i = fitbitData.length - 1, j = 0; i >= 0; i--) {
                                fitbit_data[j] = fitbitData[i];
                                fitbit_data[j].fitbit = 0;
                                j++;
                                
                            };

                            data.children = children;
                            data.fitbit_data = fitbit_data;
                            // console.log(fitbit_data);
                            //weekly
                            var METPath = path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'data', 'events.json');
                             pb.users.loadJSONFile(METPath,function(err,eventsList){
                                if(util.isError(err)) {
                                    return cb(err);
                                }
                                var option_events = {
                                    where:{
                                        end_date : {'$regex': yesterdayDate},
                                        user_id: { '$in': newIDs}
                                    }
                                };
                                dao.q("events", option_events, function(err, eventsData){
                                    console.log(eventsData);
                                    for (var i = 0; i < children_info.length; i++) {
                                        children_info[i].pencilblueActivity = [];
                                        var k = 0;
                                        for (var j = 0; j < eventsData.length; j++) {
                                            if (children_info[i]._id +"" == eventsData[j].user_id) {
                                                children_info[i].pencilblueActivity[k++] = eventsData[j];
                                            };
                                        };
                                        //console.log(children_info[i].pencilblueActivity);
                                        if (children_info[i].fitbit_data.fitbit_activityListData && children_info[i].fitbit_data.fitbit_activityListData.activities) {
                                            //遍历当前child的activity in Fitbit
                                            for (var j = 0; j < children_info[i].fitbit_data.fitbit_activityListData.activities.length; j++) {
                                                 
                                                //然后根据当前activity 去json文件中找对应的METS 和 name
                                                for (var n = 0; n < eventsList.length; n++) {
                                                    if (eventsList[n].adult_code) {
                                                        if (children_info[i].fitbit_data.fitbit_activityListData.activities[j].activityTypeId == eventsList[n].adult_code) {
                                                            //根据json文件中的activity 来比较 child 在pencil blue中的activity
                                                            var m = 0;
                                                            for (; m < children_info[i].pencilblueActivity.length; m++) {
                                                                if(eventsList[n].eventName.substring(0,children_info[i].pencilblueActivity[m].event_name.length) == children_info[i].pencilblueActivity[m].event_name){
                                                                    //console.log("cccc");
                                                                    if (children_info[i].fitbit_data.fitbit_activityListData.activities[j].duration/60000 >= children_info[i].pencilblueActivity[m].durationTime) {
                                                                        children_info[i].pencilblueActivity[m].durationTime = children_info[i].fitbit_data.fitbit_activityListData.activities[j].duration/60000;
                                                                        children_info[i].pencilblueActivity[m].finished = "true";
                                                                        children_info[i].pencilblueActivity[m].durationMETS = eventsList[n].METS;
                                                                        dao.save(children_info[i].pencilblueActivity[m], function(err, events){
                                                                        });
                                                                        break;
                                                                    };
                                                                }
                                                            };
                                                            if (m == children_info[i].pencilblueActivity.length) {
                                                                var activity = {};
                                                                activity.event_name = eventsList[n].eventName;
                                                                activity.user_id = children_info[i]._id +"";
                                                                activity.scheduledMETS = 0;
                                                                activity.start_date = yesterdayDate + " 00:00";// no specific time for the start time
                                                                activity.end_date = yesterdayDate + " 00:00";//no specific time for the start time
                                                                activity.durationTime = children_info[i].fitbit_data.fitbit_activityListData.activities[j].duration/60000;
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
                                                            for (; m < children_info[i].pencilblueActivity.length; m++) {
                                                                if(eventsList[n].eventName.substring(0,children_info[i].pencilblueActivity[m].event_name.length) == children_info[i].pencilblueActivity.event_name){
                                                                    if (children_info[i].fitbit_data.fitbit_activityListData.activities[j].duration/60000 >= children_info[i].pencilblueActivity[m].durationTime) {
                                                                        children_info[i].pencilblueActivity[m].durationTime = children_info[i].fitbit_data.fitbit_activityListData.activities[j].duration/60000;
                                                                        children_info[i].pencilblueActivity[m].finished = "true";
                                                                        children_info[i].pencilblueActivity[m].durationMETS = eventsList[n].METS;
                                                                        dao.save(children_info[i].pencilblueActivity[m], function(err, events){
                                                                        });
                                                                        break;
                                                                    };
                                                                }
                                                            };
                                                            if (m == children_info[i].pencilblueActivity.length) {
                                                                var activity = {};
                                                                activity.event_name = eventsList[n].eventName;
                                                                activity.user_id = children_info[i]._id +"";
                                                                activity.scheduledMETS = 0;
                                                                activity.start_date = yesterdayDate + " 00:00";// no specific time for the start time
                                                                activity.end_date = yesterdayDate + " 00:00";//no specific time for the start time
                                                                activity.durationTime = children_info[i].fitbit_data.fitbit_activityListData.activities[j].duration/60000;
                                                                activity.durationMETS = eventsList[n].METS;
                                                                activity.finished = "true";
                                                                var activity_save = pb.DocumentCreator.create('events', activity);
                                                                dao.save(activity_save, function(err1, result) {});
                                                            };
                                                        };
                                                    };
                                                };//end loop for n
                                            };//end loop for j
                                        };// if children_info[i].fitbit_data.fitbit_activityListData
                                        //console.log(children_info[i].pencilblueActivity);
                                    };//end loop for i
                                    data.daily_reports = children_info;
                                    data.parentUser = self.session.authentication.user;
                                    self.setPageName('Activity Report');
                                    self.ts.registerLocal('image_title', self.ls.get('USER_PHOTO'));
                                    self.ts.registerLocal('angular_objects', new pb.TemplateValue(pb.ClientJs.getAngularObjects(data), false));
                                    self.ts.load('user/activity_report', function(err, result) {
                                        cb({content: result});
                                    });
                                });//end dao.q

                             });//end loadJSONFile
                
                            
                            
                        });//end q fitbit data

                    });//end q goals

                    
                });//end q user
            });//end q member

        });//end gather data
    };//end render

    /**
     *
     * @method gatherData
     * @param {Function} cb
     * @return {Array}
     */
    ActivityReport.prototype.gatherData = function(cb) {
        var self = this;
        var tasks = {

            navigation: function(callback) {
                callback(null, self.getNavigation());
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
            
            
            user: function(callback) {
                self.service.get(self.session.authentication.user_id, callback);
            }
        };
        async.parallel(tasks, cb);
    };
    /**
     *
     * @method get Date of yesterday
     * @return date
     */
    ActivityReport.prototype.getDate_Yesterday = function() {
          var currDate = new Date();
          currDate.setDate(currDate.getDate() - 1);
          var td = currDate,
            month = '' + (td.getMonth() + 1),
            day = '' + td.getDate(),
            year = td.getFullYear();

          if (month.length < 2) month = '0' + month;
          if (day.length < 2) day = '0' + day;

          return [year, month, day].join('-');
      };
    /**
     *
     * @method get Date of one week
     * @return date
     */  
    ActivityReport.prototype.getDate = function(bias) {
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

    ActivityReport.prototype.compareTwoDates = function(startOn, nextOn){
          var so = new Date(startOn), no = new Date(nextOn);
          
          return so.getTime() <= no.getTime();
    };

    ActivityReport.prototype.getObjectId = function(oid) {
        try {
           return new ObjectID(oid + '');
        }
        catch(err) {
            return oid;
        }
    };
    
    /**
     *
     * @method getNavigation
     * @return {Array}
     */
    ActivityReport.prototype.getNavigation = function() {
        return [
           {
               id: 'activity_tracking',
               active: 'active',
               title: this.ls.get('Actitivity Tracking'),
               icon: 'area-chart',
               href: '#',
               dropdown: true,
               children:
               [
                   //di
                   {
                       id: 'activity_tracking',
                       title: this.ls.get('Display Tracking Charts'),
                       icon: 'key',
                       // icon: '/img/icons/32/blue-09.png',
                       href: '/user/activity_tracking',
                   },
                   {
                       id: 'activity_report',
                       active: 'active',
                       title: this.ls.get('Display Tracking Report'),
                       icon: 'key',
                       // icon: '/img/icons/32/blue-22.png',
                       href: '/user/activity_report',
                   },
                   {
                       id: 'activity_score',
                       title: this.ls.get('Display Tracking Score'),
                       icon: 'clipboard',
                       href: '/user/activity_score',
                   }                   
               ]
           }
       ];
    };
    
    /**
     *
     * @method getTabs
     * @return {Array}
     */
    ActivityReport.prototype.getTabs = function() {
        return [
            {
                active: 'active',
                href: '#daily_report',
                icon: 'cog',
                title: 'Daily Report'
            },
            {   
                href: '#weekly_report',
                icon: 'file',
                title: 'Weekly Average Student Fitness Report'
            },
            {   
                href: '#daily_planner_report',
                icon: 'file',
                title: 'Daily Student Planner Report'
            }
        ];
    };
    
    /**
     *
     * @method getPills
     * @return {Array}
     */
    ActivityReport.prototype.getPills = function() {
        return [ {
            name : 'activity_tracking',
            title : this.ls.get('Activity Tracking'),
            icon : 'refresh',
            href : '/user/activity_tracking'
        } ];
    };

    ActivityReport.prototype.getTopMenu = function() {
        return [
            {
                name: 'manage_account',
                title: 'Manage Account',
                icon: 'user',
                //icon: '/img/icons/64/blue-35.png',
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

    //exports
    return ActivityReport;
};

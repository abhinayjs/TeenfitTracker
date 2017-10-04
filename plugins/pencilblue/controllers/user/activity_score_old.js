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
var ObjectID = require('mongodb').ObjectID;
module.exports = function(pb) {

    //pb dependencies
    var util        = pb.util;
    var UserService = pb.UserService;
    var UrlService  = pb.UrlService;

    /**
     * Interface for logged in user to manage account information
     * @class ActivityScore
     * @constructor
     * @extends FormController
     */
    function ActivityScore(){}
    util.inherits(ActivityScore, pb.FormController);
    
    /**
     * Initializes the controller
     * @method init
     * @param {Object} context
     * @param {Function} cb
     */
    ActivityScore.prototype.init = function(context, cb) {
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
        ActivityScore.super_.prototype.init.apply(this, [context, init]);
    };

    /**
     *
     * @method render
     * @param {Function}
     */
     ActivityScore.prototype.render = function(cb) {
        var self = this;
        var dao = new pb.DAO();
        
        //console.log(this.session.authentication.user);
        

        this.gatherData(function(err, data) {

            if(util.isError(err)) {
                return cb(err);
            }
            else if (data.user === null) {
                return self.redirect(UrlService.createSystemUrl('/user/login'), cb);
            }
            delete data.user.password;
            var user_id = self.session.authentication.user._id+'';
            if (self.session.authentication.user.admin == 1) {
                var option_fitbitProfile = {
                    where:{
                        userid : self.session.authentication.user._id
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
                    children_info[0].weight = 65;
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
                                user_id: user_id
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

                            data.daily_scores = children_info;
                            data.parentUser = self.session.authentication.user;
                            self.setPageName('Activity Score');
                            self.ts.registerLocal('image_title', self.ls.get('USER_PHOTO'));
                            self.ts.registerLocal('angular_objects', new pb.TemplateValue(pb.ClientJs.getAngularObjects(data), false));
                            self.ts.load('user/activity_score', function(err, result) {
                                cb({content: result});
                            });
                            
                        });
                });
            }else{
                var opts = {
                    where: {
                        parent_id : user_id
                    }
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

                        var option_fitbitProfile = {
                            where:{
                                userid : {'$in': childIDs}
                            }
                        };
                        dao.q("userFitbitProfile", option_fitbitProfile, function(err, userFitbitProfile){
                            console.log(userFitbitProfile);
                            for (var i = 0; i < children_info.length; i++) {
                               for (var j = 0; j < userFitbitProfile.length; j++) {
                                    if (children_info[i]._id+"" == userFitbitProfile[j].userid) {
                                        children_info[i].age = userFitbitProfile[j].age;
                                        children_info[i]['height'] = userFitbitProfile[j]['height'] / 100;
                                        children_info[i].weight = userFitbitProfile[j].weight;
                                        children_info[i].gender = userFitbitProfile[j].gender;
                                        children_info[i].BMI = (children_info[i].weight) / (children_info[i]['height'] * children_info[i]['height']);
                                        children_info[i].weight = 65;
                                        if(children_info[i].gender == 'MALE'){
                                            if(children_info[i].BMI < 25){
                                                children_info[i].BEE = 68 - 43.3*children_info[i].age + 712*children_info[i]['height'] + 19.2*children_info[i].weight;
                                            }else{
                                                children_info[i].BEE = 419.9 - 33.5*children_info[i].age + 418.9*children_info[i]['height'] + 16.7*children_info[i].weight;
                                            }
                                        }else{
                                            if(children_info[i].BMI < 25){
                                                children_info[i].BEE = 189 - 17.6*children_info[i].age + 625*children_info[i]['height'] + 7.9*children_info[i].weight;
                                            }else{
                                                children_info[i].BEE = 515.8- 26.8*children_info[i].age + 347*children_info[i]['height'] + 12.4*children_info[i].weight;
                                            }
                                        }
                                        break;
                                    };
                               };
                            };

                                var yesterdayDate = self.getDate(-1);
                                var option_events = {
                                    where:{
                                        finished : 'true',
                                        end_date : {'$regex': yesterdayDate},
                                        user_id: { '$in': newIDs}
                                    }
                                };
                                dao.q("events", option_events, function(err, eventsData){
                                    console.log(eventsData);
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

                                    data.daily_scores = children_info;
                                    data.parentUser = self.session.authentication.user;
                                    self.setPageName('Activity Score');
                                    self.ts.registerLocal('image_title', self.ls.get('USER_PHOTO'));
                                    self.ts.registerLocal('angular_objects', new pb.TemplateValue(pb.ClientJs.getAngularObjects(data), false));
                                    self.ts.load('user/activity_score', function(err, result) {
                                        cb({content: result});
                                    });
                                    
                                });

                        });
                    });
                });
            }
        });
    };

    /**
     *
     * @method gatherData
     * @param {Function} cb
     * @return {Array}
     */
    ActivityScore.prototype.gatherData = function(cb) {
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
    ActivityScore.prototype.getDate_Yesterday = function() {
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
    ActivityScore.prototype.getDate = function(bias) {
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

    ActivityScore.prototype.compareTwoDates = function(startOn, nextOn){
          var so = new Date(startOn), no = new Date(nextOn);
          
          return so.getTime() <= no.getTime();
    };

    ActivityScore.prototype.getObjectId = function(oid) {
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
    ActivityScore.prototype.getNavigation = function() {
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
                   //disable charts
                   // {
                   //     id: 'activity_tracking',
                   //     title: this.ls.get('Display Tracking Charts'),
                   //     icon: 'key',
                   //     href: '/user/activity_tracking',
                   // },
                   {
                       id: 'activity_report',
                       active: 'active',
                       title: this.ls.get('Display Tracking Report'),
                       icon: 'key',
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
    ActivityScore.prototype.getTabs = function() {
        return [
            {
                active: 'active',
                href: '#daily_score_report',
                icon: 'cog',
                title: 'Score Report'
            },
            // {   
            //     href: '#weekly_report',
            //     icon: 'file',
            //     title: 'Weekly Average Student Fitness Report'
            // }
        ];
    };
    
    /**
     *
     * @method getPills
     * @return {Array}
     */
    ActivityScore.prototype.getPills = function() {
        return [ {
            name : 'activity_tracking',
            title : this.ls.get('Activity Tracking'),
            icon : 'refresh',
            href : '/user/activity_tracking'
        } ];
    };

    ActivityScore.prototype.getTopMenu = function() {
        return [
            {
                name: 'manage_account',
                title: 'Manage Account',
                icon: 'user',
                href: '/user/manage_account'
            },
            //disable manage friend
            // {
            //     name: 'manage_friend',
            //     title: 'Manage Friend',
            //     icon: 'group',
            //     href: '/user/manage_friend'
            // },
            {
                name: 'manage_calendar',
                title: 'Activity Calendar',
                icon: 'calendar',
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
                name: 'log_out',
                title: 'Log out',
                icon: 'power-off',
                href: '/actions/logout'
            }
        ];
    };

    //exports
    return ActivityScore;
};

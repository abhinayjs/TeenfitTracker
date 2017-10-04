/*
    Copyright (C) 2015  TeenFitNation, LLC

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

	// pb dependencies
	var util = pb.util;
	var UserService = pb.UserService;
	var UrlService = pb.UrlService;
	var dao = new pb.DAO();
	/**
	 * Interface for logged in user to track activity
	 * 
	 * @class ActivityTracking
	 * @constructor
	 * @extends FormController
	 */
	function ActivityTracking() {
	}
	util.inherits(ActivityTracking, pb.FormController);

	/**
	 * Initializes the controller
	 * 
	 * @method init
	 * @param {Object}
	 *            context
	 * @param {Function}
	 *            cb
	 */
	ActivityTracking.prototype.init = function(context, cb) {
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
		ActivityTracking.super_.prototype.init.apply(this, [ context, init ]);
	};

	/**
	 * 
	 * @method render
	 * @param {Function}
	 */
	ActivityTracking.prototype.render = function(cb) {
		var self = this;

		this.gatherData(function(err, data) {
			if (util.isError(err)) {
				return cb(err);
			} else if (data.user === null) {
				return self.redirect(UrlService.createSystemUrl('/user/login'), cb);
			}

			delete data.user.password;
			var userID = self.session.authentication.user._id+'';
			var opts_1 = {
                where : {
                    user_id : userID
                    //finished: "true"
                }
            };
      var temp_opts = {
                where : {
                    user_id : pb.DAO.getObjectId(userID)+""
                    //finished: "true"
                }
            };
      dao.q('PAL', temp_opts, function(err,user_pal){
        if(util.isError(err)){
          return cb(err);
        }
        var tmpDailyPAData = [];
        //var tmpScheduledDailyPALData = [];
        for (var i = 0; i < user_pal.length; i++){
          // console.log(events[i]);
          // self.getDate(new Date(), -1)
          // var date = self.getDate(user_pal[i].date);
          tmpDailyPAData[user_pal[i].date] = user_pal[i].activity_coefficient;
        }

        var dailyPAData = [];
        var k = 0;
        for(var key in tmpDailyPAData){
          var dailyPA = {};
          dailyPA.date = key;
          dailyPA.activity_coefficient = tmpDailyPAData[key];
          //dailyPAL.schePAL = tmpScheduledDailyPALData[key];
          dailyPAData[k++] = dailyPA; 
        }
        data.dailyPA = dailyPAData;


            //     var j = 0;
            //     var scheduledTimeScore = [];
            //     var durationTimeScore = [];
            //     for (var i = events.length - 1; i >= 0; i--) {
            //         var startDate = new Date(events[i].start_date);
            //         var endDate = new Date(events[i].end_date);
            //         var date = new Date();
            //         var startDateNum = parseInt(startDate.getFullYear()*10000 + (startDate.getMonth() + 1)*100 + startDate.getDate());
            //         var dateNum = parseInt(date.getFullYear()*10000 + (date.getMonth() + 1)*100 + date.getDate());
                    
            //         var endDate = new Date(events[i].end_date);
            //         if(startDateNum < dateNum || startDateNum > dateNum){
            //             delete events[i];
            //         }else{
            //           durationTimeScore[j] = events[i].durationTime * events[i].durationMETS;
            //           scheduledTimeScore[j] = ((endDate - startDate) / 60000) * events[i].scheduledMETS;
            //           j++;
            //         }
            //     }


            //     //data.events = events;
            //     //data.eventsList = eventsList;
            //     data.scheduledTimeScore = scheduledTimeScore;
            //     data.durationTimeScore = durationTimeScore;
                /*var opts_2 = {
                where : {
                    user_id : userID
                }
             };
        dao.q('goals', opts_2, function(err, goals) {
          data.goals = goals;
          data.parentUser = self.session.authentication.user;
          self.setPageName(self.ls.get('Activity Tracking'));
          self.ts.registerLocal('angular_objects', new pb.TemplateValue(pb.ClientJs.getAngularObjects(data), false));
          self.ts.load('user/activity_tracking', function(err, result) {
            cb({
              content : result
            });
          });//end load
        });//end q goals*/
      });
			dao.q('events', opts_1, function(err, events) {
                if (util.isError(err)) {
                    return cb(err);
                }
                var tmpDailyPALData = [];
                var tmpScheduledDailyPALData = [];
                for (var i = 0; i < events.length; i++){
                	// console.log(events[i]);
            		  var date = self.getDate(events[i].start_date);
                	var eventDate = new Date(events[i].start_date);
                	var startDate = new Date(events[i].start_date);
                  var endDate = new Date(events[i].end_date);
                	if(self.compareDate(eventDate)){
                		if(typeof tmpDailyPALData[date] !== 'undefined' && tmpDailyPALData[date] !== null){
                			tmpDailyPALData[date] += events[i].durationTime * events[i].durationMETS;
                			tmpScheduledDailyPALData[date] += ((endDate - startDate) / 60000) * events[i].scheduledMETS;
                			// console.log(tmpScheduledDailyPALData[date]);
                		}else{
                			tmpDailyPALData[date] = events[i].durationTime * events[i].durationMETS;
                			tmpScheduledDailyPALData[date] = ((endDate - startDate) / 60000) * events[i].scheduledMETS;
                			// console.log(tmpScheduledDailyPALData[date]);

                		}
                			
                	}	
                }
                var dailyPALData = [];
                var k = 0;
                for(var key in tmpDailyPALData){
                	var dailyPAL = {};
                	dailyPAL.date = key;
                	dailyPAL.PAL = tmpDailyPALData[key];
                	//dailyPAL.schePAL = tmpScheduledDailyPALData[key];
                	dailyPALData[k++] = dailyPAL; 
                }
               
                data.dailyPAL = dailyPALData;

                var j = 0;
                var scheduledTimeScore = [];
                var durationTimeScore = [];
                for (var i = events.length - 1; i >= 0; i--) {
                    var startDate = new Date(events[i].start_date);
                    var endDate = new Date(events[i].end_date);
                    var date = new Date();
                    var startDateNum = parseInt(startDate.getFullYear()*10000 + (startDate.getMonth() + 1)*100 + startDate.getDate());
                    var dateNum = parseInt(date.getFullYear()*10000 + (date.getMonth() + 1)*100 + date.getDate());
                    
                    var endDate = new Date(events[i].end_date);
                    if(startDateNum < dateNum || startDateNum > dateNum){
                        delete events[i];
                    }else{
                    	durationTimeScore[j] = events[i].durationTime * events[i].durationMETS;
                    	scheduledTimeScore[j] = ((endDate - startDate) / 60000) * events[i].scheduledMETS;
                    	j++;
                    }
                }


                //data.events = events;
                //data.eventsList = eventsList;
                data.scheduledTimeScore = scheduledTimeScore;
                data.durationTimeScore = durationTimeScore;
                var opts_2 = {
		            where : {
		                user_id : userID
		            }
		        };
				    dao.q('goals', opts_2, function(err, goals) {
					     data.goals = goals;
                data.parentUser = self.session.authentication.user;
					      self.setPageName(self.ls.get('Activity Tracking'));
					      self.ts.registerLocal('angular_objects', new pb.TemplateValue(pb.ClientJs.getAngularObjects(data), false));
					      self.ts.load('user/activity_tracking', function(err, result) {
						      cb({
							       content : result
						      });
					      });//end load
				    });//end q goals
                
      });//end q events
			
		});
	};

	/**
	 * 
	 * @method gatherData
	 * @param {Function}
	 *            cb
	 * @return {Array}
	 */
	ActivityTracking.prototype.gatherData = function(cb) {
		var self = this;
		var tasks = {

			navigation : function(callback) {
				callback(null, self.getNavigation());
			},

			topMenu : function(callback) {
                callback(null, self.getTopMenu());
            },

			pills : function(callback) {
				callback(null, self.getPills());
			},

			tabs : function(callback) {
				callback(null, self.getTabs());
			},

			locales : function(callback) {
				callback(null, pb.Localization.getSupportedWithDisplay());
			},

			user : function(callback) {
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
   ActivityTracking.prototype.getNavigation = function() {

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
                   {
                       id: 'activity_tracking',
                       title: this.ls.get('Display Tracking Charts'),
                       icon: 'key',
                       href: '/user/activity_tracking',
                   },
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
	ActivityTracking.prototype.getTabs = function() {
   		return [ 
		{
			active : 'active',
			href : '#donut_chart',
			icon : 'pie-chart',
			title : this.ls.get('Pie Chart')
		}, 
		{
			href : '#bar_chart',
			icon : 'bar-chart',
			title : this.ls.get('Bar Chart')
		}, 
		{
			href : '#line_chart',
			icon : 'line-chart',
			title : this.ls.get('Line Chart')
		}
		];
   	   
	};

	/**
	 * 
	 * @method getPills
	 * @return {Array}
	 */
	ActivityTracking.prototype.getPills = function() {
		return [ {
			name : 'activity_tracking',
			title : this.ls.get('Activity Tracking'),
			icon : 'refresh',
			href : '/user/activity_tracking'
		} ];
	};

	ActivityTracking.prototype.getTopMenu = function() {
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
            {
                name: 'activity_tracking',
                title: 'Activity Tracking',
                icon: 'area-chart',
                href: '/user/activity_tracking'
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


	ActivityTracking.prototype.getDate = function(event_date){
		var eventDate = new Date(event_date);
		
		// eventDate.setDate(eventDate.getDate() + 0);
		var month = '' + (eventDate.getMonth() + 1);
		var day = '' + eventDate.getDate();
		var year = eventDate.getFullYear();
		// console.log(day);

		if (month.length < 2) month = '0' + month;
		if (day.length < 2) day = '0' + day;

		return [year, month, day].join('-');
	};
	ActivityTracking.prototype.compareDate = function(event_date) {
		var eventDate = this.getDate(event_date)

		var finalEventDate = new Date(eventDate);
		var td = new Date();
		return finalEventDate.getTime() <= td.getTime();
	};
	// exports
	return ActivityTracking;
};
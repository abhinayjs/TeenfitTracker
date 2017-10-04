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

module.exports = function(pb) {

    //pb dependencies
    var util        = pb.util;
    var UserService = pb.UserService;
    var UrlService  = pb.UrlService;

    /**
     * Interface for logged in user to manage account information
     * @class ManageCalendar
     * @constructor
     * @extends FormController
     */
    function ManageCalendar(){}
    util.inherits(ManageCalendar, pb.FormController);
    
    /**
     * Initializes the controller
     * @method init
     * @param {Object} context
     * @param {Function} cb
     */
    ManageCalendar.prototype.init = function(context, cb) {
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
        ManageCalendar.super_.prototype.init.apply(this, [context, init]);
    };

    /**
     *
     * @method render
     * @param {Function}
     */
     ManageCalendar.prototype.render = function(cb) {
        var self = this;
        var dao = new pb.DAO();
        var filePath = path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'data', 'event.json');
        var METPath = path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'data', 'events.json');
            pb.users.loadJSONFile(filePath,function(err,eventsList){
            self.gatherData( function(err, data) {
                if(util.isError(err)) {
                        return cb(err);
                    }
                    else if (data.user === null) {
                        return self.redirect(UrlService.createSystemUrl('/'), cb);
                    }

                delete data.user.password;
                data.adminLevel = self.session.authentication.user.admin;
                if(data.adminLevel == '1'){
                    var option = {
                            where : {
                                        user_id : self.session.authentication.user_id,
                                    }
                        };
                    dao.q("events", option, function(err, events){
                        if (util.isError(err)) {
                            return cb(err);
                        }
                        pb.users.loadJSONFile(METPath,function(err,METList){
                            data.events = events;
                            data.METList = METList;
                            data.eventsList = eventsList;
                            data.childrenEvents = "No children";
                            data.children = "No children";
                            self.setPageName('Manage Calendar');
                            self.ts.registerLocal('angular_objects', new pb.TemplateValue(pb.ClientJs.getAngularObjects(data), false));
                            self.ts.load('user/manage_calendar', function(err, result) {
                                cb({content: result});
                            });
                        });
                        
                    });//end q
                }else{
                    pb.users.getChildren(self.session.authentication.user._id,  function(error, children) {
                        var opts = {
                            where : {
                                        user_id : self.session.authentication.user_id,
                                    }
                        };
                        dao.q("events",opts, function(err, events) {
                            if (util.isError(err)) {
                                return cb(err);
                            }
                            data.events = events;
                            if(children.length != 0){
                                var child_id = new Array();
                                for (var i = 0; i < children.length; i++) {
                                    child_id[i] = children[i].child_id;
                                };
                                var option = {
                                    where :{ user_id: { '$in': child_id} }
                                };
                                dao.q("events",option, function(err, events2) {
                                    pb.users.loadJSONFile(METPath,function(err,METList){
                                        data.childrenEvents = events2;
                                        data.eventsList = eventsList;
                                        data.METList = METList;
                                        data.children = children;
                                        self.setPageName('Manage Calendar');
                                        self.ts.registerLocal('angular_objects', new pb.TemplateValue(pb.ClientJs.getAngularObjects(data), false));
                                        self.ts.load('user/manage_calendar', function(err, result) {
                                            cb({content: result});
                                        });
                                    });
                                    
                                });
                            }else{
                                pb.users.loadJSONFile(METPath,function(err,METList){
                                    data.childrenEvents = "No children";
                                    data.children = "No children";
                                    data.eventsList = eventsList;
                                    data.METList = METList;
                                    self.setPageName('Manage Calendar');
                                    self.ts.registerLocal('angular_objects', new pb.TemplateValue(pb.ClientJs.getAngularObjects(data), false));
                                    self.ts.load('user/manage_calendar', function(err, result) {
                                        cb({content: result});
                                    });
                                });
                                
                            }
                        });//end q
                    });//end getChildren
                }//end else
            });//end gatherdata
        });
    };

    /**
     *
     * @method gatherData
     * @param {Function} cb
     * @return {Array}
     */
    ManageCalendar.prototype.gatherData = function(cb) {
        var self = this;
        var tasks = {

            topMenu: function(callback) {
                callback(null, self.getTopMenu());
            },
            
            user: function(callback) {
                self.service.get(self.session.authentication.user_id, callback);
            }
        };
        async.parallel(tasks, cb);
    };
    
    ManageCalendar.prototype.getTopMenu = function() {
        return [
            {
                name: 'manage_account',
                title: 'Manage Account',
                icon: 'user',
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
    return ManageCalendar;
};
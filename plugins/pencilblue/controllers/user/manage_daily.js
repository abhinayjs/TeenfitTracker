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
    var PluginService = pb.PluginService;

    /**
     * Interface for logged in user to manage account information
     * @class ManageDaily
     * @constructor
     * @extends FormController
     */
    function ManageDaily(){}
    util.inherits(ManageDaily, pb.FormController);
    
    /**
     * Initializes the controller
     * @method init
     * @param {Object} context
     * @param {Function} cb
     */
    ManageDaily.prototype.init = function(context, cb) {
        var self = this;
        var init = function(err) {
            // console.log(this.query);
            
            /**
             * 
             * @property service
             * @type {TopicService}
             */
            self.service = new UserService(self.getServiceContext());
                
            cb(err, true);
        };
        ManageDaily.super_.prototype.init.apply(this, [context, init]);
    };

    /**
     *
     * @method render
     * @param {Function}
     */
     ManageDaily.prototype.render = function(cb) {
        var self = this;
        var dao = new pb.DAO();
        var get  = this.query;
        var filePath = path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'data', 'event.json');
        var METPath = path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'data', 'events.json');
        pb.users.loadJSONFile(filePath,function(err,eventsList){
            if(util.isError(err)) {
                    return cb(err);
                }
            self.gatherData(get.user_id,function(err, data){
                if(util.isError(err)) {
                    return cb(err);
                }
                else if (data.user === null) {
                    return self.redirect(UrlService.createSystemUrl('/'), cb);
                }

                delete data.user.password;
                var date = new Date();
                if(get.user_id != null){

                        var opts_1 = {
                            where : {
                                user_id : get.user_id+""
                            }
                        };
                        pb.users.getUserByUserID(get.user_id, function(err, child_user){
                        self.setPageName('Manage Daily');
                        data.user = child_user;
                        data.parentUser = self.session.authentication.user;
                        delete data.user.password;
                        dao.q('events', opts_1, function(err, events) {
                            if (util.isError(err)) {
                                return cb(err);
                            }
                            for (var i = events.length - 1; i >= 0; i--) {
                                var startDate = new Date(events[i].start_date);
                                var startDateNum = parseInt(startDate.getFullYear()*10000 + (startDate.getMonth() + 1)*100 + startDate.getDate());
                                var dateNum = parseInt(date.getFullYear()*10000 + (date.getMonth() + 1)*100 + date.getDate());
                                
                                var endDate = new Date(events[i].end_date);
                                if(startDateNum < dateNum || startDateNum > dateNum){
                                    //console.log(events[i]);
                                    delete events[i];
                                }
                            };
                            pb.users.loadJSONFile(METPath,function(err,METList){
                                data.events = events;
                                data.eventsList = eventsList;
                                data.METList = METList;
                                data.parentUser = self.session.authentication.user;
                                self.setPageName('Manage Daily');
                                self.ts.registerLocal('angular_objects', new pb.TemplateValue(pb.ClientJs.getAngularObjects(data), false));
                                self.ts.load('user/manage_daily', function(err, result) {
                                    cb({content: result});
                                });
                            });
                        });
                        
                    });
                }else{
                    var opts_2 = {
                        where : {
                                user_id : self.session.authentication.user._id+""
                        }
                    };
                    dao.q('events', opts_2, function(err, events) {
                        if (util.isError(err)) {
                            return cb(err);
                        }
                        for (var i = events.length - 1; i >= 0; i--) {
                                var startDate = new Date(events[i].start_date);
                                var endDate = new Date(events[i].end_date);
                                var startDateNum = parseInt(startDate.getFullYear()*10000 + (startDate.getMonth() + 1)*100 + startDate.getDate());
                                var dateNum = parseInt(date.getFullYear()*10000 + (date.getMonth() + 1)*100 + date.getDate());
                                if(startDateNum < dateNum || startDateNum > dateNum){
                                    delete events[i];
                                }
                        };
                        if(self.session.authentication.user.admin == '0'){
                            pb.users.getChildren(self.session.authentication.user._id,  function(error, children) {
                                if(children.length != 0){
                                    var child_id = new Array();
                                    for (var i = 0; i < children.length; i++) {
                                        child_id[i] = children[i].child_id;
                                    };
                                    var option = {
                                        where :{ user_id: { '$in': child_id} }
                                    };
                                    dao.q("events",option, function(err, events2) {
                                        for (var i = events2.length - 1; i >= 0; i--) {
                                            var startDate = new Date(events2[i].start_date);
                                            var endDate = new Date(events2[i].end_date);
                                            var startDateNum = parseInt(startDate.getFullYear()*10000 + (startDate.getMonth() + 1)*100 + startDate.getDate());
                                            var dateNum = parseInt(date.getFullYear()*10000 + (date.getMonth() + 1)*100 + date.getDate());
                                            if(startDateNum < dateNum || startDateNum > dateNum){
                                                delete events2[i];
                                            }
                                        };
                                        pb.users.loadJSONFile(METPath,function(err,METList){
                                            data.events = events;
                                            data.childrenEvents = events2;
                                            data.eventsList = eventsList;
                                            data.METList = METList;
                                            data.parentUser = self.session.authentication.user;
                                            //data.children = children;
                                            self.setPageName('Manage Daily');
                                            self.ts.registerLocal('angular_objects', new pb.TemplateValue(pb.ClientJs.getAngularObjects(data), false));
                                            self.ts.load('user/manage_daily', function(err, result) {
                                                cb({content: result});
                                            });
                                        });
                                        
                                    });
                                }
                            });
                        }else{
                            pb.users.loadJSONFile(METPath,function(err,METList){
                                data.events = events;
                                data.eventsList = eventsList;
                                data.METList = METList;
                                data.parentUser = self.session.authentication.user;
                                self.setPageName('Manage Daily');
                                self.ts.registerLocal('angular_objects', new pb.TemplateValue(pb.ClientJs.getAngularObjects(data), false));
                                self.ts.load('user/manage_daily', function(err, result) {
                                    cb({content: result});
                                });
                            });
                        }
                        
                        
                    });//end q
                }//end else
                
            });//end gatherData
        });
    };
    /**
     *
     * @method gatherData
     * @param {Function} cb
     * @return {Array}
     */
    ManageDaily.prototype.gatherData = function(userid,cb) {
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
    ManageDaily.prototype.getNavigation = function(userid) {
         var user_name = this.session.authentication.user.username;
        //console.log(this.session.authentication.user._id);
        var all_child = new Array();
        all_child[0] = {
                id: 'daily',
                title: 'Daily Activity',
                icon: 'tasks',
                href: '#',
                dropdown: true,
                children:
                [
                    {
                        id: 'manage',
                        active: 'active',
                        title: 'Manage Daily Activity',
                        icon: 'cog',
                        href: '/user/manage_daily',
                    }

                ]
            };
        if(userid == null){
            all_child[0].active = 'active';
        }
        var i = 1;
        pb.users.getChildren(this.session.authentication.user._id,  function(error, children) {
        //console.log(children);
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
                            id: 'manage',
                            active: 'active',
                            title: 'Manage Daily Activity',
                            icon: 'cog',
                            href: '/user/manage_daily?user_id=' + child.child_id
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
    ManageDaily.prototype.getTabs = function() {
        return [
            {
                active: 'active',
                href: '#daily_management',
                icon: 'cog',
                title: 'Daily activiy management'
            }
        ];
    };
    
    /**
     *
     * @method getPills
     * @return {Array}
     */
    ManageDaily.prototype.getPills = function() {
        return [
            {
                name: 'manage_daily',
                title: 'Manage Daily Activity',
                icon: 'refresh',
                href: '/user/manage_daily'
            }
        ];
    };

    ManageDaily.prototype.getTopMenu = function() {
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

    //exports
    return ManageDaily;
};

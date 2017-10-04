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

module.exports = function(pb) {

    //pb dependencies
    var util        = pb.util;
    var UserService = pb.UserService;
    var UrlService  = pb.UrlService;

    /**
     * Interface for logged in user to manage account information
     * @class SetScheduler
     * @constructor
     * @extends FormController
     */
    function SetScheduler(){}
    util.inherits(SetScheduler, pb.FormController);
    
    /**
     * Initializes the controller
     * @method init
     * @param {Object} context
     * @param {Function} cb
     */
    SetScheduler.prototype.init = function(context, cb) {
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
        SetScheduler.super_.prototype.init.apply(this, [context, init]);
    };

    /**
     *
     * @method render
     * @param {Function}
     */
    SetScheduler.prototype.render = function(cb) {
        var self = this;

        this.gatherData(function(err, data) {
            if(util.isError(err)) {
                return cb(err);
            }
            else if (data.user === null) {
                return self.redirect(UrlService.createSystemUrl('/'), cb);
            }

            delete data.user.password;
            var dao = new pb.DAO();

            data.user = self.session.authentication.user;
            data.parentUser = self.session.authentication.user;
            self.setPageName('Set Scheduler');
            self.ts.registerLocal('angular_objects', new pb.TemplateValue(pb.ClientJs.getAngularObjects(data), false));
            self.ts.load('user/set_scheduler', function(err, result) {
                cb({content: result});
            });
        });
    };

    /**
     *
     * @method gatherData
     * @param {Function} cb
     * @return {Array}
     */
    SetScheduler.prototype.gatherData = function(cb) {
        var self = this;
        var tasks = {

            navigation: function(callback) {
                callback(null, self.getNavigation());
            },

            pills: function(callback) {
                callback(null, self.getPills());
            },

            tabs: function(callback) {
                callback(null, self.getTabs());
            },
            
            locales: function(callback) {
                callback(null, pb.Localization.getSupportedWithDisplay());
            },
            topMenu: function(callback) {
                callback(null, self.getTopMenu());
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
    SetScheduler.prototype.getNavigation = function(userid) {
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
                        href: '#'
                    },
                    {
                        id: 'set_scheduler',
                        title: this.ls.get('Set Scheduler'),
                        icon: 'clock-o',
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
    SetScheduler.prototype.getTabs = function() {
        return [
            {
                active: 'active',
                href: '#scheduler_info',
                icon: 'cog',
                title: 'Set Scheduler'
            }
        ];
    };

    SetScheduler.prototype.getTopMenu = function() {
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
    
    /**
     *
     * @method getPills
     * @return {Array}
     */
    SetScheduler.prototype.getPills = function() {
        var self = this;
        var adminLevel = self.session.authentication.user.admin;
        return [
            {
                name: 'set_scheduler',
                title: 'Set Scheduler',
                icon: 'refresh',
                href: '/user/set_scheduler'
            }
        ];
        
    };

    //exports
    return SetScheduler;
};



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
var async = require('async');

module.exports = function ChangePasswordFormControllerModule(pb) {

    //pb dependencies
    var util = pb.util;
    var UserService = pb.UserService;
    var UrlService  = pb.UrlService;

    /**
     * Interface for logged in user to change password
     * @class ChangePasswordFormController
     * @constructor
     * @extends FormController
     */
    function ChangePasswordFormController(){}
    util.inherits(ChangePasswordFormController, pb.FormController);

    /**
     *
     * @method render
     *
     */
     ChangePasswordFormController.prototype.render = function(cb) {
        var self = this;
        var userID = self.session.authentication.user_id;
        var get  = this.query;
        var child_id = userID;
        if(get.user_id != null){
            child_id = get.user_id;
            //console.log(child_id);
        }
        //retrieve user
        var dao = new pb.DAO();
        dao.loadById(userID, 'user', function(err, user) {
            if(util.isError(err) || user === null) {
                self.redirect('/', cb);
                return;
            }
            var data = self.gatherData();
            data.child_id = child_id;
            data.user = user;
            data.parentUser = self.session.authentication.user;

            if(get.user_id != null){
                delete data.navigation[0].active; 
                console.log(data.navigation[0]);
            }
            pb.users.getChildren(userID,  function(error, children) {
                var i = 1;
                if(children != null){
                    children.forEach(function(child) {
                    data.navigation[i] = {
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
                                href: '/user/change_password?user_id=' + child.child_id,
                            }
                        ]
                    };
                    if(get.user_id != null && child.child_id == get.user_id){
                        data.navigation[i].active = 'active';
                    }
                    i = i + 1;
                  });
                }
                self.setPageName(self.ls.get('CHANGE_PASSWORD'));
                self.ts.registerLocal('angular_objects', new pb.TemplateValue(pb.ClientJs.getAngularObjects(data), false));
                self.ts.load('user/change_password', function(err, result) {
                    // console.log(result);
                    cb({content: result});

                });
            });
        });
    };

    /**
     *
     * @method gatherData
     *
     */
    ChangePasswordFormController.prototype.gatherData = function(cb) {
        var self = this;
        var tasks = {

            topMenu: function(callback) {
                callback(null, self.getTopMenu());
            }
        };
        async.parallel(tasks, cb);
        var dao = new pb.DAO();
        var user_id = this.session.authentication.user._id;
        var all_child = new Array();
        
        if (this.session.authentication.user.admin == 1) {
            all_child[0] = {
                id: 'account',
                active: 'active',
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
                active: 'active',
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
        var opts = {
            where: {
                parent_id: user_id+''
            }
        };
        dao.q("member", opts, function(err, children){
            var i = 1;
            if(children != null){
                    children.forEach(function(child) {
                    all_child[i] = {
                        id: 'account'+i,
                        title: child.child_username,
                        icon: 'user',
                        href :'#',
                        dropdown: false,
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
                                href: '/user/change_password'
                            }
                        ]
                        
                    };
                    i = i + 1;
                  });
                }

        });
        
        return {
            navigation: all_child,

            pills: [
                {
                    name: 'change_password',
                    title: this.ls.get('CHANGE_PASSWORD'),
                    icon: 'refresh',
                    href: '/user/change_password'
                }
            ],

            tabs: [
                {
                    active: 'active',
                    href: '#password',
                    icon: 'key',
                    title: this.ls.get('PASSWORD')
                }
            ]
        };
    };

    ChangePasswordFormController.prototype.getTopMenu = function() {
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

    //exports
    return ChangePasswordFormController;
};

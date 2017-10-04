/*
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
     * @class ManageFriend
     * @constructor
     * @extends FormController
     */
    function ManageFriend(){}
    util.inherits(ManageFriend, pb.FormController);
    
    /**
     * Initializes the controller
     * @method init
     * @param {Object} context
     * @param {Function} cb
     */
    ManageFriend.prototype.init = function(context, cb) {
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
        ManageFriend.super_.prototype.init.apply(this, [context, init]);
    };

    /**
     *
     * @method render
     * @param {Function}
     */
     ManageFriend.prototype.render = function(cb) {
        var self = this;
        var dao = new pb.DAO();
        

        var user_id = this.session.authentication.user._id+'';

        this.gatherData(function(err, data) {
            if(util.isError(err)) {
                return cb(err);
            }
            else if (data.user === null) {
                return self.redirect(UrlService.createSystemUrl('/'), cb);
            }
            delete data.user.password;
            var temp_option = [];
            temp_option[0] = "0";
            temp_option[1] = "-1";
            var opts = {
                where: {
                    sender_id: user_id,
                    //accept : 0+''
                    accept: { '$in': temp_option} 
                }
            };
            //get unaccpeted friend's ID
            dao.q("friends", opts, function(err, unaccept){
                var uerID = [];
                var unaccpetedFriendScore = [];
                for (var i = unaccept.length - 1; i >= 0; i--) {
                    uerID[i] = unaccept[i].receiver_id;
                    unaccpetedFriendScore[i] = unaccept[i].score;
                };
                var option = {
                    select: {
                        username : 1,
                        email : 1,
                    },
                    where :pb.DAO.getIdInWhere(uerID)
                };
                    dao.q("user", option, function(err, unaccept_users){
                        var accpet_opts = {
                             where: {
                                sender_id: user_id,
                                accept : 1+''
                            }
                        };
                        for (var i = unaccept_users.length - 1; i >= 0; i--) {
                            for (var j = uerID.length - 1; j >= 0; j--) {
                                if(uerID[j] == unaccept_users[i]._id){
                                    unaccept_users[i].score = unaccpetedFriendScore[j];
                                    unaccept_users[i].accept = unaccept[i].accept;
                                };
                            };
                        };
                        data.unaccpetedFriend = unaccept_users;
                        dao.q("friends", accpet_opts, function(err, accept){
                               var accept_userID = [];
                               var accpetedFriendScore = [];
                               for (var i = accept.length - 1; i >= 0; i--) {
                                    accept_userID[i] = accept[i].receiver_id;
                                    accpetedFriendScore[i] = accept[i].score;
                                }; 
                                var accept_option = {
                                    select: {
                                        username : 1,
                                        email : 1
                                    },
                                    where :pb.DAO.getIdInWhere(accept_userID)
                                };
                                dao.q("user", accept_option, function(err, accept_users){
                                    for (var i = accept_users.length - 1; i >= 0; i--) {
                                        for (var j = accept_userID.length - 1; j >= 0; j--) {
                                            if (accept_userID[j] == accept_users[i]._id) {
                                                accept_users[i].score = accpetedFriendScore[j];
                                            };
                                        };
                                    };
                                    data.accpetedFriend = accept_users;
                                    data.parentUser = self.session.authentication.user;
                                    self.setPageName('Friends');
                                    self.ts.registerLocal('image_title', self.ls.get('USER_PHOTO'));
                                    self.ts.registerLocal('angular_objects', new pb.TemplateValue(pb.ClientJs.getAngularObjects(data), false));
                                    self.ts.load('user/manage_friend', function(err, result) {
                                        //console.log(result);
                                        cb({content: result});
                                    });
                        });

                    });
                    
                });
            });


        });
    };

    /**
     *
     * @method gatherData
     * @param {Function} cb
     * @return {Array}
     */
    ManageFriend.prototype.gatherData = function(cb) {
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
     * @method getNavigation
     * @return {Array}
     */
    ManageFriend.prototype.getNavigation = function() {
        return [
            {
                id: 'friends',
                active: 'active',
                title: 'Friends',
                icon: 'group',
                href: '#',
                dropdown: true,
                children:
                [
                    {
                        id: 'manage',
                        active: 'active',
                        title: 'Manage Friends',
                        icon: 'cog',
                        href: '/user/manage_friend',
                    }
                    // ,
                    // {
                    //     id: 'change_password',
                    //     title: this.ls.get('CHANGE_PASSWORD'),
                    //     icon: 'key',
                    //     href: '/user/change_password',
                    // }
                ]
            }
        ];
    };
    
    /**
     *
     * @method getTabs
     * @return {Array}
     */
    ManageFriend.prototype.getTabs = function() {
        return [
            {
                active: 'active',
                href: '#friend_management',
                icon: 'cog',
                title: 'Friends management'
            },
            {
                href: '#friend_invitation',
                icon: 'plus',
                title: 'Friends invitation'
            }
        ];
    };
    
    /**
     *
     * @method getPills
     * @return {Array}
     */
    ManageFriend.prototype.getPills = function() {
        return [
            {
                name: 'manage_friend',
                title: 'Manage friends',
                icon: 'refresh',
                href: '/user/manage_friend'
            }
        ];
    };

    ManageFriend.prototype.getTopMenu = function() {
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
    return ManageFriend;
};

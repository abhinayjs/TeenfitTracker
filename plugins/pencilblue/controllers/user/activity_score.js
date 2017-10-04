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
    var util = pb.util;
    var UserService = pb.UserService;
    var UrlService = pb.UrlService;

    /**
     * Interface for logged in user to manage account information
     * @class ActivityScore
     * @constructor
     * @extends FormController
     */
    function ActivityScore() {}
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

            if (util.isError(err)) {
                return cb(err);
            } else if (data.user === null) {
                return self.redirect(UrlService.createSystemUrl('/user/login'), cb);
            }
            delete data.user.password;
            var yesterdayDate = self.getDate(-1);
            var user_id = self.session.authentication.user._id + '';

            if (self.session.authentication.user.admin == 1) {
                var criteria = {
                    where: {
                        user_id: self.session.authentication.user._id.toString(),
                        isPlayed: false
                    }
                };
                data.playLaterGames = false;
                dao.q("Game_Data", criteria, function(err, game_data) {
                    data.tokensRemaining = game_data.length;
                    if (err) {
                        console.log(err);
                    } else if (game_data.length == 0) {
                        data.playLaterGames = false;
                    } else {
                        for (var i = 0; i < game_data.length; i++) {
                            if (!game_data[i].isPlayed) {
                                data.playLaterGames = true;
                                break;
                            }
                        }
                    }
                });

                var option_score = {
                    where: {
                        user_id: self.session.authentication.user._id.toString(),
                        date: yesterdayDate
                    }
                };
                dao.q("PAL", option_score, function(err, pal_score) {
                    var children_info = [];
                    children_info[0] = self.session.authentication.user;
                    children_info[0].pal = pal_score[0];

                    var randomInt = Math.floor(Math.random() * (0 - 6 + 1) + 0);
                    var today = new Date().getDay();
                    // if (today == pal_score[0].mysteryStep){
                    //     data.showMysteryStep = true;
                    // }else{
                    //     data.showMysteryStep = false;
                    // }

                    data.daily_scores = children_info;
                    // console.log(data.daily_scores);
                    data.parentUser = self.session.authentication.user;
                    self.setPageName('Activity Score');
                    self.ts.registerLocal('image_title', self.ls.get('USER_PHOTO'));
                    self.ts.registerLocal('angular_objects', new pb.TemplateValue(pb.ClientJs.getAngularObjects(data), false));
                    self.ts.load('user/activity_score', function(err, result) {
                        cb({ content: result });
                    });
                });
            } else {
                var opts = {
                    where: {
                        parent_id: user_id
                    }
                };
                var childIDs = [];
                dao.q("member", opts, function(err, members) {
                    
                    for (var i = members.length - 1; i >= 0; i--) {
                        childIDs[i] = self.getObjectId(members[i].child_id);
                    };
                    console.log(childIDs);
                    
                    var option = {
                        where: {
                            _id: { '$in': childIDs }
                        }
                    };
                    console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<:" + option);
                    dao.q("user", option, function(err, children) {
                        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~:" + children.length);

                        var children_info = [];
                        for (var i = children.length - 1; i >= 0; i--) {
                            children_info[i] = children[i];
                        };
                        var option_fitbitProfile = {
                            where: {
                                userid: { '$in': childIDs }
                            }
                        };

                        // for (var i = 0; i < childIDs.length; i++) {
                        //     var option = {
                        //         where: {
                        //             _id: { '$in': childIDs[i] }
                        //         }
                        //     };


                        //     dao.q("PAL", option_score, function(err, pal_score) {
                        //         console.log("*******************************:" + pal_score.length);
                        //         for (var i = 0; i < children_info.length; i++) {
                        //             for (var j = 0; j < pal_score.length; j++) {
                        //                 if (children_info[i]._id + "" == pal_score[j].user_id + "") {
                        //                     children_info[i].pal = pal_score[j];
                        //                     break;
                        //                 };
                        //             };
                        //         };
                        //     });
                        // }
                        var option_score = {
                        where: {
                            user_id: { '$in': childIDs.map(String) },
                            // user_id: childIDs[2]+"",
                            date: yesterdayDate
                        }
                    };
                    console.log(yesterdayDate);
                        dao.q("PAL", option_score, function(err, pal_score) {
                            console.log("*******************************:" + pal_score[0]);
                            for (var i = 0; i < children_info.length; i++) {
                                for (var j = 0; j < pal_score.length; j++) {
                                    if (children_info[i]._id + "" == pal_score[j].user_id + "") {
                                        children_info[i].pal = pal_score[j];
                                        break;
                                    };
                                };
                            };
                            var parentUserId = self.session.authentication.user_id;

                            pb.users.getChildrenInUser(parentUserId, function(errC, children) {
                                if (util.isError(errC)) {
                                    return cb(errC);
                                }
                                data.children = children;
                                data.daily_scores = children_info;
                                data.parentUser = self.session.authentication.user;

                                self.setPageName('Activity Score');
                                self.ts.registerLocal('image_title', self.ls.get('USER_PHOTO'));
                                self.ts.registerLocal('angular_objects', new pb.TemplateValue(pb.ClientJs.getAngularObjects(data), false));
                                self.ts.load('user/activity_score', function(err, result) {
                                    cb({ content: result });
                                });
                            }); //end getRC

                        }); //end q "PAL"
                    }); //end q user
                }); //end q member
            } //end else
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

    ActivityScore.prototype.compareTwoDates = function(startOn, nextOn) {
        var so = new Date(startOn),
            no = new Date(nextOn);

        return so.getTime() <= no.getTime();
    };

    ActivityScore.prototype.getObjectId = function(oid) {
        try {
            return new ObjectID(oid + '');
        } catch (err) {
            return oid;
        }
    };

    /**
     *
     * @method getNavigation
     * @return {Array}
     */
    ActivityScore.prototype.getNavigation = function() {
        return [{
            id: 'activity_tracking',
            active: 'active',
            title: this.ls.get('Actitivity Tracking'),
            icon: 'area-chart',
            href: '#',
            dropdown: true,
            children: [
                //disable charts
                {
                    id: 'activity_tracking',
                    title: this.ls.get('Display Tracking Charts'),
                    icon: 'key',
                    href: '/user/activity_tracking',
                }, {
                    id: 'activity_report',
                    title: this.ls.get('Display Tracking Report'),
                    icon: 'key',
                    href: '/user/activity_report',
                }, {
                    id: 'activity_score',
                    active: 'active',
                    title: this.ls.get('Display Tracking Score'),
                    icon: 'clipboard',
                    href: '/user/activity_score',
                }
            ]
        }];
    };

    /**
     *
     * @method getTabs
     * @return {Array}
     */
    ActivityScore.prototype.getTabs = function() {
        return [{
                active: 'active',
                href: '#daily_score_report',
                icon: 'cog',
                title: 'Score Report'
            }, {
                href: '#play_game_later',
                icon: 'gamepad',
                title: 'Games'
            }
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
        return [{
            name: 'activity_tracking',
            title: this.ls.get('Activity Tracking'),
            icon: 'refresh',
            href: '/user/activity_tracking'
        }];
    };

    ActivityScore.prototype.getTopMenu = function() {
        return [{
                name: 'manage_account',
                title: 'Manage Account',
                icon: 'user',
                // icon: '/img/icons/64/blue-35.png',
                href: '/user/manage_account'
            }, {
                name: 'manage_friend',
                title: 'Manage Friend',
                icon: 'group',
                href: '/user/manage_friend'
            }, {
                name: 'manage_calendar',
                title: 'Activity Calendar',
                icon: 'calendar',
                // icon: '/img/icons/64/blue-06.png',
                href: '/user/manage_calendar'
            }, {
                name: 'manage_daily',
                title: 'Manage Daily Activity',
                icon: 'tasks',
                href: '/user/manage_daily'
            }, {
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
            }, {
                name: 'help_doc',
                title: 'Help Documentation',
                icon: 'question-circle',
                href: '/user/help_doc'
            }, {
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

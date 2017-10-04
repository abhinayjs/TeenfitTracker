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
     * @class ManageGoals
     * @constructor
     * @extends FormController
     */
    function ManageGoals(){}
    util.inherits(ManageGoals, pb.FormController);
    
    /**
     * Initializes the controller
     * @method init
     * @param {Object} context
     * @param {Function} cb
     */
    ManageGoals.prototype.init = function(context, cb) {
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
        ManageGoals.super_.prototype.init.apply(this, [context, init]);
    };

    /**
     *
     * @method render
     * @param {Function}
     */
     ManageGoals.prototype.render = function(cb) {
        var self = this;
        var dao = new pb.DAO();
        var get  = this.query;

        var filePath = path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'data', 'prizes.json');
        // console.log(filePath);
        pb.users.loadJSONFile(filePath,function(err,types){
            if(util.isError(err)) {
                    return cb(err);
                }
        
            self.gatherData(get.user_id,function(err, data) {
                    if(util.isError(err)) {
                        return cb(err);
                    }
                    else if (data.user === null) {
                        return self.redirect(UrlService.createSystemUrl('/'), cb);
                    }

                    delete data.user.password;
                    data.adminLevel = self.session.authentication.user.admin;
                    if(data.adminLevel == '1'){
                        var opt = {
                                where : {
                                    user_id : self.session.authentication.user_id
                                }
                        };
                        dao.q("goals", opt, function(err, goals){
                            for (var i = 0; i < goals.length; i++) {
                                goals[i].username = self.session.authentication.user.first_name + " "+ self.session.authentication.user.last_name;
                            };
                            data.goals = goals;
                            data.types = types;
                            data.parentUser = self.session.authentication.user;
                            self.setPageName('Manage Goals');
                            self.ts.registerLocal('angular_objects', new pb.TemplateValue(pb.ClientJs.getAngularObjects(data), false));
                            self.ts.load('user/manage_goals', function(err, result) {
                                cb({content: result});
                            });
                        });
                    }else{
                        pb.users.getChildren(self.session.authentication.user._id,  function(error, children) {
                            var childIDs = new Array();
                            var child_id = new Array();
                            for (var i = 0; i < children.length; i++) {
                                childIDs[i] = pb.DAO.getObjectId(children[i].child_id);
                                child_id[i] = children[i].child_id;
                            };
                            if(get.user_id != null){
                                    var opts_1 = {
                                        where : {
                                            user_id : get.user_id+""
                                        }
                                    };
                                    pb.users.getUserByUserID(get.user_id, function(err, child_user){
                                        console.log(child_user);
                                    self.setPageName('Manage Goals');
                                    data.user = child_user;
                                    data.parentUser = self.session.authentication.user;
                                    delete data.user.password;
                                    var opts_child = {
                                        where:{
                                            _id:{'$in': childIDs}
                                        }
                                    };
                                    dao.q('goals', opts_1, function(err, goals) {
                                        if (util.isError(err)) {
                                            return cb(err);
                                        }
                                        for (var i = 0; i < goals.length; i++) {
                                            goals[i].username = child_user.first_name + " "+ child_user.last_name;
                                        };
                                        data.goals = goals;
                                        data.children = children;
                                        data.types = types;
                                        data.parentUser = self.session.authentication.user;
                                        self.ts.registerLocal('angular_objects', new pb.TemplateValue(pb.ClientJs.getAngularObjects(data), false));
                                        self.ts.load('user/manage_goals', function(err, result) {
                                            cb({content: result});
                                        });
                                    });
                                    
                                });
                            }else{
                                var option = {
                                    where :{ user_id: { '$in': child_id} }
                                };
                                dao.q("goals", option, function(err, goals){
                                    var opts_child = {
                                        where:{
                                            _id:{'$in': childIDs}
                                        }
                                    };
                                    dao.q('user', opts_child, function(err, children_infor){
                                        for (var i = 0; i < goals.length; i++) {
                                            for (var j = 0; j < children_infor.length; j++) {
                                                if(goals[i].user_id == children_infor[j]._id+""){
                                                    goals[i].username = children_infor[j].first_name + " "+children_infor[j].last_name;
                                                }
                                            };
                                        };
                                        data.goals = goals;
                                        data.children = children;
                                        data.types = types;
                                        data.parentUser = self.session.authentication.user;
                                        self.ts.registerLocal('angular_objects', new pb.TemplateValue(pb.ClientJs.getAngularObjects(data), false));
                                        self.ts.load('user/manage_goals', function(err, result) {
                                            cb({content: result});
                                        });
                                    });
                                });
                            }
                    });
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
    ManageGoals.prototype.gatherData = function(userid,cb) {
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
    ManageGoals.prototype.getNavigation = function(userid) {
         var user_name = this.session.authentication.user.username;
        //console.log(this.session.authentication.user._id);
        var all_child = new Array();
        all_child[0] = {
                id: 'daily',
                title: 'Goal Management',
                icon: 'joomla',
                href: '#',
                dropdown: true,
                children:
                [
                    {
                        id: 'manage',
                        active: 'active',
                        title: 'Manage Goals',
                        icon: 'cog',
                        href: '/user/manage_goals',
                    },
                    {
                        id: 'set_goal',
                        title: this.ls.get('Set a goal'),
                        icon: 'plus',
                        href: '#'
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
                    id: child.child_id,
                    title: child.child_username,
                    icon: 'user',
                    href :'#',
                    dropdown: true,
                    children:
                    [
                        {
                            id: 'manage',
                            active: 'active',
                            title: 'Manage Goals',
                            icon: 'cog',
                            href: '/user/manage_goals?user_id=' + child.child_id
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
    ManageGoals.prototype.getTabs = function() {
        return [
            {
                active: 'active',
                href: '#goals_management',
                icon: 'cog',
                title: 'Goal management'
            }
        ];
    };
    
    /**
     *
     * @method getPills
     * @return {Array}
     */
    ManageGoals.prototype.getPills = function() {
        return [
            {
                name: 'manage_goals',
                title: 'Manage Goals',
                icon: 'refresh',
                href: '/user/manage_goals'
            }
        ];
    };

    ManageGoals.prototype.getTopMenu = function() {
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
    return ManageGoals;
};

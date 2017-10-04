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
     * @class HelpDoc
     * @constructor
     * @extends FormController
     */
    function HelpDoc(){}
    util.inherits(HelpDoc, pb.FormController);
    
    /**
     * Initializes the controller
     * @method init
     * @param {Object} context
     * @param {Function} cb
     */
    HelpDoc.prototype.init = function(context, cb) {
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
        HelpDoc.super_.prototype.init.apply(this, [context, init]);
    };

    /**
     *
     * @method render
     * @param {Function}
     */
    HelpDoc.prototype.render = function(cb) {
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
            self.setPageName('Help Documentation');
            self.ts.registerLocal('angular_objects', new pb.TemplateValue(pb.ClientJs.getAngularObjects(data), false));
            self.ts.load('user/help_doc', function(err, result) {
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
    HelpDoc.prototype.gatherData = function(cb) {
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
    

    
    
    HelpDoc.prototype.getTopMenu = function() {
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
    return HelpDoc;
};



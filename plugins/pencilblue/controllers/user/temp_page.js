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
            var user_id = self.session.authentication.user._id + '';

            if (self.session.authentication.user.admin == 1) {
                
                    data.parentUser = self.session.authentication.user;
                    self.setPageName('Activity Score');
                    self.ts.registerLocal('image_title', self.ls.get('USER_PHOTO'));
                    self.ts.registerLocal('angular_objects', new pb.TemplateValue(pb.ClientJs.getAngularObjects(data), false));
                    self.ts.load('user/temp_page', function(err, result) {
                        cb({ content: result });
                    });
            } else {

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
            user: function(callback) {
                self.service.get(self.session.authentication.user_id, callback);
            }
        };
        async.parallel(tasks, cb);
    };
    //exports
    return ActivityScore;
};

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
module.exports = function ProfileModule(pb) {

    //pb dependencies
    var util = pb.util;
    var BaseController = pb.BaseController;
    var FormController = pb.FormController;

    /**
     * Edits the logged in user's information
     */
    function Profile() {}
    util.inherits(Profile, FormController);

    Profile.prototype.render = function(cb) {
        var self = this;

        this.getJSONPostParams(function(err, post) {
            //sanitize
            post.email = BaseController.sanitize(post.email);
            post.username = BaseController.sanitize(post.username);
            post.first_name = BaseController.sanitize(post.first_name);
            post.last_name = BaseController.sanitize(post.last_name);
            post.photo = BaseController.sanitize(post.photo);
            // post.middle_name = = BaseController.sanitize(post.middle_name);
            console.log(post);


            var memberWhere = {
                child_id: post._id
            };
            var memberUpdate = {
                $set: {
                    child_username: post.username
                }
            };
            var updateOptions = {
                multi: true
            };

            var dao = new pb.DAO();
            var userId = post._id;
            dao.loadById(post._id, 'user', function(err, user) {
                if (util.isError(err) || user === null) {
                    cb({
                        code: 501,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
                    });
                    return;
                }
                // console.log(user);
                // console.log(post[pb.DAO.getIdField()]);
                //update the document
                delete post[pb.DAO.getIdField()];
                // console.log(post);
                // self.validateUniques(post.email, function(err, results) {
                //   var errMsg = null;
                //   // console.log(user);
                //   // console.log(results);
                //   if (results.verified_email > 0 ) {
                //     errMsg = self.ls.get('EXISTING_EMAIL');
                //   }
                //   if (errMsg) {
                //     cb({
                //       code: 400,
                //       content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, errMsg)
                //     });
                //     return;
                //   }
                pb.DocumentCreator.update(post, user);
                dao.save(user, function(err, result) {
                    if (util.isError(err)) {
                        cb({
                            code: 502,
                            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING') + ". Please check your username or email.")
                        });
                        return;
                    }
                    if (userId == self.session.authentication.user_id) {
                        self.session.authentication.user = user;
                        self.session.locale = user.locale || self.session.locale;
                    }
                    dao.updateFields('member', memberWhere, memberUpdate, updateOptions, function(err, result) {
                        cb({
                            content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, self.ls.get('ACCOUNT') + ' ' + self.ls.get('EDITED'))
                        });
                    }); //end save
                    // });//validate Uniques
                }); //end loadbyid
            }); //get post
        });
    };

    Profile.prototype.validateUniques = function(email, cb) {
        var dao = new pb.DAO();
        var tasks = {
            verified_email: function(callback) {
                dao.count('user', { email: email }, callback);
            }
        };
        async.series(tasks, cb);
    };

    //exports
    return Profile;
};

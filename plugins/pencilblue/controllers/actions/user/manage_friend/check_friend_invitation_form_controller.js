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

module.exports = function CheckFriendInvitationFormModule(pb) {

    //pb dependencies
    var util = pb.util;
    var BaseController = pb.BaseController;
    var FormController = pb.FormController;

    /**
     * Creates an READER level user
     */
    function CheckFriendInvitationForm() {}
    util.inherits(CheckFriendInvitationForm, FormController);

    CheckFriendInvitationForm.prototype.render = function(cb) {
        var self = this;

        this.getJSONPostParams(function(err, post) {
            var errMsg = null;
            post.screenname = BaseController.sanitize(post.screenname);
            post.parentEmailId = BaseController.sanitize(post.parentEmailId);
            if (post.screenname == self.session.authentication.user.username) {
                errMsg = "You can not invite yourself!"
                cb({ content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, errMsg, false) });
                return;
            }

            // console.log(post)
            var message = self.hasRequiredParams(post, self.getRequiredFields());
            if (message) {
                cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, message)
                });
                return;
            }
            var returnData = {};
            pb.users.isUserNameOrEmailTaken(post.screenname, '', null, function(error, isTaken) {
                // console.log(isTaken);
                if (isTaken) {
                    returnData.sender_id = self.session.authentication.user._id;
                    returnData.sender_username = self.session.authentication.user.username;
                    returnData.sender_email = self.session.authentication.user.email;

                    var dao = new pb.DAO();
                    var opts1 = {
                        where: {
                            username: post.screenname + ""
                        }
                    };
                    dao.q('user', opts1, function(err, data) {
                        // console.log(data);
                        console.log(">>>>>>>>>>>>" + data[0].email);
                        if (util.isError(err)) {
                            return cb(err, null);
                        }
                        returnData.receiver_id = data[0]._id;
                        returnData.receiver_username = data[0].username;
                        returnData.receiver_email = data[0].email;
                        returnData.receiver_age = data[0].age;
                        var opts2 = {
                            where: {
                                child_id: data[0]._id + ""
                            }
                        };
                        // console.log(opts2);
                        dao.q('member', opts2, function(err2, data2) {
                            if (util.isError(err2)) {
                                return cb(err2, null);
                            }
                            console.log(data2);
                            // returnData.cao = "caonima";
                            if (data2.length == 0) {

                                var parentId = data[0]._id;
                                var parentUsername = data[0].username;
                                dao.loadById(parentId, 'user', function(err3, data3) {
                                    if (util.isError(err3)) {
                                        return cb(err3, null);
                                    }
                                    // console.log(data3);
                                    if (data3.email != post.parentEmailId) {
                                        errMsg = "Email Id of parent is invalid. Please check it.";
                                        cb({ content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, errMsg, false) });
                                        return;
                                    }

                                    returnData.receiver_parent_id = parentId;
                                    returnData.receiver_parent_username = parentUsername;

                                    returnData.parentEmailId = post.parentEmailId;
                                    cb({ content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, "", returnData) });
                                }); //end load        
                            } else {
                                var parentId = data2[0].parent_id;
                                var parentUsername = null;

                                // console.log("nani"+data2[0].parent_id);
                                dao.loadById(parentId, 'user', function(err3, data3) {
                                    if (util.isError(err3)) {
                                        return cb(err3, null);
                                    }
                                    // console.log(data3);
                                    console.log("AGE:" + parseInt(returnData.receiver_age));
                                    console.log("@@@@@@@@@@"+data3.email +":::"+returnData.receiver_email + "****" + post.parentEmailId);
                                    if (parseInt(returnData.receiver_age) > 13) {
                                        // if (data3.email != post.receiver_email) {
                                          console.log("age is less than 13");
                                        if (returnData.receiver_email != post.parentEmailId) {
                                            errMsg = "Email Id of friend is invalid. Please check it.";
                                            cb({ content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, errMsg, false) });
                                            return;
                                        }
                                    } else {
                                        if (data3.email != post.parentEmailId) {
                                            errMsg = "Email Id of parent is invalid. Please check it.";
                                            cb({ content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, errMsg, false) });
                                            return;
                                        }
                                    }

                                    parentUsername = data3.username;

                                    returnData.receiver_parent_id = parentId;
                                    returnData.receiver_parent_username = parentUsername;
                                    returnData.parentEmailId = post.parentEmailId;
                                    cb({ content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, "", returnData) });
                                }); //end load
                            }

                        });
                    });
                } else {
                    errMsg = "'" + post.screenname + "'" + " is not existing";
                    cb({ content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, errMsg, false) });
                }

            });


        }); //end getJson
    }; //end render

    CheckFriendInvitationForm.prototype.getRequiredFields = function() {
        return ['screenname', 'parentEmailId'];
    };


    //exports
    return CheckFriendInvitationForm;
};

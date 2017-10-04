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

module.exports = function AddFriendModule(pb) {

  //pb dependencies
  var util = pb.util;
  var BaseController = pb.BaseController;
  var FormController = pb.FormController;

  /**
  * Creates an READER level user
  */
  function AddFriend(){}
  util.inherits(AddFriend, FormController);

  AddFriend.prototype.render = function(cb) {
    var self = this;

    this.getJSONPostParams(function(err, post) {
      post.screenname = BaseController.sanitize(post.screenname);
      post.parentEmailId = BaseController.sanitize(post.parentEmailId);
      
      console.log(post);
      var message = self.hasRequiredParams(post, self.getRequiredFields());
      if(message) {
        cb({
          code: 401,
          content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, message)
        });
        return;
      }

      //check for validation failures
          // var errMsg = null;
          // if (results.verified_username > 0 || results.unverified_username > 0) {
          //           errMsg = self.ls.get('EXISTING_USERNAME');
          // }
          // else if (results.verified_email > 0 || results.unverified_email > 0) {
          //   errMsg = self.ls.get('EXISTING_EMAIL');
          // }

          // if (errMsg) {
          //   cb({
          //     code: 400,
          //     content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, errMsg)
          //   });
          //   return;
          // }
       var returnData = {};
       pb.users.isUserNameOrEmailTaken(post.screenname, '', null, function(error, isTaken) {
            if(isTaken) {
                returnData.sender_id = self.session.authentication.user._id;
                var errMsg = null;
                var dao   = new pb.DAO();
                var opts1 = {
                    where: {
                        username: post.screenname + ""
                    }
                };
                dao.q('user', opts1, function(err, data){
                    console.log(data);
                    if (util.isError(err)) {
                        return cb(err, null);
                    }
                    returnData.receiver_id = data[0]._id;
                    var opts2 = {
                        where: {
                            child_id: data[0]._id + ""
                        }
                    };
                    console.log(opts2);
                    dao.q('member',opts2, function(err2,data2){
                        if (util.isError(err2)) {
                            return cb(err2, null);
                        }
                        console.log(data2);
                        if(data2.length == 0){
                            returnData.receiver_parent_id = data[0]._id;
                        }else{
                            returnData.receiver_parent_id = data2[0].parent_id;
                        }
                        console.log(returnData);
                        cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, get.username + ' is existing', returnData)});
                    }); 
                }); 
                
            }else{
                errMsg = post.screenname + " is not existing"；
                cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, errMsg, false)});
                return;
            }

    });
  });

  AddFriend.prototype.getRequiredFields = function() {
    return ['screenname', 'parentEmailId'];
  };

  AddFriend.prototype.validateUniques = function(user, cb) {
    var dao = new pb.DAO();
    var tasks = {
      verified_username: function(callback) {
        dao.count('user', {username: user.username}, callback);
      },
      verified_email: function(callback) {
        dao.count('user', {email: user.email}, callback);
      }
    };
    async.series(tasks, cb);
  };

  //exports
  return AddFriend;
};

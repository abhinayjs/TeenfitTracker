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
          var errMsg = null;
          post.sender_id = BaseController.sanitize(post.sender_id);
          post.receiver_id = BaseController.sanitize(post.receiver_id);
          post.receiver_parent_id = BaseController.sanitize(post.receiver_parent_id);
          post.parentEmailId = BaseController.sanitize(post.parentEmailId);
          post.sender_username = BaseController.sanitize(post.sender_username);
          post.receiver_username = BaseController.sanitize(post.receiver_username);
          post.receiver_parent_username = BaseController.sanitize(post.receiver_parent_username);
          post.sender_email = BaseController.sanitize(post.sender_email);
          post.receiver_email = BaseController.sanitize(post.receiver_email);

          post.accept = "0";

          var postData = {};
          postData.sender_id = post.sender_id;
          postData.receiver_id = post.receiver_id;
          postData.accept = post.accept;
          postData.score = parseInt(Math.random() * 1000).toString();

          var friendData = {};
          friendData.parent_username = post.receiver_parent_username;
          friendData.sender_username = post.sender_username;
          friendData.receiver_username = post.receiver_username;
          friendData.parentEmailId = post.parentEmailId;
          friendData.sender_id = post.sender_id;
          friendData.receiver_id = post.receiver_id;
          friendData.receiver_parent_id = post.receiver_parent_id;
          friendData.sender_email = post.sender_email;
          friendData.receiver_email = post.receiver_email;

          var collection = 'friends';
          var friend = pb.DocumentCreator.create(collection, postData);
          // console.log(friend);
          var dao = new pb.DAO();
          var where = {
            sender_id : post.sender_id,
            receiver_id : post.receiver_id
          };
          dao.loadByValues(where,collection, function(err,data){
            if(data == null){
                dao.save(friend, function(err, data) {
                  if(util.isError(err)) {
                    cb({
                      code: 500,
                      content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
                    });
                    return;
                  }
                  pb.users.sendInvitationEmail(friendData, util.cb);
                  cb({
                    content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, "",true)
                  });
                });
            }else{
                errMsg = "The relationship has already existed. You can not invite again.";
                cb({
                  content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, errMsg, false)
                });
                return;
            }
            
          });
          
        
       


        });//end getJson
      };//end render

     

      //exports
      return AddFriend;
};

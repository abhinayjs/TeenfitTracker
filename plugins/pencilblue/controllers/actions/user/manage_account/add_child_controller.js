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

module.exports = function AddChildModule(pb) {

  //pb dependencies
  var util = pb.util;
  var BaseController = pb.BaseController;
  var FormController = pb.FormController;

  /**
  * Creates an READER level user
  */
  function AddChild(){}
  util.inherits(AddChild, FormController);

  AddChild.prototype.render = function(cb) {
    var self = this;

    this.getJSONPostParams(function(err, post) {
      post.position   = '';
      post.photo      = null;
      post.admin      = '1';
      post.username = BaseController.sanitize(post.username);
      post.email      = BaseController.sanitize(post.email);
      post.first_name = BaseController.sanitize(post.first_name);
      post.last_name  = BaseController.sanitize(post.last_name);
      
      console.log(post.username + " , " + post.admin + " , " + post.email + " , " + post.first_name+ " , " + post.last_name);

      
      var message = self.hasRequiredParams(post, self.getRequiredFields());
      if(message) {
        cb({
          code: 400,
          content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, message)
        });
        return;
      }

      var contentService = new pb.ContentService();
      contentService.getSettings(function(err, contentSettings) {
        //TODO handle error

        var collection      = 'user';
        var successMsg      = self.ls.get('ACCOUNT_CREATED');

        var user = pb.DocumentCreator.create(collection, post);

        self.validateUniques(user, function(err, results) {
          if(util.isError(err)) {
            cb({
              code: 400,
              content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('EXISTING_USERNAME'))
            });
            return;
          }

          //check for validation failures
          var errMsg = null;
          if (results.verified_username > 0 || results.unverified_username > 0) {
                    errMsg = self.ls.get('EXISTING_USERNAME');
          }
          else if (results.verified_email > 0 || results.unverified_email > 0) {
            errMsg = self.ls.get('EXISTING_EMAIL');
          }

          if (errMsg) {
            cb({
              code: 400,
              content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, errMsg)
            });
            return;
          }

          var dao = new pb.DAO();
          dao.save(user, function(err, data) {
            if(util.isError(err)) {
              cb({
                code: 500,
                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
              });
              return;
            }
            
            cb({
              content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, "child '" + post.username + "' has been added.",data)
            });
            //send email for verification when required
            if (contentSettings.require_verification) {
              pb.users.sendVerificationEmail(user, util.cb);
            }
          });//end save
        });//self.val
      });//contentservice
    });//get Json
  };//render

  AddChild.prototype.getRequiredFields = function() {
    return ['username', 'email', 'password', 'confirm_password'];
  };

  AddChild.prototype.validateUniques = function(user, cb) {
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
  return AddChild;
};


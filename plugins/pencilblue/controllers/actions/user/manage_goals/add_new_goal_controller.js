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

module.exports = function AddGoalModule(pb) {

      //pb dependencies
      var util = pb.util;
      var BaseController = pb.BaseController;
      var FormController = pb.FormController;

      /**
      * Creates an READER level user
      */
      function AddGoal(){}
      util.inherits(AddGoal, FormController);

      AddGoal.prototype.render = function(cb) {
        var self = this;

        this.getJSONPostParams(function(err, post) {
          var errMsg = null;
          post.user_id = BaseController.sanitize(post.user_id);
          post.goalName = BaseController.sanitize(post.goalName);
          post.goal = BaseController.sanitize(post.goal);
          post.child_username = BaseController.sanitize(post.child_username);
          
          var postData = {};
          postData.name = post.goalName;
          postData.goal = post.goal;
          postData['type'] = post.type;
          postData.user_id = post.user_id;
          postData.finished = "false";

          var collection = 'goals';
          var newGoal = pb.DocumentCreator.create(collection, postData);
          var dao = new pb.DAO();
    
          dao.save(newGoal, function(err, data) {
            if(util.isError(err)) {
              cb({
                code: 500,
                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
              });
              return;
            }
            cb({
              content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, "Add a new goal successully")
            });
          });


        });//end getJson
      };//end render

     

      //exports
      return AddGoal;
};

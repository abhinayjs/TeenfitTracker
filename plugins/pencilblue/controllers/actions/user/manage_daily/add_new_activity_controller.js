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

module.exports = function AddActivityModule(pb) {

      //pb dependencies
      var util = pb.util;
      var BaseController = pb.BaseController;
      var FormController = pb.FormController;

      /**
      * Creates an READER level user
      */
      function AddActivity(){}
      util.inherits(AddActivity, FormController);

      AddActivity.prototype.render = function(cb) {
        var self = this;

        this.getJSONPostParams(function(err, post) {
          var errMsg = null;
          post.activityName = BaseController.sanitize(post.activityName);
          post.activityAddress = BaseController.sanitize(post.activityAddress);
          post.activityDescription = BaseController.sanitize(post.activityDescription);
          post.activityStart_date = BaseController.sanitize(post.activityStart_date);
          post.activityEnd_date = BaseController.sanitize(post.activityEnd_date);
          post.user_id = BaseController.sanitize(post.user_id);
          post.activityMETS = BaseController.sanitize(post.activityMETS);

          var postData = {};
          postData.event_name = post.activityName;
          postData.event_address = post.activityAddress;
          postData.event_description = post.activityDescription;
          postData.start_date = post.activityStart_date;
          postData.end_date = post.activityEnd_date;
          postData.user_id = post.user_id;
          postData.finished = "false";
          postData.scheduledMETS = post.activityMETS;
          postData.durationMETS = 0;
          var startDate = new Date(post.activityStart_date);       
          var endDate = new Date(post.activityEnd_date);
          //postData.durationTime = (endDate - startDate)/60000 + "";
          postData.durationTime = 0;

          // console.log(postData);

          var collection = 'events';
          var newEvent = pb.DocumentCreator.create(collection, postData);
          var dao = new pb.DAO();
          // delete newEvent._id;
          // console.log(newEvent);
          dao.save(newEvent, function(err, data) {
            if(util.isError(err)) {
              cb({
                code: 500,
                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
              });
              return;
            }
            
            cb({
              content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, "Add a new activity successully", true)
            });
          });


        });//end getJson
      };//end render

     

      //exports
      return AddActivity;
};

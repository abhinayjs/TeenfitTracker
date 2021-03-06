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

module.exports = function FriendManagementModule(pb) {

  //pb dependencies
  var util = pb.util;
  var BaseController = pb.BaseController;
  var FormController = pb.FormController;

  /**
  * Creates an READER level user
  */
  function FriendManagement(){}
  util.inherits(FriendManagement, FormController);

  FriendManagement.prototype.render = function(cb) {
    var self = this;
    this.getJSONPostParams(function(err, post) {
      post.screenname = BaseController.sanitize(post.screenname);
      
      console.log(post.screenname + "2222");
      return;
      
      var contentService = new pb.ContentService();
      contentService.getSettings(function(err, contentSettings) {
        var collection      = 'member';
        var member = pb.DocumentCreator.create(collection, post);
        var dao = new pb.DAO();
          dao.save(member, function(err, data) {
            if(util.isError(err)) {
              cb({
                code: 500,
                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
              });
              return;
            }
            
            cb({
              content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, "Add member successfully")
            });
          });//end save

      });

      
  

    });//end getJSONPostParam
  };//end render

  FriendManagement.prototype.getRequiredFields = function() {
    return ['parent_username', 'child_username'];
  };


  //exports
  return FriendManagement;
};

  



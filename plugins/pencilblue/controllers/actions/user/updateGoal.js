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

module.exports = function UpdateGoalModule(pb) {

  //pb dependencies
  var util = pb.util;
  var BaseController = pb.BaseController;
  var FormController = pb.FormController;

  /**
  * Edits the logged in user's information
  */
  function UpdateGoal(){}
  util.inherits(UpdateGoal, FormController);

  UpdateGoal.prototype.render = function(cb) {
    var self = this;

    this.getJSONPostParams(function(err, post) {
      //sanitize
      post._id      = BaseController.sanitize(post._id);
      post.name      = BaseController.sanitize(post.name);
      post.type   = BaseController.sanitize(post.type);
      post.goal   = BaseController.sanitize(post.goal);
      //post.finished = BaseController.sanitize(post.finished);


      var dao = new pb.DAO();
     
      dao.loadById(post._id,'goals', function(err, goal) {
        //console.log(goal);
        if(util.isError(err) || goal === null) {
          cb({
            code: 500,
            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
          });
          return;
        }

        //update the document
        delete post._id;

        pb.DocumentCreator.update(post, goal);
        goal.object_type = 'goals';
        //console.log(goal);
        dao.save(goal, function(err, result) {
          if(util.isError(err)) {
            cb({
              code: 500,
              content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
            });
            return;
          }
         
          
          cb({
            content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, 'Goal' + ' ' + self.ls.get('EDITED'))
          });
        });
      });

    });
  };

  //exports
  return UpdateGoal;
};

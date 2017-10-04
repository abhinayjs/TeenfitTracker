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

module.exports = function DeleteEventModule(pb) {

  //pb dependencies
  var util = pb.util;
  var BaseController = pb.BaseController;
  var FormController = pb.FormController;

  /**
  * Edits the logged in user's information
  */
  function DeleteEvent(){}
  util.inherits(DeleteEvent, FormController);

  DeleteEvent.prototype.render = function(cb) {
    var self = this;

    this.getJSONPostParams(function(err, post) {
      //sanitize
      post._id = BaseController.sanitize(post._id);
      post.event_name = BaseController.sanitize(post.event_name);
      post.event_address = BaseController.sanitize(post.event_address);
      post.event_description = BaseController.sanitize(post.event_description);
      post.start_date = BaseController.sanitize(post.start_date);
      post.end_date = BaseController.sanitize(post.end_date);
      post.user_id = BaseController.sanitize(post.user_id);
      post.finished = BaseController.sanitize(post.finished);

      var repeat_id = BaseController.sanitize(post.repeat_id);
      var isRepeat =  BaseController.sanitize(post.isRepeated);
      // console.log(repeat_id);
      // console.log(isRepeat);
      delete post.repeat_id;
      delete post.isRepeated;
      var dao = new pb.DAO();
      //console.log(new Date(post.start_date));
      if(isRepeat == 'true'){
        var opts = {
          where : {repeat_id : repeat_id}
        }
        dao.q('events', opts, function(err, result){
            if(util.isError(err)) {
              cb({
                code: 500,
                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_DELETE'))
              });
              return;
            }
            console.log("result: "+result);
            for (var i = result.length - 1; i >= 0; i--) {
              var startDate = new Date(result[i].start_date);
              var curr_startDate = new Date(post.start_date);
              if(startDate >=curr_startDate){
                //console.log(result[i]);
                var option = {
                  _id: result[i]._id
                };

                dao.delete(option, 'events', function(err, result){
                  if(util.isError(err)) {
                    cb({
                      code: 500,
                      content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_DELETE'))
                    });
                    return;
                  }

                });
              }
            };
            cb({
              content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, 'Event is deleted successfull')
            });//end cb
        });
      }else{
        
        dao.loadById(post._id,'events', function(err, events) {
          if(util.isError(err) || events === null) {
            cb({
              code: 500,
              content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
            });
            return;
          }
          //console.log(events);
           var option = {
                  _id: events._id
            };
          dao.delete(option, 'events', function(err, result){
            if(util.isError(err)) {
              cb({
                code: 500,
                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_DELETE'))
              });
              return;
            }
          });
          cb({
            content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, 'Event is deleted successfull')
          });//end cb

        });
      }

      
      

      
    });//end gather
  };

  //exports
  return DeleteEvent;
};
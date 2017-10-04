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

module.exports = function UpdateEventModule(pb) {

  //pb dependencies
  var util = pb.util;
  var BaseController = pb.BaseController;
  var FormController = pb.FormController;
  var path = require('path');

  /**
  * Edits the logged in user's information
  */
  function UpdateEvent(){}
  util.inherits(UpdateEvent, FormController);

  UpdateEvent.prototype.render = function(cb) {
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
      post.scheduledMETS = BaseController.sanitize(post.scheduledMETS);

      var repeat_id = BaseController.sanitize(post.repeat_id);
      var isRepeat =  BaseController.sanitize(post.isRepeated);

      post.METS = BaseController.sanitize(post.METS);
      var repeat_id = BaseController.sanitize(post.repeat_id);
      var isRepeat =  BaseController.sanitize(post.isRepeated);
      
      delete post.repeat_id;
      delete post.isRepeated;
      var dao = new pb.DAO();
      
      // var end_date = new Date(post.end_date);
      // var start_date = new Date(post.start_date);
      // var time = (end_date - start_date) / 60000;
      // var filePath = path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'data', 'events.json');
      // pb.users.loadJSONFile(filePath,function(err,eventsList){
      //   var i = eventsList.length - 1;
      //   for (; i >= 0; i--) {
      //       if(eventsList[i].eventName.indexOf(post.event_name) != -1){
      //           if(eventsList[i].eventName == post.event_name){
      //               post.scheduledMETS = eventsList[i].METS;
      //               break;
      //           }else{
      //               var event_name = post.event_name;
      //               if(time > 30){
      //                 event_name = event_name+" - hard effort";
      //               }else if(time > 15){
      //                 event_name = event_name+" - moderate effort";
      //               }else{
      //                 event_name = event_name+" - light effort";
      //               }
      //               for (; i >= 0; i--) {
      //                 if(eventsList[i].eventName == event_name){
      //                     post.scheduledMETS = eventsList[i].METS;
      //                     break;
      //                 }
      //               };
      //           }
      //       }
      //   };
      // });
      // console.log(time);
      // console.log(post.scheduledMETS);
      dao.loadById(post._id,'events', function(err, events) {
        if(util.isError(err) || events === null) {
          cb({
            code: 500,
            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
          });
          return;
        }

        //update the document
        
        delete post._id;
        pb.DocumentCreator.update(post, events);
        dao.save(events, function(err, result) {
          if(util.isError(err)) {
            cb({
              code: 500,
              content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
            });
            return;
          }
         
          
          cb({
            content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, 'Event is updated successfull')
          });//end cb
        });//end save
      });//end load
    });//end gather
  };

  //exports
  return UpdateEvent;
};
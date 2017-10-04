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

          //console.log(post);
          post.activityName = BaseController.sanitize(post.activityName);
          post.activityAddress = BaseController.sanitize(post.activityAddress);
          post.activityDescription = BaseController.sanitize(post.activityDescription);
          post.activityStartDateTime = BaseController.sanitize(post.activityStartDateTime);
          post.activityEndDateTime = BaseController.sanitize(post.activityEndDateTime);
          post.user_id = BaseController.sanitize(post.user_id);
          post.activityMETS = BaseController.sanitize(post.activityMETS);
          var repeat_events = post.repeatEvents;

          if(post.repeatEvents.flag == "0"){
              var postData = {};
              postData.event_name = post.activityName;
              postData.event_address = post.activityAddress;
              postData.event_description = post.activityDescription;
              postData.user_id = post.user_id;
              postData.scheduledMETS = post.activityMETS;


              var startDate = new Date(post.activityStartDateTime);       
              var endDate = new Date(post.activityEndDateTime);
              //postData.durationTime = (endDate - startDate)/60000 + "";
              postData.durationTime = 0 + "";
              postData.durationMETS = 0 + "";
              postData.finished = "false";

              postData.start_date = post.activityStartDateTime;
              postData.end_date = post.activityEndDateTime;
             
              var collection = 'events';
              var newEvent = pb.DocumentCreator.create(collection, postData);
              var dao = new pb.DAO();
          
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
              });//end save
          }else if(post.repeatEvents.flag == "1"){ 
              var stime = self.getTime(post.activityStartDateTime);
              var etime = self.getTime(post.activityEndDateTime);
              var repeat_end = repeat_events.repeatEndDate.toString();
              var repeat_id = self.setUniqueId();
            
              if(repeat_end.indexOf('-') == -1){
                  var repeat_times = repeat_end;
                  var repeat_fre = repeat_events.repeatFreName;
                  for(var i = 0; i < repeat_times; i++){
                      var postData = {};
                      postData.event_name = post.activityName;
                      postData.event_address = post.activityAddress;
                      postData.event_description = post.activityDescription;
                      postData.user_id = post.user_id;
                      postData.scheduledMETS = post.activityMETS + "";

                      var startDate = new Date(post.activityStartDateTime);       
                      var endDate = new Date(post.activityEndDateTime);
                      //postData.durationTime = (endDate - startDate)/60000 + "";
                      postData.durationTime = 0 + "";
                      postData.durationMETS = 0 + "";
                      postData.finished = "false";
                      postData.repeat_id = repeat_id;

                      postData.start_date = self.getDateTime(repeat_events.repeatStartDate,stime,repeat_fre*i);
                      // console.log(postData.start_date);
                      postData.end_date = self.getDateTime(repeat_events.repeatStartDate,etime,repeat_fre*i);
                      // console.log(postData.end_date);

                      var collection = 'events';
                      var newEvent = pb.DocumentCreator.create(collection, postData);
                      var dao = new pb.DAO();
                      
                      dao.save(newEvent, function(err, data) {
                        if(util.isError(err)) {
                          cb({
                            code: 500,
                            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
                          });
                          return;
                        }
                      });//end save

                  }
                  cb({
                    content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, "Add new activities successully", true)
                  });
              }else{
                  var repeat_endDate = repeat_end;
                  var repeatEndDateNum = parseInt(self.getDateNum(repeat_endDate));
                  
                  var repeat_fre = repeat_events.repeatFreName;
                  var i = 0;
                  var repeat_id = self.setUniqueId();
                  while(true){
                      
                      var nextStartDate = self.getDate(repeat_events.repeatStartDate,repeat_fre*i);
                      // var nextStartDateNum = nextStartDate.getTime();
                      var nextStartDateNum = parseInt(self.getDateNum(nextStartDate));
                      if(nextStartDateNum <= repeatEndDateNum ){
                          var postData = {};
                          postData.event_name = post.activityName;
                          postData.event_address = post.activityAddress;
                          postData.event_description = post.activityDescription;
                          postData.user_id = post.user_id;
                          postData.scheduledMETS = post.activityMETS + "";

                          var startDate = new Date(post.activityStartDateTime);       
                          var endDate = new Date(post.activityEndDateTime);
                          //postData.durationTime = (endDate - startDate)/60000 + "";
                          postData.durationTime = 0 + "";
                          postData.durationMETS = 0 + "";
                          postData.finished = "false";
                          postData.repeat_id = repeat_id;
                          postData.start_date = self.getDateTime(repeat_events.repeatStartDate,stime,repeat_fre*i);
                          // console.log(postData.start_date);
                          postData.end_date = self.getDateTime(repeat_events.repeatStartDate,etime,repeat_fre*i);
                          var collection = 'events';
                          var newEvent = pb.DocumentCreator.create(collection, postData);
                          var dao = new pb.DAO();
                          
                          dao.save(newEvent, function(err, data) {
                            if(util.isError(err)) {
                              cb({
                                code: 500,
                                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
                              });
                              return;
                            }
                          });//end save
                      }else{
                          break;
                      }
                      i = i + 1;
                  }//end while
                  cb({
                    content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, "Add new activities successully", true)
                  });
              }
           
          }//end else if flag
          else if(post.repeatEvents.flag == "2"){
              var startDate4Check = repeat_events.repeatStartDate;
              // console.log(startDate4Check);
              var stime = self.getTime(post.activityStartDateTime);
              var etime = self.getTime(post.activityEndDateTime);
              var repeat_end = repeat_events.repeatEndDate.toString();
              var repeat_on = repeat_events.repeatOn;
              var firstDay = self.getFirstDay(startDate4Check);
              // console.log(self.getFirstDay(postData.start_date));
              // console.log(self.compareTwoDates(self.getFirstDay(postData.start_date),postData.start_date));
              // console.log(repeat_on);
              if(repeat_end.indexOf('-') == -1){
                  var repeat_times = repeat_end;
                  var repeat_fre = repeat_events.repeatFreName;
                  var repeat_id = self.setUniqueId();;
                  for(var i = 0; i < repeat_times; i++){
                    var firstWeekDay = self.getDate(firstDay,repeat_fre * i * 7);
                    // console.log("===========");
                    // console.log(repeat_on);
                    for(var repeatOn in repeat_on){
                        // console.log(repeat_on[repeatOn]);
                        var nextDay = self.getDate(firstWeekDay,self.mapDay(repeat_on[repeatOn]));
                        // console.log(nextDay);
                        // console.log("**********");
                        if(self.compareTwoDates(startDate4Check, nextDay)){
                            var postData = {};
                            postData.event_name = post.activityName;
                            postData.event_address = post.activityAddress;
                            postData.event_description = post.activityDescription;
                            postData.user_id = post.user_id;
                            postData.scheduledMETS = post.activityMETS + "";

                            var startDate = new Date(post.activityStartDateTime);       
                            var endDate = new Date(post.activityEndDateTime);
                            //postData.durationTime = (endDate - startDate)/60000 + "";
                            postData.durationTime = 0 + "";
                            postData.durationMETS = 0 + "";
                            postData.finished = "false";
                            postData.repeat_id = repeat_id;

                            postData.start_date = self.getDateTime(nextDay,stime,0);
                            // console.log(postData.start_date);
                            postData.end_date = self.getDateTime(nextDay,etime,0);
                            // console.log(postData.end_date);

                            var collection = 'events';
                            var newEvent = pb.DocumentCreator.create(collection, postData);
                            var dao = new pb.DAO();
                            
                            dao.save(newEvent, function(err, data) {
                              if(util.isError(err)) {
                                cb({
                                  code: 500,
                                  content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
                                });
                                return;
                              }
                            });//end save
                            
                        }
                    }  

                  }
                  cb({
                    content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, "Add new activities successully", true)
                  });
              }else{
                  var repeat_endDate = repeat_end;
                  var repeatEndDateNum = parseInt(self.getDateNum(repeat_endDate));
                  
                  var repeat_fre = repeat_events.repeatFreName;
                  var repeat_id = self.setUniqueId();
                  var nextDays = [];
                  var j = 0;
                  for(var repeatOn in repeat_on){
                        nextDays[j++] = self.getDate(firstDay,self.mapDay(repeat_on[repeatOn]));
                  }
                  for(var nextDay in nextDays){
                    // console.log(nextDay);
                    var i = 0;
                    while(true){
                      //console.log("the first i is "+i);
                        var nextStartDate = self.getDate(nextDays[nextDay],repeat_fre*i*7);
                        //console.log("the second i is "+i);
                        // var nextStartDateNum = nextStartDate.getTime();
                        var nextStartDateNum = parseInt(self.getDateNum(nextStartDate));
                        if(nextStartDateNum <= repeatEndDateNum ){
                          if(self.compareTwoDates(startDate4Check, nextStartDate)){
                              var postData = {};
                              postData.event_name = post.activityName;
                              postData.event_address = post.activityAddress;
                              postData.event_description = post.activityDescription;
                              postData.user_id = post.user_id;
                              postData.scheduledMETS = post.activityMETS + "";

                              var startDate = new Date(post.activityStartDateTime);       
                              var endDate = new Date(post.activityEndDateTime);
                              //postData.durationTime = (endDate - startDate)/60000 + "";
                              postData.durationTime = 0 + "";
                              postData.durationMETS = 0 + "";
                              postData.finished = "false";

                              postData.repeat_id = repeat_id;
                              postData.start_date = self.getDateTime(nextDays[nextDay],stime,repeat_fre*i*7);
                              // console.log(postData.start_date);
                              postData.end_date = self.getDateTime(nextDays[nextDay],etime,repeat_fre*i*7);
                              var collection = 'events';
                              var newEvent = pb.DocumentCreator.create(collection, postData);
                              var dao = new pb.DAO();
                              
                              dao.save(newEvent, function(err, data) {

                                if(util.isError(err)) {
                                  cb({
                                    code: 500,
                                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
                                  });
                                  return;
                                }
                              });//end save
                          }
                        }else{
                            break;
                        }
                        i = i + 1;
                    }
                    
                  }//end for
                 
                  cb({
                    content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, "Add new activities successully", true)
                  });
              }
          }//end else if flag
          else if(post.repeatEvents.flag == "3"){
              var startDate4Check = repeat_events.repeatStartDate;
              // console.log(startDate4Check);
              var stime = self.getTime(post.activityStartDateTime);
              var etime = self.getTime(post.activityEndDateTime);
              var repeat_end = repeat_events.repeatEndDate.toString();
              var repeat_by = repeat_events.repeatBy.toString();

              if(repeat_end.indexOf('-') == -1){
                  var repeat_times = repeat_end;
                  var repeat_fre = repeat_events.repeatFreName;
                  var repeat_id = self.setUniqueId();
                  if(repeat_by.indexOf(',') == -1){
                      for(var i = 0; i < repeat_times; i++){
                          var postData = {};
                          postData.event_name = post.activityName;
                          postData.event_address = post.activityAddress;
                          postData.event_description = post.activityDescription;
                          postData.user_id = post.user_id;
                          postData.scheduledMETS = post.activityMETS + "";

                          var startDate = new Date(post.activityStartDateTime);       
                          var endDate = new Date(post.activityEndDateTime);
                          //postData.durationTime = (endDate - startDate)/60000 + "";
                          postData.durationTime = 0 + "";
                          postData.durationMETS = 0 + "";
                          postData.finished = "false";
                          
                          postData.repeat_id = repeat_id;

                          var nextDay = self.getDateForMonth(startDate4Check,repeat_fre * i);
                          var lastDayOfCurrentMonth = self.getLastDayOfMonth(startDate4Check,repeat_fre * i);
                          
                          if(self.compareTwoDates(nextDay,lastDayOfCurrentMonth)){
                            postData.start_date = self.getDateTimeForMonth(startDate4Check,stime,repeat_fre * i);
                            // console.log(postData.start_date);
                            postData.end_date = self.getDateTimeForMonth(startDate4Check,etime,repeat_fre * i);
                            // console.log(postData.end_date);

                            var collection = 'events';
                            var newEvent = pb.DocumentCreator.create(collection, postData);
                            var dao = new pb.DAO();
                            
                            dao.save(newEvent, function(err, data) {
                              if(util.isError(err)) {
                                cb({
                                  code: 500,
                                  content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
                                });
                                return;
                              }
                            });//end save
                          }else{
                            continue;
                          }
              
                                
                      }
                      cb({
                        content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, "Add new activities successully", true)
                      });
                  }else{//deal with day of week

                  }
                  
              }//end if
              else{
                  var repeat_endDate = repeat_end;
                  var repeatEndDateNum = parseInt(self.getDateNum(repeat_endDate));

                  var repeat_fre = repeat_events.repeatFreName;
                  var repeat_id = self.setUniqueId();
                  var i = 0;
                  if(repeat_by.indexOf(',') == -1){
                      while(true){
                        var nextStartDate = self.getDateForMonth(startDate4Check,repeat_fre*i);
                        var nextStartDateNum = parseInt(self.getDateNum(nextStartDate));
                        if(nextStartDateNum <= repeatEndDateNum ){
                          var lastDayOfCurrentMonth = self.getLastDayOfMonth(startDate4Check,repeat_fre * i);   
                          if(self.compareTwoDates(nextStartDate,lastDayOfCurrentMonth)){
                            var postData = {};
                            postData.event_name = post.activityName;
                            postData.event_address = post.activityAddress;
                            postData.event_description = post.activityDescription;
                            postData.user_id = post.user_id;
                            postData.scheduledMETS = post.activityMETS + "";

                            var startDate = new Date(post.activityStartDateTime);       
                            var endDate = new Date(post.activityEndDateTime);
                            //postData.durationTime = (endDate - startDate)/60000 + "";
                            postData.durationTime = 0 + "";
                            postData.durationMETS = 0 + "";
                            postData.finished = "false";
                            
                            postData.repeat_id = repeat_id;
                            
                            postData.start_date = self.getDateTimeForMonth(startDate4Check,stime,repeat_fre * i);
                            // console.log(postData.start_date);
                            postData.end_date = self.getDateTimeForMonth(startDate4Check,etime,repeat_fre * i);
                            // console.log(postData.end_date);
                            var collection = 'events';
                            var newEvent = pb.DocumentCreator.create(collection, postData);
                            var dao = new pb.DAO();
                            
                            dao.save(newEvent, function(err, data) {
                              if(util.isError(err)) {
                                cb({
                                  code: 500,
                                  content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
                                });
                                return;
                              }
                            });//end save
                          }
                        }else{
                            break;
                        }
                        i = i + 1;
                    }//end while
                    cb({
                        content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, "Add new activities successully", true)
                      });
                  }else{

                  }

              }
              
          }//end else if flag

        });//end getJson
      };//end render
      AddActivity.prototype.getLastDayOfMonth = function(date,fre){
          var self = this;
          var eventDate = new Date(date);
          var lastDay = self.getDate(new Date(eventDate.getFullYear(), eventDate.getMonth() + fre + 1, 0),-1);
          return lastDay;

      };
       AddActivity.prototype.mapDay = function(weekDay){
          if(weekDay == "Mon")
            return 0;
          else if(weekDay == "Tue")
            return 1;
          else if(weekDay == "Wen")
            return 2;
          else if(weekDay == "Thu")
            return 3;
          else if(weekDay == "Fri")
            return 4;
          else if(weekDay == "Sat")
            return 5;
          else if(weekDay == "Sun")
            return 6;
       };

       AddActivity.prototype.compareTwoDates = function(startOn, nextOn){
          var so = new Date(startOn), no = new Date(nextOn);
          
          return so.getTime() <= no.getTime();
       };

       AddActivity.prototype.getDateTime = function(date,time,days) {
          var eventDate = new Date(date);
          eventDate.setDate(eventDate.getDate() + 1 + days);
          var td = eventDate,
            month = '' + (td.getMonth() + 1),
            day = '' + td.getDate(),
            year = td.getFullYear();

          if (month.length < 2) month = '0' + month;
          if (day.length < 2) day = '0' + day;

          return [year, month, day].join('-') + ' ' + time;
      };

      AddActivity.prototype.getDateTimeForMonth = function(date,time,fre) {
          var eventDate = new Date(date);
          eventDate.setDate(eventDate.getDate() + 1);
          eventDate.setMonth(eventDate.getMonth() + fre);
          var td = eventDate,
            month = '' + (td.getMonth() + 1),
            day = '' + td.getDate(),
            year = td.getFullYear();

          if (month.length < 2) month = '0' + month;
          if (day.length < 2) day = '0' + day;

          return [year, month, day].join('-') + ' ' + time;
      };

      AddActivity.prototype.getDate = function(date,days) {
          var eventDate = new Date(date);
          eventDate.setDate(eventDate.getDate() + 1 + days);
          var td = eventDate,
            month = '' + (td.getMonth() + 1),
            day = '' + td.getDate(),
            year = td.getFullYear();

          if (month.length < 2) month = '0' + month;
          if (day.length < 2) day = '0' + day;


          return [year, month, day].join('-');
      };

      AddActivity.prototype.getDateForMonth = function(date,fre) {
          var eventDate = new Date(date);
          // console.log(eventDate.getDate());
          // console.log(fre);
          eventDate.setMonth(eventDate.getMonth() + fre);
          eventDate.setDate(eventDate.getDate() + 1);

          var td = eventDate,
            month = '' + (td.getMonth() + 1),
            day = '' + td.getDate(),
            year = td.getFullYear();

          if (month.length < 2) month = '0' + month;
          if (day.length < 2) day = '0' + day;


          return [year, month, day].join('-');
      };

      AddActivity.prototype.getDateNum = function(date) {
          var eventDate = new Date(date);
          eventDate.setDate(eventDate.getDate() + 1);
          var td = eventDate,
            month = '' + (td.getMonth() + 1),
            day = '' + td.getDate(),
            year = td.getFullYear();

          if (month.length < 2) month = '0' + month;
          if (day.length < 2) day = '0' + day;


          return [year, month, day].join('');
      };

      AddActivity.prototype.getTime = function(datetime) {
          // console.log(datetime.toString());
          // console.log(datetime.toString().length);
        
          var date = new Date(datetime);
          var hours = date.getHours();
          // console.log(hours);
          var minutes = date.getMinutes();
          // console.log(minutes);
          if (hours < 10) 
            hours = '0' + hours;
          if (minutes < 10) 
            minutes = '0' + minutes;
          return hours + ':' + minutes;
      };

      AddActivity.prototype.setUniqueId = function () {
        // Math.random should be unique because of its seeding algorithm.
        // Convert it to base 36 (numbers + letters), and grab the first 9 characters
        // after the decimal.
        return '_' + Math.random().toString(36).substr(2, 9);
      };

      AddActivity.prototype.getFirstDay = function(d) {
          var self  = this;
          d = new Date(d);
          var day = d.getDay(),
             diff = d.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
          d.setDate(diff);
          var fd = self.getDate(d,-1);

          return fd;
      };

     

      //exports
      return AddActivity;
};
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

module.exports = function DisableChildModule(pb) {
    
    //pb dependencies
    var util = pb.util;
    var UserService = pb.UserService;
    var UrlService  = pb.UrlService;
    
    /**
     * Checks to see if the proposed username is available
     */
    function DisableChild(){}
    util.inherits(DisableChild, pb.BaseController);

    DisableChild.prototype.render = function(cb) {
        var self = this;
        var get  = this.query;
        var dao = new pb.DAO();

         
        var get  = this.query;

        var message = this.hasRequiredParams(get, ['userID']);
        if(message) {
            cb({content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'user missing from request')});
            return;
        }
        var opts = {
            
                _id : pb.DAO.getObjectId(get.userID)
            
        };
        var update = {
          $set: {
              admin:2
            }
        };
        var updateOptions = {
          multi: false
        };
        dao.updateFields('user', opts, update, updateOptions, function(err1, result1){                                                    // console
            if(util.isError(err1)) {
               cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, "wrong")
              });
              return;
            }
            cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, "success", true)});
        });
        // console.log(opts);
        // dao.q('events', opts, function(err, events) {
        //     if (util.isError(err)) {
        //         return cb(err);
        //     }
        //     // console.log(events);
        //     // console.log(date);
        //     for (var i = events.length - 1; i >= 0; i--) {
        //         var startDate = new Date(events[i].start_date);
        //         var startDateNum = parseInt(startDate.getFullYear()*10000 + (startDate.getMonth() + 1)*100 + startDate.getDate());
                
        //         var dateNum = parseInt(date.getFullYear()*10000 + (date.getMonth() + 1)*100 + date.getDate()) + 1;
                
        //         var endDate = new Date(events[i].end_date);
        //         if(startDateNum < dateNum || startDateNum > dateNum){
        //             delete events[i];
        //         }
        //     };

        //    cb({content: events});
           
        // });//end dao.q   

    };//end render

    //exports
    return DisableChild;
};

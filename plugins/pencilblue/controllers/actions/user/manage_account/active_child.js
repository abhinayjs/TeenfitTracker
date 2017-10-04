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

module.exports = function ActiveChildModule(pb) {
    
    //pb dependencies
    var util = pb.util;
    var UserService = pb.UserService;
    var UrlService  = pb.UrlService;
    
    /**
     * Checks to see if the proposed username is available
     */
    function ActiveChild(){}
    util.inherits(ActiveChild, pb.BaseController);

    ActiveChild.prototype.render = function(cb) {
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
              admin:1
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
    };//end render

    //exports
    return ActiveChild;
};

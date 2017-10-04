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

module.exports = function CheckUserExistModule(pb) {
    
    //pb dependencies
    var util = pb.util;
    var UserService = pb.UserService;
    var UrlService  = pb.UrlService;
    
    /**
     * Checks to see if the proposed username is available
     */
    function CheckUserExist(){}
    util.inherits(CheckUserExist, pb.BaseController);

    CheckUserExist.prototype.render = function(cb) {
        var self = this;
        var get  = this.query;

        var message = this.hasRequiredParams(get, ['username']);

        if(message) {
            cb({content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'username missing from request')});
            return;
        }

        pb.users.isUserNameOrEmailTaken(get.username, '', null, function(error, isTaken) {
            if(isTaken) {
                var returnData = {};
                returnData.sender_id = self.session.authentication.user._id;

                var dao   = new pb.DAO();
                var opts1 = {
                    where: {
                        username: get.username + ""
                    }
                };
                dao.q('user', opts1, function(err, data){
                    console.log(data);
                    if (util.isError(err)) {
                        return cb(err, null);
                    }
                    returnData.receiver_id = data[0]._id;
                    var opts2 = {
                        where: {
                            child_id: data[0]._id + ""
                        }
                    };
                    console.log(opts2);
                    dao.q('member',opts2, function(err2,data2){
                        if (util.isError(err2)) {
                            return cb(err2, null);
                        }
                        console.log(data2);
                        if(data2.length == 0){
                            returnData.receiver_parent_id = data[0]._id;
                        }else{
                            returnData.receiver_parent_id = data2[0].parent_id;
                        }
                        console.log(returnData);
                        cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, get.username + ' is existing', returnData)});
                    }); 
                }); 
                
            }else{
                cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, get.username + ' is not existing', false)});
                return;
            }

            
        });


    };

    //exports
    return CheckUserExist;
};

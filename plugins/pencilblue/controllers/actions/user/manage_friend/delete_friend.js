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

module.exports = function DeleteFriendModule(pb) {
    
    //pb dependencies
    var util = pb.util;
    var BaseController = pb.BaseController;
    /**
     * delete unaccepted friend
     */
    function DeleteFriend(){}
    util.inherits(DeleteFriend, pb.BaseController);

    DeleteFriend.prototype.render = function(cb) {
        var self = this;
        this.getJSONPostParams(function(err, post) {
            
            console.log(post);
            var friendID =  BaseController.sanitize(post.friendID);
            var where = {
                receiver_id: friendID
            };
            var dao = new pb.DAO();
            
            dao.delete(where, 'friends', function(err, result){
                if(util.isError(err)) {
                  cb({
                    code: 500,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_DELETE'))
                  });
                  return;
                }
                cb({
                    content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, 'FRIENDS' + ' ' + 'DELETED')
                });
            });
        });

        

    };

    //exports
    return DeleteFriend;
};

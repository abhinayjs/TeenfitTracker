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

module.exports = function AcceptInvitationModule(pb) {
    
    //pb dependencies
    var util = pb.util;
    
    /**
     * Resets the logged in user's password
     */
    function AcceptInvitation(){}
    util.inherits(AcceptInvitation, pb.BaseController);

    AcceptInvitation.prototype.render = function(cb) {
        var self = this;
        var get  = this.query;
        
        var dao = new pb.DAO();
        var friendWhere = {
            sender_id: get.sender_id,
            receiver_id : get.receiver_id
        };
        var friendUpdate = {
            $set: {
                accept : "1",
            }
         };


        dao.updateFields('friends', friendWhere, friendUpdate, function(err, result){
            // console.log(err);
            // console.log(result.result);
            // console.log(result.result.nModified);
            if(result.result.nModified == 0){

                location = '/user/invitation_notification?invitationStatus=0';
                self.redirect(location, cb);
                return;
            }else{
                  if(get.sender_username == get.parent_username || get.receiver_username == get.parent_username){
                    var sender = {};
                    sender.username = get.sender_username;
                    sender.sender_username = get.sender_username;
                    sender.receiver_username = get.receiver_username;
                    sender.email = get.sender_email;
                    pb.users.sendInvitationNotificationEmail(sender, util.cb);

                    var receiver = {};
                    receiver.username = get.receiver_username;
                    receiver.sender_username = get.receiver_username;
                    receiver.receiver_username = get.sender_username;
                    receiver.email = get.receiver_email;
                    pb.users.sendInvitationNotificationEmail(receiver, util.cb);
                }else{
                    var parent = {};
                    parent.username = get.parent_username;
                    parent.sender_username = get.sender_username;
                    parent.receiver_username = get.receiver_username;
                    parent.email = get.parentEmailId;
                    pb.users.sendInvitationNotificationEmail(parent, util.cb);

                    var sender = {};
                    sender.username = get.sender_username;
                    sender.sender_username = get.sender_username;
                    sender.receiver_username = get.receiver_username;
                    sender.email = get.sender_email;
                    pb.users.sendInvitationNotificationEmail(sender, util.cb);

                    var receiver = {};
                    receiver.username = get.receiver_username;
                    receiver.sender_username = get.receiver_username;
                    receiver.receiver_username = get.sender_username;
                    receiver.email = get.receiver_email;
                    pb.users.sendInvitationNotificationEmail(receiver, util.cb);
                }
                var newFriendInfo = {};
                newFriendInfo.sender_id = get.receiver_id;
                newFriendInfo.receiver_id = get.sender_id;
                newFriendInfo.accept = "1";
                newFriendInfo.score = parseInt(Math.random() * 1000).toString();
                var newFriend = pb.DocumentCreator.create('friends', newFriendInfo);
                dao.save(newFriend, function(err, data) {
                    if(util.isError(err)) {
                      cb({
                        code: 500,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
                      });
                      return;
                    }
                    location = '/user/invitation_notification?invitationStatus=1';
                    self.redirect(location, cb);
                  });
            }
        });
        


    };

    //exports
    return AcceptInvitation;
};

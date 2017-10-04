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

module.exports = function RejectInvitationModule(pb) {
    
    //pb dependencies
    var util = pb.util;
    
    /**
     * Resets the logged in user's password
     */
    function RejectInvitation(){}
    util.inherits(RejectInvitation, pb.BaseController);

    RejectInvitation.prototype.render = function(cb) {
        var self = this;
        var get  = this.query;
        
        var dao = new pb.DAO();
        var friendWhere = {
            sender_id: get.sender_id,
            receiver_id : get.receiver_id
        };
        var friendUpdate = {
            $set: {
                accept : "-1",
            }
         };

        dao.updateFields('friends', friendWhere, friendUpdate, function(err, result){
        
            if(result.result.nModified == 0){
                location = '/user/invitation_notification?invitationStatus=0';
                self.redirect(location, cb);
            }else{
                location = '/user/invitation_notification?invitationStatus=-1';
                self.redirect(location, cb);
            }
        });
        


    };

    //exports
    return RejectInvitation;
};

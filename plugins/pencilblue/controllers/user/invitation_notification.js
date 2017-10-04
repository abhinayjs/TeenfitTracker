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
var async = require('async');

module.exports = function InvitationNotification(pb) {

    //pb dependencies
    var util        = pb.util;
    var UserService = pb.UserService;
    var UrlService  = pb.UrlService;
    
    /**
     * Interface for logging in
     * @class LoginViewController
     * @constructor
     * @extends ViewController
     */

    function InvitationNotification(){}
    util.inherits(InvitationNotification, pb.FormController);
    

    InvitationNotification.prototype.render = function(cb) {
        var get  = this.query;
        // console.log("yes");
        var data = {"invitation_status" : get.invitationStatus};
        console.log(data);
        this.setPageName(this.ls.get('Invitation Notification'));
        this.ts.registerLocal('angular_objects', new pb.TemplateValue(pb.ClientJs.getAngularObjects(data), false));
        this.ts.load('user/invitation_notification', function(err, result) {
            //console.log(new pb.TemplateValue(pb.ClientJs.getAngularObjects(data), false));
            cb({content: result});
        });
    };

    //exports
    return InvitationNotification;
};

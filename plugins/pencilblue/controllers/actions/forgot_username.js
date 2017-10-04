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

module.exports = function ForgotUsernameControllerModule(pb) {
    
    //pb dependencies
    var util = pb.util;

    /**
     * Sends a password reset email
     * @class ForgotUsernameController
     */
    function ForgotUsernameController(){}
    util.inherits(ForgotUsernameController, pb.FormController);

    /**
     * 
     * @method onPostParamsRetrieved
     * @param {Object} post
     * @param {Function} cb
     */
    ForgotUsernameController.prototype.onPostParamsRetrieved = function(post, cb) {
        var nodemailer = require('nodemailer');

        var self = this;

        var returnURL = this.query.admin ? '/admin/login' : '/user/login';


        var message = this.hasRequiredParams(post, ['user_email']);
        if(message) {
            return self.formError(self.ls.get(''+'PLEASE INPUT YOUR EMAIL ADDRESS'), returnURL, cb);
        }

        var query = {
            object_type : 'user',
            $or : [
                
                {
                    email : post.user_email
                }
            ]
        };

        //search for user
        var dao = new pb.DAO();
        dao.loadByValues(query, 'user', function(err, user) {
            if(util.isError(err) || user === null) {
                return self.formError(self.ls.get(''+'YOUR EMAIL ADDRESS IS INVALID'), returnURL, cb);
            }

            //verify that an email server was setup
            pb.settings.get('email_settings', function(err, emailSettings) {
                if (util.isError(err)) {
                    return self.formError(err.message, returnURL, cb);
                }
                else if (!emailSettings) {
                    return self.formError(self.ls.get('EMAIL_NOT_CONFIGURED'), returnURL, cb);
                }

                //find any existing password record for the user
                var userIdStr = user[pb.DAO.getIdField()].toString();
                self.session.success = self.ls.get(''+'YOUR USEER NAME HAS BEEN SENT');
                self.redirect(returnURL, cb);
                pb.users.sendUsernameEmail(user,util.cb);
                
            });
        });
    };

    //exports
    return ForgotUsernameController;
};
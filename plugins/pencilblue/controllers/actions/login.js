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
var Cookies = require('cookies');
  
module.exports = function LoginActionControllerModule(pb) {
    
    //dependencies
    var util               = pb.util;
    var FormController     = pb.FormController;
    var FormAuthentication = pb.FormAuthentication;
    var BaseController = pb.BaseController;

    /**
     * Authenticates a user
     * @class LoginActionController
     * @constructor
     * @extends FormController
     */
    function LoginActionController(){}
    util.inherits(LoginActionController, FormController);

    /**
     * 
     * @method onPostParamsRetrieved
     * @param {Object} post
     * @param {Function} cb
     */
    LoginActionController.prototype.onPostParamsRetrieved = function(post, cb) {
        var self         = this;
        var adminAttempt = this.query.admin_attempt ? true : false;

        var options = post;
        options.access_level = adminAttempt ? pb.SecurityService.ACCESS_WRITER : pb.SecurityService.ACCESS_USER;
        pb.security.authenticateSession(this.session, options, new FormAuthentication(), function(err, user) {
            if(util.isError(err) || user === null || user.admin == 2)  {
                if(self.session.authentication.user_id != null){
                    self.session.authentication.user_id = null;
                    self.session.authentication.admin_level = 0;
                    self.session.authentication.user = null;
                    if(user.admin == 2){
                        self.fortbitLogin(adminAttempt, cb);
                    }
                    
                    return;
                }
                self.loginError(adminAttempt, cb);
                return;
            }
            var location = "";
            if(user.admin == 0){
                location = '/user/activity_report';
            }

            if(user.admin == 1){
                location = '/user/manage_daily';
                // location = '/user/temp_page';
            }
            
            if(user.admin == 4){
                location = '/admin';
            }
            
            if(adminAttempt){
                location = '/admin';//modify here, origin /admin
            }
            self.redirect(location, cb);

            
        });
    };

    LoginActionController.prototype.loginError = function(adminAttempt, cb) {
        this.session.error = this.ls.get('INVALID_LOGIN');
        if(adminAttempt){
            this.redirect('/admin/login', cb);//modify here, origin /admin
            return;
        }

        this.redirect('/user/login', cb);
    };

    LoginActionController.prototype.fortbitLogin = function(adminAttempt, cb) {
        this.session.error = "Disabled Account";

        this.redirect('/user/login', cb);
    };

    LoginActionController.prototype.adminLoginToUserAccount = function(cb) {
        this.session.error = "Admin user can not login to normal user account";

        this.redirect('/user/login', cb);
    };
    //exports
    return LoginActionController;
};

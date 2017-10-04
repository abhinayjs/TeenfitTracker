var path = require('path');
var qs = require('qs');
var async = require('async');
var later = require('later');

module.exports = function OauthCallbackModule(pb) {

    //pb dependencies
    var util          = pb.util;
    var PluginService = pb.PluginService;
    var UrlService = pb.UrlService;
    var OauthService  = PluginService.getService('oauthService', 'oauth-pencilblue');
    var textSched = later.parse.cron('10 * * * * *');

    function OauthCallback() {}
    util.inherits(OauthCallback, pb.BaseController);

    

    OauthCallback.prototype.render = function(cb) {
        var self = this;
        var vars = this.pathVars;
        var code = this.query.code;
        var user = self.session.authentication.child_user != null ? self.session.authentication.child_user : self.session.authentication.user;
        var dao = new pb.DAO();
        var service = new OauthService(vars.provider);

        // console.log(self);
        service.getToken(code, function(err, result) {
            var serv = new OauthService();
            if (util.isError(err)) {
                self.renderError(err, cb);
            }
            else {
                self.saveTokenWithUserID(user._id,result,cb);
            }
        });
    };

    OauthCallback.getRoutes = function(cb) {
        var routes = [
            {
                method: 'get',
                path: '/oauth/fitbit/callback',
                auth_required: false,
                content_type: 'text/html'
            }
        ];
        cb(null, routes);
    };

    OauthCallback.prototype.renderError = function(err, cb) {
        cb({
            content_type: 'text/json',
            code: 200,
            content: err.message
        });
    };

    OauthCallback.prototype.saveTokenWithUserID = function(userId , result,cb) {    
        var self = this;
        var post = {};

        post.access_token = result.access_token;
        post.refresh_token = result.refresh_token;
        post.fitbit_userId = result.user_id;

        var dao = new pb.DAO();
        dao.loadById(userId,'user',function(err, user){
            if(util.isError(err)) {
               cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, errMsg)
              });
              return;
            }
            pb.DocumentCreator.update(post, user);
            dao.save(user, function(err, result) {
                if(util.isError(err)) {
                   cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, errMsg)
                  });
                  return;
                }      
                
                cb({
                    // code:200,
                    // content: 'Tokens saved successfully'
                    code:200,
                    content: 'Tokens saved successfully',
                    //redirect: '/user/manage_account'
                });
            });
        });
        self.redirect(UrlService.createSystemUrl('/user/manage_account'),cb);
    };

    
    //exports
    return OauthCallback;
};
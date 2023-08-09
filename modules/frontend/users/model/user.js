
function User() {
    /**
     * Function for contact
     *
     * @param req   As  Request Data
     * @param res   As  Response Data
     * @param next  As  Callback argument to the middleware function
     *
     * @return render/json
     */
        this.contactUs = (req, res)=>{
            if(isPost(req)){
                /** Sanitize Data **/
                req.body        = sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
                let name        = (req.body.name)   ? req.body.name : "";
                let email       = (req.body.email)   ? req.body.email : "";
                let phone       = (req.body.phone)   ? req.body.phone : "";
                let city        = (req.body.city)   ? req.body.city : "";
                let message     = (req.body.message)   ? req.body.message : "";

                /** Check validation **/
                req.checkBody({
                    "email": {
                        notEmpty: true,
                        errorMessage: res.__("front.user.please_enter_email"),
                        isEmail: {
                            errorMessage: res.__("front.user.please_enter_valid_email_address")
                        }
                    },
                    "name": {
                        notEmpty: true,
                        errorMessage: res.__("front.user.please_enter_name")
                    },
                    "phone": {
                        notEmpty: true,
                        errorMessage: res.__("front.user.please_enter_phone")
                    },
                    "city": {
                        notEmpty: true,
                        errorMessage: res.__("front.user.please_enter_city")
                    },
                    "message": {
                        notEmpty: true,
                        errorMessage: res.__("front.user.please_enter_message")
                    }
                });

                /** parse Validation array  **/
                let errors = parseValidation(req.validationErrors(),req);
                if (errors) {
                    /** Send error response **/
                    return res.send({
                        status  : STATUS_ERROR,
                        errors  : errors,
                        message : '',
                        result  : []
                    });
                }else{
                    let collection     = db.collection("contact_us");
                    collection.insertOne({
                        name : name,
                        email : email,
                        phone : phone,
                        city : city,
                        message : message,
                        created : getUtcDate()
                    },(err,result)=>{
                        if(!err){
                            return res.send({
                                "status"      : API_STATUS_SUCCESS,
                                "message"     : res.__("front.user.thanks_for_contact_us"),
                                "error"       : [],
                                "result" : []
                            });
                        }else{
                            return res.send({
                                "status"      : API_STATUS_ERROR,
                                "message"     : res.__("front.system.something_went_wrong"),
                                "error"       : [],
                                "result" : []
                            });
                        }
                    })
                }
            }else{
                return res.send({
                    status      : API_STATUS_ERROR,
                    message     : res.__("front.system.something_went_wrong"),
                    error       : [],
                    result : []
                });
            }
        }
}
module.exports = new User();
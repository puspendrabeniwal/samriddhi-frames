	
function Career() {
	/**
	 * Function for add careers
	 *
	 * @param req 	As	Request Data
	 * @param res 	As	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.addCareers = (req, res,next)=>{
		if(isPost(req)){
			/** Sanitize Data */
			req.body = 	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);

			/** Check validation */
			req.checkBody({
				'name': {
					notEmpty: true,
					errorMessage: res.__("admin.careers.please_enter_page_name")
				},
				'body': {
					notEmpty: true,
					errorMessage: res.__("admin.careers.please_enter_page_description")
				},
			})

			

			/** parse Validation array  */
			let errors = parseValidation(req.validationErrors(),req);
			console.log(req.body, errors);
			if (errors) {
				/** Send error response */
				return res.send({
					status	: STATUS_ERROR,
					message	: errors,
				});
			}

			/** Save careers details */
			const careers = db.collection('careers');
			careers.insertOne({
				created 			: 	getUtcDate(),
				modified 			: 	getUtcDate()
			},(err,result)=>{
				if(err) return next(err);

				/** Send success response */
				req.flash(STATUS_SUCCESS,res.__("admin.careers.careers_has_been_added_successfully"));
				res.send({
					status			: STATUS_SUCCESS,
					redirect_url	: WEBSITE_URL+'careers',
					message			: res.__("admin.careers.careers_has_been_added_successfully")
				});
			});
		}else{
			/**Render careers page */
			res.render('careers');
		}
	};//End addCareers()

}
module.exports = new Career();
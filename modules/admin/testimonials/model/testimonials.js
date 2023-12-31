const asyncParallel = require("async/parallel");
const clone = require("clone");

function Testimonials() {

	/**
	 * Function to get banners list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.getList = (req, res, next) => {
		if (isPost(req)) {
			let limit = (req.body.length) ? parseInt(req.body.length) : ADMIN_LISTING_LIMIT;
			let skip = (req.body.start) ? parseInt(req.body.start) : DEFAULT_SKIP;
			const collection = db.collection('testimonials');

			/** Configure Datatable conditions*/
			configDatatable(req, res, null).then(dataTableConfig => {

				/** Set conditions **/
				let commonConditions = {
					is_deleted: NOT_DELETED,
				};
				dataTableConfig.conditions = Object.assign(dataTableConfig.conditions, commonConditions);
				asyncParallel([
					(callback) => {
						/** Get list of Testimonials **/
						collection.find(dataTableConfig.conditions, { projection: { _id: 1, title: 1, subtitle: 1, modified :1 } }).collation(COLLATION_VALUE).sort(dataTableConfig.sort_conditions).limit(limit).skip(skip).toArray((err, result) => {
							callback(err, result);
						});
					},
					(callback) => {
						/** Get total number of records in Testimonials collection **/
						collection.countDocuments({}, (err, countResult) => {
							callback(err, countResult);
						});
					},
					(callback) => {
						/** Get filtered records counting in Testimonials **/
						collection.countDocuments(dataTableConfig.conditions, (err, filterContResult) => {
							callback(err, filterContResult);
						});
					}
				],
					(err, response) => {
						/** Send response **/
						res.send({
							status: (!err) ? STATUS_SUCCESS : STATUS_ERROR,
							draw: dataTableConfig.result_draw,
							data: (response[0]) ? response[0] : [],
							recordsFiltered: (response[2]) ? response[2] : 0,
							recordsTotal: (response[1]) ? response[1] : 0
						});
					});
			});
		} else {
			/** render listing page **/
			req.breadcrumbs(BREADCRUMBS['admin/testimonials/list']);
			res.render('list');
		}
	};//End getList()

	/**
	 * Function to get testimonial's detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	let getTestimonialsDetails = (req, res, next) => {
		return new Promise(resolve => {
			let testimonialId = (req.params.id) ? req.params.id : "";
			/** Get testimonial details **/
			const testimonial = db.collection('testimonials');
			testimonial.findOne({
				_id: ObjectId(testimonialId),
				is_deleted: NOT_DELETED,
			}, (err, result) => {
				if (err) return next(err);
				if (!result) {
					/** Send error response **/
					let response = {
						status: STATUS_ERROR,
						message: res.__("admin.system.invalid_access")
					};
					return resolve(response);
				}

				/** Set options for append image full path **/
				let options = {
					"file_url": USERS_URL,
					"file_path": USERS_FILE_PATH,
					"result": [result],
					"database_field": "image"
				};

				/** Append image with full path **/
				appendFileExistData(options).then(fileResponse => {
					let response = {
						status: STATUS_SUCCESS,
						result: (fileResponse && fileResponse.result && fileResponse.result[0]) ? fileResponse.result[0] : {}
					};
					resolve(response);
				});
			});
		});
	};// End getTestimonialsDetails().

	/**
	 * Function to update testimonial's detail
	 *
	 * @param req 	As 	Request Data
	 * @param res 	As 	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.editTestimonial = (req, res, next) => {
		if (isPost(req)) {
			/** Sanitize Data **/
			req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
			/** Check validation **/
			req.checkBody({
				"title": {
					notEmpty: true,
					errorMessage: res.__("admin.testimonial.please_enter_title")
				},
				"subtitle": {
					notEmpty: true,
					errorMessage: res.__("admin.testimonial.please_enter_subtitle")
				},

			});

			/** parse Validation array  **/
			let errors = parseValidation(req.validationErrors(), req);
			if (errors) {
				/** Send error response **/
				return res.send({
					status: STATUS_ERROR,
					message: errors,
				});
			}
			let testimonialId = (req.params.id) ? req.params.id : "";

			/** Configure testimonials unique conditions **/
			const testimonials = db.collection("testimonials");
			testimonials.findOne({
				_id: { $ne: ObjectId(testimonialId) },
				is_deleted: NOT_DELETED,
			}, { projection: { _id: 1, title: 1, subtitle: 1, banner_image: 1 } },
				(err, result) => {
					if (err) return next(err);
					/** Set options for upload image **/
					let oldimage = (req.body.old_image) ? req.body.old_image : "";
					let image = (req.files && req.files.image) ? req.files.image : "";
					let options = {
						'image': image,
						'filePath': USERS_FILE_PATH,
						'oldPath': oldimage
					};
					/** Upload testimonials image **/
					moveUploadedFile(req, res, options).then(response => {

						if (response.status == STATUS_ERROR) {
							/** Send error response **/
							return res.send({
								status: STATUS_ERROR,
								message: [{ 'param': 'image', 'msg': response.message }],
							});
						}
						/** Set update data **/
						let updateData = {
							modified: getUtcDate(),
							title: (req.body.title) ? req.body.title : "",
							subtitle: (req.body.subtitle) ? req.body.subtitle : "",

						};
						let bannerImage = response.fileName ? response.fileName : "";
						updateData.image = bannerImage ? bannerImage : oldimage;

						/** Update testimonial data **/
						testimonials.updateOne({ _id: ObjectId(testimonialId) }, { $set: updateData }, (updateErr, result) => {
							if (updateErr) return next(updateErr);
							/** Send success response **/
							req.flash(STATUS_SUCCESS, res.__("admin.testimonial.details_has_been_updated_successfully"));
							res.send({
								status: STATUS_SUCCESS,
								redirect_url: WEBSITE_ADMIN_URL + "testimonials/",
								message: res.__("admin.testimonial.details_has_been_updated_successfully"),
							});
						});

					}).catch(next);
				});
		} else {
			/** Get testimonial details **/
			getTestimonialsDetails(req, res, next).then(response => {
				if (response.status != STATUS_SUCCESS) {
					/** Send error response **/
					req.flash(STATUS_ERROR, response.message);
					return res.redirect(WEBSITE_ADMIN_URL + "testimonials/");
				}
				req.breadcrumbs(BREADCRUMBS["admin/testimonial/edit"]);
				/** Render edit page **/
				res.render("edit", {
					result: (response.result) ? response.result : {},
				});
			}).catch(next);
		}
	};//End edittestimonials()

	/**
	 * Function for add banners
	 *
	 * @param req 	As	Request Data
	 * @param res 	As	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.addTestimonial = (req, res, next) => {
		if (isPost(req)) {
			/** Sanitize Data */
			req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
			/** Check validation */
			req.checkBody({
				'title': {
					notEmpty: true,
					errorMessage: res.__("admin.testimonial.please_enter_title")
				},
				'subtitle': {
					notEmpty: true,
					errorMessage: res.__("admin.testimonial.please_enter_subtitle")
				},
			})

			/** parse Validation array  */
			let errors = parseValidation(req.validationErrors(), req);

			if (!req.files || !req.files.image) {
				if (!errors) errors = [];
				errors.push({ 'param': 'image', 'msg': res.__("admin.testimonial.please_select_image") });
			}
			if (errors) {
				/** Send error response */
				return res.send({
					status: STATUS_ERROR,
					message: errors,
				});
			}
			let testimonialImage = (req.files && req.files.image) ? req.files.image : {};
			let imageOptions = {
				'image': testimonialImage,
				'filePath': USERS_FILE_PATH
			};


			/** Upload testimonials image **/
			moveUploadedFile(req, res, imageOptions).then(imageResponse => {

				if (imageResponse.status == STATUS_ERROR) {
					/** Send error response **/
					return res.send({
						status: STATUS_ERROR,
						message: [{ 'param': 'image', 'msg': imageResponse.message }],
					});
				}

				/** Set options **/
				let options = {
					title: req.body.title + "-" + req.body.subtitle,
					table_name: "testimonials",
					slug_field: "slug"
				};


				/** Make Slug */
				getDatabaseSlug(options).then(response => {
					/** Save testimonials details */
					const testimonials = db.collection('testimonials');
					testimonials.insertOne({
						title: req.body.title ? req.body.title : "",
						subtitle: req.body.subtitle ? req.body.subtitle : "",
						image: imageResponse.fileName ? imageResponse.fileName : "",
						slug: response && response.title ? response.title : "",
						is_deleted: NOT,
						default_language_id: DEFAULT_LANGUAGE_MONGO_ID,
						created: getUtcDate(),
						modified: getUtcDate()
					}, (err, result) => {
						if (err) return next(err);
						/** Send success response */
						req.flash(STATUS_SUCCESS, res.__("admin.banner.banner_has_been_added_successfully"));
						res.send({
							status: STATUS_SUCCESS,
							redirect_url: WEBSITE_ADMIN_URL + 'testimonials',
							message: res.__("admin.testimonial.testimonial_has_been_added_successfully")
						});
					});
				}, error => {
					/** Send error response */
					res.send({
						status: STATUS_ERROR,
						message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
					});
				}).catch(next);
			}).catch(next);
		} else {
			/** Get language list */
			getLanguages().then(languageList => {
				req.breadcrumbs(BREADCRUMBS['admin/testimonials/add']);
				/**Render add testimonials page */
				res.render('add', {
					language_list: languageList
				});
			}).catch(next);
		}
	};//End addtestimonials()


	/**
	* Function for delete testimonial
	*
	* @param req   As Request Data
	* @param res   As Response Data
	* @param next  As  Callback argument to the middleware function
	*
	* @return null
	*/
	this.deleteTestimonial = (req, res, next) => {
		/** Delete user*/
		let testimonialId = (req.params.id) ? req.params.id : "";
		const collection = db.collection("testimonials");
		collection.updateOne(
			{ _id: ObjectId(testimonialId) },
			{
				$set: {
					is_deleted: DELETED,
					deleted_at: getUtcDate(),
					modified: getUtcDate()
				}
			}, (err, result) => {
				if (err) return next(err);

				/** Send success response **/
				req.flash(STATUS_SUCCESS, res.__("admin.testimonial.testimonial_deleted_successfully"));
				res.redirect(WEBSITE_ADMIN_URL + "testimonials");
			}
		);
	};//End deleteUser()
}
module.exports = new Testimonials();

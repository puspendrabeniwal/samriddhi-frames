const asyncParallel = require("async/parallel");
const { ObjectId } = require("bson");
const clone = require("clone");

function Jobs() {
	/**
	 * Function to get jobs list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.getJobList = (req, res, next) => {
		if (isPost(req)) {
			let limit = (req.body.length) ? parseInt(req.body.length) : ADMIN_LISTING_LIMIT;
			let skip = (req.body.start) ? parseInt(req.body.start) : DEFAULT_SKIP;
			const collection = db.collection('jobs');

			/** Configure Datatable conditions*/
			configDatatable(req, res, null).then(dataTableConfig => {
				asyncParallel([
					(callback) => {
						/** Get list of jobs **/
						collection.find(dataTableConfig.conditions, { projection: { _id: 1, name: 1, body: 1, modified: 1, active: 1 } }).collation(COLLATION_VALUE).sort(dataTableConfig.sort_conditions).limit(limit).skip(skip).toArray((err, result) => {
							callback(err, result);
						});
					},
					(callback) => {
						/** Get total number of records in pages collection **/
						collection.countDocuments({}, (err, countResult) => {
							callback(err, countResult);
						});
					},
					(callback) => {
						/** Get filtered records counting in pages **/
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
			req.breadcrumbs(BREADCRUMBS['admin/jobs/list']);
			res.render('list');
		}
	};//End getJobList()

	/**
	 * Function to get job's detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	let getJobDetails = (req, res, next) => {
		return new Promise(resolve => {
			let jobId = (req.params.id) ? req.params.id : "";
			/** Get jobs details **/
			const collection = db.collection('jobs');
			collection.findOne({
				_id: ObjectId(jobId)
			},
				{
					projection: {
						_id: 1, name: 1, body: 1, modified: 1, pages_descriptions: 1
					}
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

					/** Send success response **/
					let response = {
						status: STATUS_SUCCESS,
						result: result
					};
					resolve(response);
				}
			);
		});
	};// End getJobDetails().


	/**
	 * Function to get Resume's detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	this.getResumeList = (req, res, next) => {
		let careerId = req.params.id?req.params.id:"";
		if (isPost(req)) {
			let limit = (req.body.length) ? parseInt(req.body.length) : ADMIN_LISTING_LIMIT;
			let skip = (req.body.start) ? parseInt(req.body.start) : DEFAULT_SKIP;
			const collection = db.collection('careers');
			let commonCondition = {job_id : ObjectId(careerId)}

			/** Configure Datatable conditions*/
			configDatatable(req, res, null).then(dataTableConfig => {
				dataTableConfig.conditions = Object.assign(dataTableConfig.conditions, commonCondition)
				console.log(dataTableConfig.conditions, "dataTableConfig.conditions")
				asyncParallel([
					(callback) => {
						
						/** Get list of jobs **/
						collection.find(dataTableConfig.conditions, { projection: { _id: 1, first_name: 1, last_name: 1, email: 1, telephone: 1, resume: 1,  } }).collation(COLLATION_VALUE).sort(dataTableConfig.sort_conditions).limit(limit).skip(skip).toArray((err, result) => {
							callback(err, result);
						});
					},
					(callback) => {
						/** Get total number of records in pages collection **/
						collection.countDocuments(commonCondition, (err, countResult) => {
							callback(err, countResult);
						});
					},
					(callback) => {
						/** Get filtered records counting in pages **/
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
			req.breadcrumbs(BREADCRUMBS['admin/jobs/resume_list']);
			res.render('resume_list',{careerId:careerId});
		}
	};
	// End getResumeList().


	/**
	 * Function to update jobs's detail
	 *
	 * @param req 	As 	Request Data
	 * @param res 	As 	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.editJob = (req, res, next) => {
		if (isPost(req)) {
			/** Sanitize Data **/
			req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);
			let id = (req.params.id) ? req.params.id : "";

			if (id == "" || typeof req.body.pages_descriptions === typeof undefined || (typeof req.body.pages_descriptions[DEFAULT_LANGUAGE_MONGO_ID] === typeof undefined || !req.body.pages_descriptions[DEFAULT_LANGUAGE_MONGO_ID] || req.body.pages_descriptions[DEFAULT_LANGUAGE_MONGO_ID] == '')) {
				/** Send error response **/
				return res.send({
					status: STATUS_ERROR,
					message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
				});
			}

			let allData = req.body;
			req.body = clone(allData.pages_descriptions[DEFAULT_LANGUAGE_MONGO_ID]);
			let pageBody = (req.body.body) ? req.body.body : "";

			/** Check validation **/
			req.checkBody({
				'name': {
					notEmpty: true,
					errorMessage: res.__("admin.job.please_enter_job")
				},
				'body': {
					notEmpty: true,
					errorMessage: res.__("admin.job.please_enter_job_description")
				},
			});

			if (pageBody != "") {
				req.body.body = pageBody.replace(new RegExp(/&nbsp;|<br \/\>|<p>|<\/p>/g), ' ').trim();
			}

			/** parse Validation array  **/
			let errors = parseValidation(req.validationErrors(), req);
			if (errors) {
				/** Send error response **/
				return res.send({
					status: STATUS_ERROR,
					message: errors,
				});
			}

			/** Update jobs details **/
			const collection = db.collection("jobs");
			collection.updateOne({
				_id: ObjectId(id)
			},
				{
					$set: {
						body: pageBody,
						name: (req.body.name) ? req.body.name : "",
						default_language_id: DEFAULT_LANGUAGE_MONGO_ID,
						pages_descriptions: (allData.pages_descriptions) ? allData.pages_descriptions : {},
						modified: getUtcDate()
					}
				}, (err, result) => {
					if (err) return next(err);

					/** Send success response **/
					req.flash(STATUS_SUCCESS, res.__("admin.job.job_details_has_been_updated_successfully"));
					res.send({
						status: STATUS_SUCCESS,
						redirect_url: WEBSITE_ADMIN_URL + 'jobs',
						message: res.__("admin.job.job_details_has_been_updated_successfully"),
					});
				}
			);
		} else {
			/** Get language list */
			getLanguages().then(languageList=>{
				/** Get jobs details **/
				getJobDetails(req, res, next).then(response => {
					if (response.status != STATUS_SUCCESS) {
						/** Send error response **/
						req.flash(STATUS_ERROR, response.message);
						res.redirect(WEBSITE_ADMIN_URL + 'jobs');
						return;
					}
					/** Render edit page **/
					req.breadcrumbs(BREADCRUMBS['admin/jobs/edit']);
					res.render('edit', {
						result: response.result,
						language_list: languageList
					});
				}).catch(next);
			}).catch(next);
		}
	};//End editJobs()

	/**
	 * Function for add jobs
	 *
	 * @param req 	As	Request Data
	 * @param res 	As	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.addJob = (req, res, next) => {
		if (isPost(req)) {
			/** Sanitize Data */
			req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS_XSS);

			if (req.body.pages_descriptions === undefined || req.body.pages_descriptions[DEFAULT_LANGUAGE_MONGO_ID] === undefined || req.body.pages_descriptions[DEFAULT_LANGUAGE_MONGO_ID] == '') {
				/** Send error response */
				return res.send({
					status: STATUS_ERROR,
					message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
				});
			}

			let allData = req.body;
			req.body = clone(allData.pages_descriptions[DEFAULT_LANGUAGE_MONGO_ID]);
			let pageBody = (req.body.body) ? req.body.body : "";
			let pageName = (req.body.name) ? req.body.name : "";

			/** Check validation */
			req.checkBody({
				'name': {
					notEmpty: true,
					errorMessage: res.__("admin.job.please_enter_job_name")
				},
				'body': {
					notEmpty: true,
					errorMessage: res.__("admin.job.please_enter_job_description")
				},
			})

			if (pageBody != "") {
				req.body.body = pageBody.replace(new RegExp(/&nbsp;|<br \/\>|<p>|<\/p>/g), ' ').trim();
			}

			/** parse Validation array  */
			let errors = parseValidation(req.validationErrors(), req);
			if (errors) {
				/** Send error response */
				return res.send({
					status: STATUS_ERROR,
					message: errors,
				});
			}

			/** Set options **/
			let options = {
				title: pageName,
				table_name: "jobs",
				slug_field: "slug"
			};

			/** Make Slug */
			getDatabaseSlug(options).then(response => {
				/** Save jobs details */
				const collection = db.collection('jobs');
				collection.insertOne({
					name					: pageName,
					body					: pageBody,
					slug					: (response && response.title) ? response.title : "",
					default_language_id		: DEFAULT_LANGUAGE_MONGO_ID,
					pages_descriptions		: (allData.pages_descriptions) ? allData.pages_descriptions : {},
					active 					: ACTIVE,
					created					: getUtcDate(),
					modified				: getUtcDate()
				}, (err, result) => {
					if (err) return next(err);

					/** Send success response */
					req.flash(STATUS_SUCCESS, res.__("admin.job.job_has_been_added_successfully"));
					res.send({
						status: STATUS_SUCCESS,
						redirect_url: WEBSITE_ADMIN_URL + 'jobs',
						message: res.__("admin.job.job_has_been_added_successfully")
					});
				});
			}, error => {
				/** Send error response */
				res.send({
					status: STATUS_ERROR,
					message: [{ param: ADMIN_GLOBAL_ERROR, msg: res.__("admin.system.something_going_wrong_please_try_again") }]
				});
			});
		} else {
		/** Get language list */
		getLanguages().then(languageList=>{
			req.breadcrumbs(BREADCRUMBS['admin/jobs/add']);
			/**Render add job page */
			res.render('add', {
				language_list: languageList
			});
		}).catch(next);
		}
	};//End addJob()


	/**
	 * Function for delete job
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return null
	 */
	this.deleteJob = (req, res) => {
		let id = (req.params.id) ? req.params.id : "";

		/** Delete job **/
		const collection = db.collection("jobs");
		collection.deleteOne({ _id: ObjectId(id) }, (err, result) => {
			if (err) return next(err);

			/** Send success response **/
			req.flash(STATUS_SUCCESS, res.__("admin.job.job_deleted_successfully"));
			res.redirect(WEBSITE_ADMIN_URL + "jobs");
		});
	};//End deleteJob()

	/**
	 * Function for update active/ deactive status
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return null
	 */
		this.updateStatus  = (req, res)=>{
		let jobId = (req.params.id) ? req.params.id : "";
		let status	 = (req.params.status==ACTIVE) ? DEACTIVE : ACTIVE;
		if(jobId){
			try{
				const collection = db.collection('jobs');
				collection.updateOne({
					_id : ObjectId(jobId)
				},
				{$set : {
					active	 : status,
					modified : getUtcDate()
				}},(err,result)=>{
					if(!err){
						/** Send success response **/
						req.flash(STATUS_SUCCESS,res.__("admin.jobs.status_updated_successfully"));
						res.redirect(WEBSITE_ADMIN_URL+'jobs');
					}else{
						/** Send error response **/
						req.flash(STATUS_ERROR,res.__("admin.system.something_going_wrong_please_try_again"));
						res.redirect(WEBSITE_ADMIN_URL+'jobs');
					}
				});
			}catch(e){
				/** Send error response **/
				req.flash(STATUS_ERROR,res.__("admin.system.something_going_wrong_please_try_again"));
				res.redirect(WEBSITE_ADMIN_URL+'jobs');
			}
		}else{
			/** Send error response **/
			req.flash(STATUS_ERROR,res.__("admin.system.invalid_access"));
			res.redirect(WEBSITE_ADMIN_URL+'jobs');
		}
	};// end updateStatus()
	
}
module.exports = new Jobs();

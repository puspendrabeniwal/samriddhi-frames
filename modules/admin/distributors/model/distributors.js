const asyncParallel	=	require('async/parallel');

function Distributors() {

	/**
	 * Function to get  distributor list
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 *
	 * @return render/json
	 */
	this.getDistributorList = (req,res)=>{
		if(isPost(req)){
			let limit			 =	(req.body.length) ? parseInt(req.body.length) :ADMIN_LISTING_LIMIT;
			let skip			 = 	(req.body.start)  ? parseInt(req.body.start)  :DEFAULT_SKIP;
			const collection	 = 	db.collection('distributors');
			/** Configure Datatable conditions*/
			configDatatable(req,res,null).then(dataTableConfig=>{
				dataTableConfig.conditions = Object.assign(dataTableConfig.conditions);

				asyncParallel({
					records :(callback)=>{	
						collection.find(dataTableConfig.conditions,{projection: {_id:1,name:1,address:1,state:1,modified:1}}).collation(COLLATION_VALUE).sort(dataTableConfig.sort_conditions).limit(limit).skip(skip).toArray((err, result)=>{
							callback(err, result);
						});
					},
					total_records:(callback)=>{
						/** Get total number of records in  distributor collection **/
						collection.countDocuments({},(err,countResult)=>{
							callback(err, countResult);
						});
					},
					filter_records:(callback)=>{
						/** Get filtered records counting in  distributor **/
						collection.countDocuments(dataTableConfig.conditions,(err,filterContResult)=>{
							callback(err, filterContResult);
						});
					}
				},(err, response)=>{
					/** Send response **/
					res.send({
						status			: (!err) ? STATUS_SUCCESS : STATUS_ERROR,
						draw			: dataTableConfig.result_draw,
						data			: (response.records) ? response.records :[],
						recordsFiltered	: (response.filter_records) ? response.filter_records :0,
						recordsTotal	: (response.total_records) ? response.total_records :0
					});
				});
			});
		}else{
			/** render distributor listing page **/
			req.breadcrumbs(BREADCRUMBS['admin/distributors/list']);
			res.render('list');
		}
	};//End getDistributorList()

	/**
	 * Function to get  distributer detail
	 *
	 * @param req	As Request Data
	 * @param res	As Response Data
	 * @param next 	As Callback argument to the middleware function
	 *
	 * @return json
	 */
	let getDistributorDetails = (req, res, next)=>{
		return new Promise(resolve=>{
			let distributorId =	(req.params.id)   ? req.params.id   :"";

			/** Get  distributor details **/
			const distributors = db.collection('distributors');
			distributors.findOne({
				_id  : ObjectId(distributorId),
			},(err, result)=>{
				if(err) return next(err);
				/** Send error response */
				if(!result) return resolve({status : STATUS_ERROR, message	: res.__("admin.system.invalid_access") });

				/** Send success response **/
				resolve({
					status	: STATUS_SUCCESS,
					result	: result
				});
			});
		}).catch(next);
	};// End getDistributorDetails()

	/**
	 * Function for add or update  Distributor
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 * @param next 	As Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.addEditDistributor = async (req, res,next)=>{
		let isEditable	= (req.params.id) ?	true :false;

		if(isPost(req)){
			/** Sanitize Data **/
			req.body 			= 	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
			let distributorId	=	(req.params.id) 	? 	ObjectId(req.params.id)	:ObjectId();

			/** Check validation **/
			req.checkBody({
				'name': {
					notEmpty: true,
					isLength:{
                        options: {
                        	min    : DISTRIBUTOR_NAME_MIN_LENGTH,
                    		max    : DISTRIBUTOR_NAME_MAX_LENGTH,
                        },
                        errorMessage: res.__("admin.distributors.please_enter_name_min_max",DISTRIBUTOR_NAME_MIN_LENGTH,DISTRIBUTOR_NAME_MAX_LENGTH)
                    },
					errorMessage: res.__("admin.distributors.please_enter_name")
				},
				'state': {
					notEmpty: true,
					errorMessage: res.__("admin.distributors.please_select_state"),
				},
				'address': {
					notEmpty: true,
					isLength	:	{
						options		: {min:DISTRIBUTOR_ADDRESS_MIN_LENGTH,max:DISTRIBUTOR_ADDRESS_MAX_LENGTH},
						errorMessage: res.__("admin.distributors.please_enter_address_min_max",DISTRIBUTOR_ADDRESS_MIN_LENGTH,DISTRIBUTOR_ADDRESS_MAX_LENGTH)
					},
					errorMessage: res.__("admin.distributors.please_enter_address"),
				},
			});


			/** parse Validation array  **/
			let errors = parseValidation(req.validationErrors(),req);

			/** Send error response **/
			if(errors) return res.send({status	: STATUS_ERROR, message	: errors});
			const distributors = db.collection('distributors');

			asyncParallel({
				slug: (callback)=>{
					if(isEditable) return callback(null,null);
					/** Set options for get  distributors slug **/
					let slugOptions = {
						title 		: req.body.name,
						table_name 	: "distributors",
						slug_field 	: "slug"
					};
					/** Get slug **/
					getDatabaseSlug(slugOptions).then(slugResponse=>{
						let slug 		= (slugResponse && slugResponse.title) ? slugResponse.title :"";
						callback(null,slug);
					}).catch(next);
				},
			},(asyncErr, asyncResponse)=>{

				if(asyncErr) return res.send({status : STATUS_ERROR, message : res.__("system.something_going_wrong_please_try_again")});
				let state = (req.body.state) 	? req.body.state : '';
				let newState = 	state.split("-");
				let stateCode = newState[0];
				let stateName = newState[1];
				/** Save  distributors details **/
				distributors.updateOne({
					_id : distributorId
				},
				{
					$set : {
						name		:	(req.body.name) 	? req.body.name : '',
						address		: 	(req.body.address)  ? req.body.address : '',
						state 		: 	stateCode,
						state_name  : 	stateName,
						modified 	: 	getUtcDate()
					},
					$setOnInsert: {
						is_deleted  :   NOT_DELETED,
						slug 		:   (asyncResponse.slug) ? asyncResponse.slug :"",
						created 	: 	getUtcDate(),
					}
				},{upsert: true},(err) => {
					if(err) return next(err);

					/** Send success response **/
					let message = (isEditable) ? res.__("admin.distributors.distributor_has_been_updated_successfully") :res.__("admin.distributors.distributor_has_been_added_successfully");
					req.flash(STATUS_SUCCESS,message);
					res.send({
						status		:	STATUS_SUCCESS,
						redirect_url:  	WEBSITE_ADMIN_URL+"distributors",
						message		:	message,
					});
				});
			});
		}else{
			let result = {};
			if(isEditable){
				/** Get  Faq details **/
				response  =	await getDistributorDetails(req, res, next);
				if(response.status != STATUS_SUCCESS){
					/** Send error response **/
					req.flash(STATUS_ERROR,response.message);
					return res.redirect(WEBSITE_ADMIN_URL+"distributors");
				}
				result = response.result;
			}

			/** Render edit page  **/
			let breadcrumbs = (isEditable) ?  'admin/distributors/edit' :'admin/distributors/add';
			req.breadcrumbs(BREADCRUMBS[breadcrumbs]);
			res.render('add_edit',{
				result		       : result,
				is_editable	       : isEditable,
				dynamic_variable   : 'distributors',
				stateList	   	   : FULLSTATENAME
			});
		}
	};//End addEditDistributor()

	/**
	 * Function for delete Distributors
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 * @param next 	As Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.DistributorDelete = (req, res, next)=>{
		let distributorId = 	(req.params.id)	? req.params.id	:"";
		/** Remove  Faq record **/
		const collection = db.collection('distributors');
		collection.deleteOne({_id : ObjectId(distributorId)},(err)=>{
			if(err) return next(err);
			/** Send success response **/
			req.flash(STATUS_SUCCESS,res.__("admin.distributors.distributor_deleted_successfully"));
			res.redirect(WEBSITE_ADMIN_URL+"distributors");
		});
	};//End DistributorsDelete()
}
module.exports = new  Distributors();

const asyncParallel	= require("async/parallel");
const clone			= require("clone");

function Block() {

	/**
	 * Function to get block list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.getBlockList = (req, res,next)=>{
		if(isPost(req)){
			let limit			= (req.body.length) ? parseInt(req.body.length)	: ADMIN_LISTING_LIMIT;
			let skip			= (req.body.start)	? parseInt(req.body.start)	: DEFAULT_SKIP;
			const collection	= db.collection('blocks');

			/** Configure Datatable conditions*/
			configDatatable(req,res,null).then(dataTableConfig=>{
				asyncParallel([
					(callback)=>{
						/** Get list of blocks **/
						collection.find(dataTableConfig.conditions,{projection: {_id:1,page_name :1, title:1, name:1,body:1,modified:1,is_active:1}}).collation(COLLATION_VALUE).sort(dataTableConfig.sort_conditions).limit(limit).skip(skip).toArray((err,result)=>{
							callback(err, result);
						});
					},
					(callback)=>{
						/** Get total number of records in blocks collection **/
						collection.countDocuments({},(err,countResult)=>{
							callback(err, countResult);
						});
					},
					(callback)=>{
						/** Get filtered records counting in blocks **/
						collection.countDocuments(dataTableConfig.conditions,(err,filterContResult)=>{
							callback(err, filterContResult);
						});
					}
				],
				(err, response)=>{
					/** Send response **/
					res.send({
						status			: (!err) ? STATUS_SUCCESS : STATUS_ERROR,
						draw			: dataTableConfig.result_draw,
						data			: (response[0]) ? response[0] : [],
						recordsFiltered	: (response[2]) ? response[2] : 0,
						recordsTotal	: (response[1]) ? response[1] : 0
					});
				});
			});
		}else{
			/** render listing page **/
			req.breadcrumbs(BREADCRUMBS['admin/block/list']);
			res.render('list');
		}
	};//End getBlockList()

	/**
	 * Function to get block's detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	let getBlockDetails = (req,res,next)=>{
		return new Promise(resolve=>{
			let blockId = (req.params.id) ? req.params.id : "";
			/** Get Cms details **/
			const blocks = db.collection('blocks');
			blocks.findOne({
					_id : ObjectId(blockId)
				},
				{projection: {
					_id:1,page_name :1,title:1,name:1,body:1,modified:1,pages_descriptions:1
				}},(err, result)=>{
					if(err) return next(err);
					if(!result){
						/** Send error response **/
						let response = {
							status	: STATUS_ERROR,
							message	: res.__("admin.system.invalid_access")
						};
						return resolve(response);
					}

					/** Send success response **/
					let response = {
						status	: STATUS_SUCCESS,
						result	: result
					};
					resolve(response);
				}
			);
		});
	};// End getBlockdetails().

	/**
	 * Function to update block's detail
	 *
	 * @param req 	As 	Request Data
	 * @param res 	As 	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.editBlock = (req, res,next)=>{
		if(isPost(req)){
			/** Sanitize Data **/
			req.body	= sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
			let id		= (req.params.id) ? req.params.id :"";

			if(id == "" || typeof req.body.pages_descriptions === typeof undefined || (typeof req.body.pages_descriptions[DEFAULT_LANGUAGE_MONGO_ID] === typeof undefined || !req.body.pages_descriptions[DEFAULT_LANGUAGE_MONGO_ID] || req.body.pages_descriptions[DEFAULT_LANGUAGE_MONGO_ID] == '')){
				/** Send error response **/
				return res.send({
					status	: STATUS_ERROR,
					message	: [{param:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}]
				});
			}

			let allData		= req.body;
			req.body		= clone(allData.pages_descriptions[DEFAULT_LANGUAGE_MONGO_ID]);
			let pageTitle	= (req.body.title)	? req.body.title	: "";
			let pageBody	= (req.body.body)	? req.body.body	: "";

			/** Check validation **/
			req.checkBody({
				'name': {
					notEmpty: true,
					errorMessage: res.__("admin.block.please_enter_page_name")
				},
				'title': {
					notEmpty: true,
					errorMessage: res.__("admin.block.please_enter_title")
				},
				'body': {
					notEmpty: true,
					errorMessage: res.__("admin.block.please_enter_page_description")
				},
			});

			if(pageBody!= ""){
				req.body.body =  pageBody.replace(new RegExp(/&nbsp;|<br \/\>|<p>|<\/p>/g),' ').trim();
			}

			/** parse Validation array  **/
			let errors = parseValidation(req.validationErrors(),req);
			if (errors) {
				/** Send error response **/
				return res.send({
					status	: STATUS_ERROR,
					message	: errors,
				});
			}

			/** Update block details **/
			const blocks = db.collection("blocks");
			blocks.updateOne({
					_id : ObjectId(id)
				},
				{$set: {
					body				: 	pageBody,
					name				: 	(req.body.name)	?	req.body.name	:"",
					title				: 	(req.body.title)	?	req.body.title	:"",
					page_name			: 	(req.body.page_name)	?	req.body.page_name	:"",
					default_language_id	: 	DEFAULT_LANGUAGE_MONGO_ID,
					pages_descriptions	: 	(allData.pages_descriptions) ? allData.pages_descriptions :{},
					modified 			:	getUtcDate()
				}},(err,result)=>{
					if(err) return next(err);

					/** Send success response **/
					req.flash(STATUS_SUCCESS,res.__("admin.block.block_details_has_been_updated_successfully"));
					res.send({
						status			: STATUS_SUCCESS,
						redirect_url	: WEBSITE_ADMIN_URL+'block',
						message			: res.__("admin.block.block_details_has_been_updated_successfully"),
					});
				}
			);
		}else{
			/** Get language list **/
			getLanguages().then(languageList=>{
				/** Get cms details **/
				getBlockDetails(req,res,next).then(response=>{
					if(response.status != STATUS_SUCCESS){
						/** Send error response **/
						req.flash(STATUS_ERROR,response.message);
						res.redirect(WEBSITE_ADMIN_URL+'block');
						return;
					}

					/** Render edit page **/
					req.breadcrumbs(BREADCRUMBS['admin/block/edit']);
					res.render('edit',{
						result			: 	response.result,
						language_list	:	languageList
					});
				}).catch(next);
			}).catch(next);
		}
	};//End editBlock()

	/**
	 * Function for add block
	 *
	 * @param req 	As	Request Data
	 * @param res 	As	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.addBlock = (req, res,next)=>{
		if(isPost(req)){
			/** Sanitize Data */
			req.body = 	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
			
			if(req.body.pages_descriptions === undefined || req.body.pages_descriptions[DEFAULT_LANGUAGE_MONGO_ID] === undefined || req.body.pages_descriptions[DEFAULT_LANGUAGE_MONGO_ID] == ''){
				/** Send error response */
				return res.send({
					status	: STATUS_ERROR,
					message	: [{param:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}]
				});
			}

			let allData		= 	req.body;
			req.body		=	clone(allData.pages_descriptions[DEFAULT_LANGUAGE_MONGO_ID]);
			let pageBody	= 	(req.body.body)	?	req.body.body	:"";
			let pageName	= 	(req.body.name) ? 	req.body.name 	:"";
			let pageTitle	= 	(req.body.title) ? 	req.body.title 	:"";

			/** Check validation */
			req.checkBody({
				'name': {
					notEmpty: true,
					errorMessage: res.__("admin.block.please_enter_page_name")
				},
				'title': {
					notEmpty: true,
					errorMessage: res.__("admin.block.please_enter_title")
				},
				'body': {
					notEmpty: true,
					errorMessage: res.__("admin.block.please_enter_page_description")
				},
			})

			if(pageBody!= ""){
				req.body.body =  pageBody.replace(new RegExp(/&nbsp;|<br \/\>|<p>|<\/p>/g),' ').trim();
			}

			/** parse Validation array  */
			let errors = parseValidation(req.validationErrors(),req);
			if (errors) {
				/** Send error response */
				return res.send({
					status	: STATUS_ERROR,
					message	: errors,
				});
			}

			/** Set options **/
			let options = {
				title 		:	pageName,
				table_name 	: 	"blocks",
				slug_field 	: 	"slug"
			};

			/** Make Slug */
			getDatabaseSlug(options).then(response=>{
				/** Save block details */
				const blocks = db.collection('blocks');
				blocks.insertOne({
					name				:	pageName,
					title				:	pageTitle,
					body				: 	pageBody,
					slug				: 	(response && response.title)	?	response.title	:"",
					default_language_id	: 	DEFAULT_LANGUAGE_MONGO_ID,
					pages_descriptions	: 	(allData.pages_descriptions)	?	allData.pages_descriptions :{},
					created 			: 	getUtcDate(),
					modified 			: 	getUtcDate()
				},(err,result)=>{
					if(err) return next(err);

					/** Send success response */
					req.flash(STATUS_SUCCESS,res.__("admin.block.block_has_been_added_successfully"));
					res.send({
						status			: STATUS_SUCCESS,
						redirect_url	: WEBSITE_ADMIN_URL+'block',
						message			: res.__("admin.block.block_has_been_added_successfully")
					});
				});
			},error=>{
				/** Send error response */
				res.send({
					status	: STATUS_ERROR,
					message	: [{param:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}]
				});
			});
		}else{
			/** Get language list */
			getLanguages().then(languageList=>{
				req.breadcrumbs(BREADCRUMBS['admin/block/add']);
				/**Render add block page */
				res.render('add',{
					language_list	: languageList
				});
			}).catch(next);
		}
	};//End addBlock()

	/**
	 * Function to upload ckeditor image
	 *
	 * @param req 	As 	Request Data
	 * @param res 	As 	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.ckeditorUploader = (req, res,next)=>{
		let image           =   (req.files && req.files.file)  ?   req.files.file :"";
		let imgaeOptions    =   {'image'     :   image,'filePath'  :   CKEDITOR_FILE_PATH};

		moveUploadedFile(req, res,imgaeOptions).then(imgaeResponse=>{
			if(imgaeResponse.status == STATUS_ERROR){
				/** Send error response **/
				return res.send({
					status  : STATUS_ERROR,
					message : [{'param':'file','msg':imgaeResponse.message}],
				});
			}else{
				res.send({
					status			: STATUS_SUCCESS,
					url             : CKEDITOR_URL+imgaeResponse.fileName
				});
			}
		}).catch(next);
	};//End ckeditorUploader()
}
module.exports = new Block();

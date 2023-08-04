const asyncParallel	= require("async/parallel");
const clone			= require("clone");

function Slider() {

	/**
	 * Function to get Slider list
	 *
	 * @param req As Request Data
	 * @param res As Response Data
	 *
	 * @return render/json
	 */
	this.getSliderList = (req, res,next)=>{
		if(isPost(req)){
			let limit			= (req.body.length) ? parseInt(req.body.length)	: ADMIN_LISTING_LIMIT;
			let skip			= (req.body.start)	? parseInt(req.body.start)	: DEFAULT_SKIP;
			const collection	= db.collection('slider');

			/** Configure Datatable conditions*/
			configDatatable(req,res,null).then(dataTableConfig=>{
				asyncParallel([
					(callback)=>{
						/** Get list of Slider **/
						collection.find(dataTableConfig.conditions,{projection: {_id:1,slider_title:1,body:1,action_name:1,slider_url:1,modified:1,status:1,order:1}}).collation(COLLATION_VALUE).sort(dataTableConfig.sort_conditions).limit(limit).skip(skip).toArray((err,result)=>{
							callback(err, result);
						});
					},
					(callback)=>{
						/** Get total number of records in slider collection **/
						collection.countDocuments({},(err,countResult)=>{
							callback(err, countResult);
						});
					},
					(callback)=>{
						/** Get filtered records counting in slider **/
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
			req.breadcrumbs(BREADCRUMBS['admin/slider/list']);
			res.render('list');
		}
	};//End getSliderList()

	/**
	 * Function to get Slider's detail
	 *
	 * @param req	As	Request Data
	 * @param res	As	Response Data
	 * @param next	As 	Callback argument to the middleware function
	 *
	 * @return json
	 */
	let getSliderDetails = (req,res,next)=>{
		return new Promise(resolve=>{
			let sliderId = (req.params.id) ? req.params.id : "";
			/** Get Slider details **/
			const slider = db.collection('slider');
			slider.findOne({
					_id : ObjectId(sliderId)
				},
				{projection: {
					_id:1,slider_title:1,body:1,modified:1,slider_image:1,slider_descriptions:1,action_name:1,slider_url:1,status:1,order:1
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

					/** Set options for append image full path **/
	                let options = {
	                    "file_url"          :   SLIDERS_URL,
	                    "file_path"         :   SLIDERS_FILE_PATH,
	                    "result"            :   [result],
	                    "database_field"    :   "slider_image"
	                };

	                /** Append image with full path **/
	                appendFileExistData(options).then(fileResponse=>{
	                    let response = {
	                        status  : STATUS_SUCCESS,
	                        result  : (fileResponse && fileResponse.result && fileResponse.result[0])   ?   fileResponse.result[0]  :{}
	                    };
	                    resolve(response);
	                });
				}
			);
		});
	};// End getSliderDetails().

	/**
	 * Function to update Slider's detail
	 *
	 * @param req 	As 	Request Data
	 * @param res 	As 	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.editSlider = (req, res,next)=>{
		if(isPost(req)){
			/** Sanitize Data **/
			req.body	= sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);
			let id		= (req.params.id) ? req.params.id :"";

			let sliderUrl	= 	(req.body.slider_url) 	? 	req.body.slider_url :"";
			let actionName	= 	(req.body.action_name) 	? 	req.body.action_name :"";
			let pageBody	= 	(req.body.slider_descriptions)	?	req.body.slider_descriptions:"";
			let sliderTitle	= 	(req.body.slider_title) 		? 	req.body.slider_title :"";
			let order		= 	(req.body.order) 	? 	parseInt(req.body.order):"";

			/** Check validation **/
			req.checkBody({
				'slider_title': {
					notEmpty: true,
					isLength:{
                        options: {
                        	min    : SLIDER_NAME_MIN_LENGTH,
                    		max    : SLIDER_NAME_MAX_LENGTH,
                        },
                        errorMessage: res.__("admin.slider.please_enter_slider_name_min",SLIDER_NAME_MIN_LENGTH,SLIDER_NAME_MAX_LENGTH)
                    },
					errorMessage: res.__("admin.slider.please_enter_page_name")
				},
				'slider_descriptions': {
					notEmpty: true,
					isLength:{
                        options: {
                        	min    : SLIDER_DESCRIPTION_MIN_LENGTH,
                    		max    : SLIDER_DESCRIPTION_MAX_LENGTH,
                        },
                        errorMessage: res.__("admin.slider.please_enter_slider_description_min",SLIDER_DESCRIPTION_MIN_LENGTH,SLIDER_DESCRIPTION_MAX_LENGTH)
                    },
					errorMessage: res.__("admin.slider.please_enter_page_description")
				},
				'action_name': {
					notEmpty: true,
					errorMessage: res.__("admin.slider.please_enter_action_name")
				},
				'order': {
					notEmpty: true,
					errorMessage: res.__("admin.slider.please_enter_order"),
					isInt: {
						errorMessage: res.__("admin.slider.please_only_numeric_order",1)
					}
				},
			});

			if(sliderUrl){
				req.checkBody({
					'slider_url': {
						isURL: true,
						errorMessage: res.__("admin.slider.please_enter_valid_url")
					}
				})
			}

			
			
			/** parse Validation array  **/

			const slider = db.collection("slider");
			slider.findOne({order : order, _id : {$ne : ObjectId(id)}},{projection: {_id:1,order:1}},(err,result)=>{
				let errors = parseValidation(req.validationErrors(),req);
				if(order <= NOT){
					if(!errors) errors =[];
					errors.push({'param':'order','msg':res.__("admin.slider.please_only_numeric_order",1)});
				}
				
				if(result && result != null ){
					if(!errors) errors =[];
					errors.push({'param':'order','msg':res.__("admin.slider.order_exist",1)});
				}
				if (errors && errors.length > NOT) return res.send({status	: STATUS_ERROR,message	: errors});
				/** Set options for upload image **/
				let oldimage=   (req.body.old_image) ? req.body.old_image :"";
				let image   =   (req.files && req.files.slider_image)  ?   req.files.slider_image :"";
				let imgaeOptions =   {
					'image'     :   image,
					'filePath'  :   SLIDERS_FILE_PATH,
					'oldPath'   :   oldimage
				};
				moveUploadedFile(req, res,imgaeOptions).then(imgaeResponse=>{
					if(imgaeResponse.status == STATUS_ERROR){
						/** Send error response **/
						return res.send({
							status  : STATUS_ERROR,
							message : [{'param':'slider_image','msg':imgaeResponse.message}],
						});
					}

					/** Update Slider details **/
					const slider = db.collection("slider");
					slider.updateOne({
							_id : ObjectId(id)
						},
						{$set: {
							slider_title		:	sliderTitle,
							body				: 	pageBody,
							order               :   order,
							action_name			: 	actionName,
							slider_url			: 	sliderUrl,
							slider_descriptions	: 	pageBody,
							slider_image    	:  imgaeResponse.fileName   ?   imgaeResponse.fileName   :"",
							modified 			:	getUtcDate()
						}},(err,result)=>{
							if(err) return next(err);

							/** Send success response **/
							req.flash(STATUS_SUCCESS,res.__("admin.slider.slider_details_has_been_updated_successfully"));
							res.send({
								status			: STATUS_SUCCESS,
								redirect_url	: WEBSITE_ADMIN_URL+'slider',
								message			: res.__("admin.slider.slider_details_has_been_updated_successfully"),
							});
						}
					);
				}).catch(next);
			})
		}else{
			/** Get language list **/
			getLanguages().then(languageList=>{
				/** Get Slider details **/
				getSliderDetails(req,res,next).then(response=>{
					if(response.status != STATUS_SUCCESS){
						/** Send error response **/
						req.flash(STATUS_ERROR,response.message);
						res.redirect(WEBSITE_ADMIN_URL+'slider');
						return;
					}

					/** Render edit page **/
					req.breadcrumbs(BREADCRUMBS['admin/slider/edit']);
					res.render('edit',{
						result			: 	response.result,
						language_list	:	languageList
					});
				}).catch(next);
			}).catch(next);
		}
	};//End editSlider()

	/**
	 * Function for add Slider
	 *
	 * @param req 	As	Request Data
	 * @param res 	As	Response Data
	 * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.addSlider = (req, res,next)=>{
		if(isPost(req)){
			/** Sanitize Data */
			req.body = 	sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);

			let sliderUrl	= 	(req.body.slider_url) 	? 	req.body.slider_url 	:"";
			let actionName	= 	(req.body.action_name) 	? 	req.body.action_name 	:"";
			let pageBody	= 	(req.body.slider_descriptions)	?	req.body.slider_descriptions :"";
			let sliderTitle	= 	(req.body.slider_title) 		? 	req.body.slider_title :"";
			let order		= 	(req.body.order) 	? 	parseInt(req.body.order):NOT;
		
			/** Check validation */
			req.checkBody({
				'slider_title': {
					notEmpty: true,
					isLength:{
                        options: {
                        	min    : SLIDER_NAME_MIN_LENGTH,
                    		max    : SLIDER_NAME_MAX_LENGTH,
                        },
                        errorMessage: res.__("admin.slider.please_enter_slider_title_min",SLIDER_NAME_MIN_LENGTH,SLIDER_NAME_MAX_LENGTH)
                    },
					errorMessage: res.__("admin.slider.please_enter_slider_title")
				},
				'action_name': {
					notEmpty: true,
					errorMessage: res.__("admin.slider.please_enter_action_name")
				},
				'order': {
					notEmpty: true,
					errorMessage: res.__("admin.slider.please_enter_order"),
					isInt: {
						errorMessage: res.__("admin.slider.please_only_numeric_order",1)
					}
				},
				'slider_descriptions': {
					notEmpty: true,
					isLength:{
                        options: {
                        	min    : SLIDER_DESCRIPTION_MIN_LENGTH,
                    		max    : SLIDER_DESCRIPTION_MAX_LENGTH,
                        },
                        errorMessage: res.__("admin.slider.please_enter_slider_description_min",SLIDER_DESCRIPTION_MIN_LENGTH,SLIDER_DESCRIPTION_MAX_LENGTH)
                    },
					errorMessage: res.__("admin.slider.please_enter_page_description")
				},
			})
		
			
			if(sliderUrl){
				req.checkBody({
					'slider_url': {
						isURL: true,
						errorMessage: res.__("admin.slider.please_enter_valid_url")
					}
				})
			}

			/** parse Validation array  */
			let errors = parseValidation(req.validationErrors(),req);

			const slider = db.collection("slider");
			slider.findOne({order : order},{projection: {_id:1,order:1}},(err,result)=>{
				
				if(!errors) errors =[];
				if(order <= NOT){
					if(!errors) errors =[];
					errors.push({'param':'order','msg':res.__("admin.slider.please_only_numeric_order",1)});
				}
				if(result && result != null ){
					errors.push({'param':'order','msg':res.__("admin.slider.order_exist",1)});
				}

				if(!req.files || !req.files.slider_image){
					if(!errors) errors =[];
					errors.push({'param':'slider_image','msg':res.__("admin.user.please_select_image")});
				}

				
				if (errors && errors.length > NOT) return res.send({status	: STATUS_ERROR,message	: errors});
				let image           =   (req.files && req.files.slider_image)  ?   req.files.slider_image :"";
				let imgaeOptions    =   {'image'     :   image,'filePath'  :   SLIDERS_FILE_PATH};

				moveUploadedFile(req, res,imgaeOptions).then(imgaeResponse=>{
					if(imgaeResponse.status == STATUS_ERROR){
						/** Send error response **/
						return res.send({
							status  : STATUS_ERROR,
							message : [{'param':'slider_image','msg':imgaeResponse.message}],
						});
					}
					/** Set options **/
					let options = {
						title 		:	sliderTitle,
						table_name 	: 	"slider",
						slug_field 	: 	"slug"
					};

					/** Make Slug */
					getDatabaseSlug(options).then(response=>{
						/** Save Slider details */
						const slider = db.collection('slider');
						slider.insertOne({
							slider_title		:	sliderTitle,
							body				: 	pageBody,
							order               :   order,
							action_name			: 	actionName,
							slider_url			: 	sliderUrl,
							slug				: 	(response && response.title)	?	response.title	:"",
							slider_descriptions	: 	pageBody,
							slider_image 		:   (imgaeResponse.fileName)    ?   imgaeResponse.fileName  :"",
							status 				:   ACTIVE,
							created 			: 	getUtcDate(),
							modified 			: 	getUtcDate()
						},(err,result)=>{
							if(err) return next(err);

							/** Send success response */
							req.flash(STATUS_SUCCESS,res.__("admin.slider.slider_has_been_added_successfully"));
							res.send({
								status			: STATUS_SUCCESS,
								redirect_url	: WEBSITE_ADMIN_URL+'slider',
								message			: res.__("admin.slider.slider_has_been_added_successfully")
							});
						});
					},error=>{
						/** Send error response */
						res.send({
							status	: STATUS_ERROR,
							message	: [{param:ADMIN_GLOBAL_ERROR,msg:res.__("admin.system.something_going_wrong_please_try_again")}]
						});
					});
				}).catch(next);
			})
		}else{
			/** Get language list */
			getLanguages().then(languageList=>{
				req.breadcrumbs(BREADCRUMBS['admin/slider/add']);
				/**Render add Slider page */
				res.render('add',{
					language_list	: languageList
				});
			}).catch(next);
		}
	};//End addSlider()

	/**
	 * Function for update slider status
	 *
	 * @param req 	As 	Request Data
     * @param res 	As 	Response Data
     * @param next 	As 	Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	this.updateSliderStatus = (req,res,next)=>{
		let sliderId		=	(req.params.id)				?	req.params.id			: "";
		let sliderStatus	=	(req.params.status==ACTIVE) ? 	DEACTIVE 				: ACTIVE;
			
		/** Update slider status **/
		const sliders = db.collection("slider");
		sliders.updateOne({
			_id : ObjectId(sliderId)
		},
		{$set : {
			status		: 	sliderStatus,
			modified	:	getUtcDate()			
		}},(err, result)=>{
			if(err) return next(err);
			/** Send success response **/
			req.flash("success",res.__("admin.slider.status_has_been_updated_successfully"));
			res.redirect(WEBSITE_ADMIN_URL+"slider");	
		});
	};// end updateSliderStatus()

	/**
	 * Function for delete slider
	 *
	 * @param req 	As Request Data
	 * @param res 	As Response Data
	 * @param next 	As Callback argument to the middleware function
	 *
	 * @return render/json
	 */
	 this.deleteSlider = (req, res, next)=>{
		let id	=	(req.params.id)		?	req.params.id	: "";
		/** Remove  slider record **/
		const slider = db.collection('slider');
		slider.deleteOne({_id : ObjectId(id)},(err)=>{
			if(err) return next(err);
			/** Send success response **/
			req.flash(STATUS_SUCCESS,res.__("admin.slider.slider_deleted_successfully"));
			res.redirect(WEBSITE_ADMIN_URL+"slider");
		});
	}
}
module.exports = new Slider();

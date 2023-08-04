const asyncParallel = require("async/parallel");
const asyncForEachOf = require("async/forEachOf");
const { ObjectId } = require('mongodb');
const e = require("express");

function Product() {
    /**
     * Function for get list of users
     *
     * @param req As Request Data
     * @param res As Response Data
     *
     * @return render/json
     */
    this.getProductList = (req, res)=>{
        if(isPost(req)){

            let limit           = (req.body.length)         ? parseInt(req.body.length)         : ADMIN_LISTING_LIMIT;
            let skip            = (req.body.start)          ? parseInt(req.body.start)          : DEFAULT_SKIP;
            let statusSearch    = (req.body.status_search)  ? parseInt(req.body.status_search)  : "";

            /** Configure DataTable conditions*/
            configDatatable(req,res,null).then(dataTableConfig=>{
                /** Set conditions **/
                let commonConditions = {
                    is_deleted      : NOT_DELETED
                };

                /** Conditions for search using status*/
                if (statusSearch != "") {
                    switch(statusSearch){
                        case SEARCHING_ACTIVE:
                            dataTableConfig.conditions.is_active       = ACTIVE;
                        break;

                        case SEARCHING_DEACTIVE:
                            dataTableConfig.conditions.is_active       = DEACTIVE;
                        break;
                        case SEARCHING_POPULAR:
                            dataTableConfig.conditions.is_popular       = ACTIVE;
                        break;

                        case SEARCHING_NOT_POPULAR:
                            dataTableConfig.conditions.is_popular       = DEACTIVE;
                        break;
                    }
                }

                dataTableConfig.conditions = Object.assign(dataTableConfig.conditions,commonConditions);

                const collection    = db.collection("products");
                asyncParallel([
                    (callback)=>{
                        /** Get list of user's **/
                        collection.aggregate([
                            {$match: dataTableConfig.conditions},
                            {$lookup:{
                                from: "masters",
                                let: { categoryId: "$category" },
                                pipeline: [
                                  {$match: {
                                    $expr: {
                                      $and: [
                                        { $eq: ["$_id", "$$categoryId"] },
                                      ],
                                    },
                                  }},
                                ],
                                as: "categoryDetail",
                            }},
                            {$project: {
                                _id:1,product_name:1,created:1,is_active:1,is_popular :1,is_sale_on:1,
                                category_name : {'$arrayElemAt': ["$categoryDetail.name",0]}
                            }},
                            {$sort : dataTableConfig.sort_conditions},
                            {$skip : skip},
                            {$limit: limit}
                        ]).collation(COLLATION_VALUE).toArray((err, result)=>{
                            callback(err, result);
                        });
                    },
                    (callback)=>{
                        /** Get total number of records in product collection **/
                        collection.countDocuments(commonConditions,(err,countResult)=>{
                            callback(err, countResult);
                        });
                    },
                    (callback)=>{
                        /** Get filtered records couting in product **/
                        collection.countDocuments(dataTableConfig.conditions,(err,filterContResult)=>{
                            callback(err, filterContResult);
                        });
                    }
                ],
                (err,response)=>{
                    /** Send response **/
                    res.send({
                        status          : (!err) ? STATUS_SUCCESS : STATUS_ERROR,
                        draw            : dataTableConfig.result_draw,
                        data            : (response[0]) ? response[0] : [],
                        recordsFiltered : (response[2]) ? response[2] : 0,
                        recordsTotal    : (response[1]) ? response[1] : 0
                    });
                });
            });
        }else{
            let dynamicVariable = 'Products'         
            /** render listing page **/
            req.breadcrumbs(BREADCRUMBS["admin/products/list"]);
            res.render("list",{
                dynamic_variable    : dynamicVariable,
                dynamic_url         : dynamicVariable,
            });
        }
    };//End getProductList()

    /**
     * Function for add product
     *
     * @param req   As  Request Data
     * @param res   As  Response Data
     * @param next  As  Callback argument to the middleware function
     *
     * @return render/json
     */
    this.addProduct = (req,res,next)=>{
        if(isPost(req)){

            /** Sanitize Data **/
            req.body        =   sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);

            /** Check validation **/
            req.checkBody({
                "product_name": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_name")
                },
                "category": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_select_category"),
                },
                "sake_meter": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_sake_meter"),
                },
                "flavor": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_flavor")
                },
                "alcohol_level": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_alcohol_level")
                },
                "acidity_level": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_acidity_level")
                },
                "polish_rate": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_polish_rate")
                },
                "sweetness": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_select_sweetness")
                },
                "body": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_select_body")
                },
                "characteristics": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_select_characteristics")
                },
                "pairing_foods": {
                    notEmpty: true,
                    isLength:{
                        options: 2,
                        errorMessage: res.__("admin.products.pairing_foods_length_should_be_minimum_character",2)
                    },
                    errorMessage: res.__("admin.products.please_enter_pairing_foods")
                },
                "product_origin": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_product_origin")
                },
                "description": {
                    notEmpty: true,
                    isLength:{
                        options: 10,
                        errorMessage: res.__("admin.products.description_length_should_be_minimum_character",10)
                    },
                    errorMessage: res.__("admin.products.please_enter_description")
                },
            });

            let productName         = (req.body.product_name)   ? req.body.product_name : '';
            let category            = (req.body.category)       ? req.body.category : '';
            let sakeMeter           = (req.body.sake_meter)     ? req.body.sake_meter : '';
            let flavor              = (req.body.flavor)         ? req.body.flavor : '';
            let alcoholLevel        = (req.body.alcohol_level)  ? req.body.alcohol_level : '';
            let acidityLevel        = (req.body.acidity_level)  ? req.body.acidity_level : '';
            let polishRate          = (req.body.polish_rate)    ? req.body.polish_rate : '';
            let sweetness           = (req.body.sweetness)      ? req.body.sweetness : '';
            let body                = (req.body.body)           ? req.body.body : '';
            let characteristics     = (req.body.characteristics)? JSON.parse(req.body.characteristics) : [];
            let pairingFoods        = (req.body.pairing_foods)  ? req.body.pairing_foods : '';
            let size                = (req.body.size)           ? JSON.parse(req.body.size) : [];
            let defaultProductImage = (req.body.default_product_image)? req.body.default_product_image : '';
            let servingTemperature  = (req.body.serving_temperature)  ? JSON.parse(req.body.serving_temperature) : [];
            let productOrigin       = (req.body.product_origin)       ? req.body.product_origin : '';
            let description         = (req.body.description)          ? req.body.description : '';

            
            /** parse Validation array  **/
            let errors = parseValidation(req.validationErrors(),req);

            /** Serving temperature validation **/
            let productServingTemperature = [];
            if(servingTemperature && servingTemperature.length > 0){
                if(!errors) errors =[];
                servingTemperature.map((records, index)=>{
                    if(records.category_id) productServingTemperature[index] = records['category_id'] = ObjectId(records.category_id)
                    if(records.temperature_id) productServingTemperature[index] = records['temperature_id'] = ObjectId(records.temperature_id)
                    else productServingTemperature.push(records['temperature_id'] = ObjectId(FRONT_USER_ROLE_ID))
                    if(records.rating) productServingTemperature.push(records['rating'] = records.rating)
                    if(!records.category_id && records.rating) errors.push({'param':'serving_temperature_category_'+index,'msg':res.__("admin.products.please_select_category")});
                    if(records.category_id && !records.rating) errors.push({'param':'serving_temperature_rating_'+index,'msg':res.__("admin.products.please_select_rating")});
                }) 
            }


            /** Set characteristics as ObjectID **/
            let productCharacteristics = [];
            if(characteristics && characteristics.length > 0){
                if(!errors) errors =[];
                characteristics.map((records, index)=>{
                    productCharacteristics.push(ObjectId(records))
                }) 
            }

            /** Product size with image validation **/
            if(size && size.length > 0){
                if(!errors) errors = [];
                size.map((records, index)=>{
                    if(records && !records.size) errors.push({'param':'size'+index,'msg':res.__("admin.products.please_select_size")});
                    if(records && records.size && (!req.files || !req.files['product_images_'+index])){
                        if(!errors) errors =[];
                        errors.push({'param':'product_images_'+index,'msg':res.__("admin.products.please_select_image")});
                    }
                }) 
            }else{
                if(!errors) errors = [];
                errors.push({'param':'size','msg':res.__("admin.products.please_select_at_least_one_size")});
            }

            /** Product image validation **/
            if(size && size.length > 0 && !defaultProductImage){
                if(!errors) errors = [];
                errors.push({'param':'size','msg':res.__("admin.products.please_make_a_product_size_and_image_as_default")});
            }


            /** Product sheet images validation **/
            if(req.files && !req.files['product_sheet']){
                if(!errors) errors =[];
                errors.push({'param':'product_sheet','msg':res.__("admin.products.please_select_pdf_file")});
            }

            /** Shelf talker images validation **/
            if(req.files && !req.files['shelf_talker']){
                if(!errors) errors =[];
                errors.push({'param':'shelf_talker','msg':res.__("admin.products.please_select_pdf_file")});
            }

            
            /** Pairing foods images validation **/
            let productFoodImages = []
            if(pairingFoods && req.files && !req.files['pairing_foods_images_0']){
                if(!errors) errors =[];
                errors.push({'param':'pairing_foods_images','msg':res.__("admin.products.please_select_image")});
            }else if(pairingFoods && req.files && req.files['pairing_foods_images_0']){
                for(var i=0; i<3; i++){
                    productFoodImages.push({'pairing_foods_images' : (req.files['pairing_foods_images_'+i]) ? req.files['pairing_foods_images_'+i] : ''})
                }
            }


            if(errors && errors.length != 0){
                /** Send error response **/
                return res.send({
                    status  : STATUS_ERROR,
                    message : errors,
                });
            }
            
            let sizeWithImage = [];
            let insertedData = {
                product_name        :   productName,
                category            :   ObjectId(category),
                sake_meter          :   sakeMeter,
                flavor              :   flavor,
                alcohol_level       :   alcoholLevel,
                acidity_level       :   acidityLevel,
                polish_rate         :   polishRate,
                sweetness           :   ObjectId(sweetness),
                body                :   ObjectId(body),
                default_size        :   ObjectId(defaultProductImage),
                characteristics     :   productCharacteristics,
                pairing_foods       :   pairingFoods,
                product_origin      :   productOrigin,
                description         :   description,
                serving_temperature :   servingTemperature,
                is_active           :   ACTIVE,
                is_popular          :   NOT_POPULAR,
                is_deleted          :   NOT_DELETED,
                created             :   getUtcDate()
            }
            if(size && size.length > 0){ 
                let removeImages = [];
                let isDefaultImage = false;
                asyncForEachOf(size, (row, index, callback) => {
                    if(row != null && Object.keys(row).length > NOT){
                        if(defaultProductImage == row.size) isDefaultImage = true;
                        let image           =   (req.files && req.files['product_images_'+index])  ?   req.files['product_images_'+index] :"";
                        let imgaeOptions    =   {
                            'image'     :   image,
                            'filePath'  :   PRODUCTS_FILE_PATH
                        };
                        /** Upload product image **/
                        moveUploadedFile(req, res, imgaeOptions, callback).then(imgaeResponse=>{
                            let fileName = (imgaeResponse.fileName) ? imgaeResponse.fileName : '';
                            if(!insertedData['default_image']) insertedData['default_image'] = (row.size == defaultProductImage) ?  fileName : '';
                            sizeWithImage[index] = {size : (row.size) ? ObjectId(row.size) : ObjectId(), image : fileName};
                            removeImages.push(PRODUCTS_FILE_PATH+fileName)
                            insertedData['product_images'] = sizeWithImage;
                            if(imgaeResponse.status == STATUS_ERROR){ 
                                return res.send({
                                    status  : STATUS_ERROR,
                                    message : [{'param':'product_image_'+index,'msg':imgaeResponse.message}],
                                });
                            }
                            callback();
                        })
                    }else{
                        sizeWithImage[index] = {size : ObjectId(), image : ''};
                        insertedData['product_images'] = sizeWithImage;
                        callback();
                    }
                }, err => {
                    if(err) return next();
                    let productSheet    =   (req.files && req.files['product_sheet'])  ?   req.files['product_sheet']:"";
                    let imgaeOptionsProductSheet    =   {
                        'image'     :   productSheet,
                        'filePath'  :   PRODUCTS_FILE_PATH,
                        allowedExtensions   :   ALLOWED_FILE_EXTENSIONS,
                        allowedImageError   :   ALLOWED_FILE_ERROR_MESSAGE,
                        allowedMimeTypes    :   ALLOWED_FILE_MIME_EXTENSIONS,
                        allowedMimeError    :   ALLOWED_FILE_MIME_ERROR_MESSAGE
                    };
                    /** Upload product image **/
                    moveUploadedFile(req, res, imgaeOptionsProductSheet).then(imgaeResponseProductSheet=>{
                        let fileNameProductSheet = (imgaeResponseProductSheet.fileName) ? imgaeResponseProductSheet.fileName : '';
                        insertedData['product_sheet'] = fileNameProductSheet;
                        if(imgaeResponseProductSheet.status == STATUS_ERROR){ 
                            return res.send({
                                status  : STATUS_ERROR,
                                message : [{'param':'product_sheet','msg':imgaeResponseProductSheet.message}],
                            });
                        }

                        let shelfTalker    =   (req.files && req.files['shelf_talker'])  ?   req.files['shelf_talker']:"";
                        let imgaeOptionsShelfTalker    =   {
                            'image'     :   shelfTalker,
                            'filePath'  :   PRODUCTS_FILE_PATH,
                            allowedExtensions   :   ALLOWED_FILE_EXTENSIONS,
                            allowedImageError   :   ALLOWED_FILE_ERROR_MESSAGE,
                            allowedMimeTypes    :   ALLOWED_FILE_MIME_EXTENSIONS,
                            allowedMimeError    :   ALLOWED_FILE_MIME_ERROR_MESSAGE
                        };
                        /** Upload product image **/
                        moveUploadedFile(req, res, imgaeOptionsShelfTalker).then(imgaeResponseShelfTalker=>{
                            let fileNameShelfTalker = (imgaeResponseShelfTalker.fileName) ? imgaeResponseShelfTalker.fileName : '';
                            insertedData['shelf_talker'] = fileNameShelfTalker;
                            if(imgaeResponseShelfTalker.status == STATUS_ERROR){ 
                                return res.send({
                                    status  : STATUS_ERROR,
                                    message : [{'param':'shelf_talker','msg':imgaeResponseShelfTalker.message}],
                                });
                            }

                            /*** Upload product food images */
                            let pairingFoodsImages = []
                            asyncForEachOf(productFoodImages, (row, index, callback) => {
                                if(row != null && Object.keys(row).length > NOT){
                                    let image           =   (req.files && req.files['pairing_foods_images_'+index])  ?   req.files['pairing_foods_images_'+index] :"";
                                    let imgaeOptions    =   {
                                        'image'     :   image,
                                        'filePath'  :   PRODUCTS_FILE_PATH
                                    };
                                    /** Upload product image **/
                                    moveUploadedFile(req, res, imgaeOptions, callback).then(imgaeResponse=>{
                                        let fileName = (imgaeResponse.fileName) ? imgaeResponse.fileName : '';
                                        pairingFoodsImages.push({_id : ObjectId(), image : fileName});
                                        removeImages.push(PRODUCTS_FILE_PATH+fileName)
                                        insertedData['pairing_foods_images'] = pairingFoodsImages;
                                        if(imgaeResponse.status == STATUS_ERROR){ 
                                            return res.send({
                                                status  : STATUS_ERROR,
                                                message : [{'param':'pairing_foods_images','msg':imgaeResponse.message}],
                                            });
                                        }
                                        callback();
                                    })
                                }else{
                                    callback();
                                }
                            }, error => {
                                if(error) return next();

                                /** Set options for get user slug **/
                                let slugOptions = {
                                    title       : productName,
                                    table_name  : "products",
                                    slug_field  : "slug"
                                };

                                let authUserId = (req.session.user && req.session.user._id) ? req.session.user._id :'';

                                /** Get slug **/
                                getDatabaseSlug(slugOptions).then(slugResponse=>{
                                    insertedData['slug']        =  (slugResponse && slugResponse.title) ? slugResponse.title :"";
                                    insertedData['created_by']  =  ObjectId(authUserId);

                                    let collection = db.collection("products");
                                    /** Save product data **/
                                    collection.insertOne(insertedData,(err,result)=>{
                                        if(err) return next(err);

                                        /** Send success response **/
                                        req.flash(STATUS_SUCCESS,res.__("admin.products.product_has_been_added_successfully"));
                                        res.send({
                                            status      : STATUS_SUCCESS,
                                            redirect_url: WEBSITE_ADMIN_URL+"products",
                                            message     : res.__("admin.products.product_has_been_added_successfully"),
                                        });
                                    });
                                }).catch(next);
                            })
                        })
                    })
                });
            }
        }else{
            /** Set options **/
			let options ={type : ['category', 'body', 'characteristics', 'size', 'sweetness', 'food_pairing', 'temperature_category', 'serving_temperature']};
			/** Get faq master list **/
			getMasterList(req,res,next,options).then(response=>{
				if(response.status !== STATUS_SUCCESS) return res.send({status : STATUS_ERROR, message : res.__("system.something_going_wrong_please_try_again")});
				
				/** Send  susscess response */
                let bodies          = (response.result && response.result['body'])            ? response.result['body'] :[];
                let sizes           = (response.result && response.result['size'])            ? response.result['size'] :[];
                let sweetness       = (response.result && response.result['sweetness'])       ? response.result['sweetness'] :[];
                let categories      = (response.result && response.result['category'])        ? response.result['category'] :[];
                let foodPairing     = (response.result && response.result['food_pairing'])    ? response.result['food_pairing'] :[];
                let characteristics = (response.result && response.result['characteristics']) ? response.result['characteristics'] :[];
                let servingTemperature = (response.result && response.result['serving_temperature']) ? response.result['serving_temperature'] :[];
                let servingTemperatureCategory = (response.result && response.result['temperature_category']) ? response.result['temperature_category'] :[];

                /** Render add page **/
                req.breadcrumbs(BREADCRUMBS["admin/products/add"]);
				res.render('add',{
					sizes	        : sizes,
                    bodies	        : bodies,
                    sweetness       : sweetness,
                    categories	    : categories,
                    food_pairing    : foodPairing,
                    characteristics	: characteristics,
                    serving_temperature	: servingTemperature,
                    serving_temperature_category : servingTemperatureCategory,
				});

			}).catch(next); 
        }
    };//End addProduct()

    /**
     * Function for get product's Detail
     *
     * @param req   As Request Data
     * @param res   As Response Data
     *
     * @return json
     */
    let getProductDetails = (req,res,next)=>{
        return new Promise(resolve=>{
            let productId      = (req.params.id)   ?   req.params.id   :"";
            let condition   = {
                _id             : ObjectId(productId),
                is_deleted      : NOT_DELETED,
            };

            const collection = db.collection("products");
            collection.findOne(condition,(err, result)=>{
                if(err) return next(err);

                if(!result){
                    /** Send error response **/
                    let response = {
                        status  : STATUS_ERROR,
                        message : res.__("admin.system.invalid_access")
                    };
                    return resolve(response);
                }

                resolve({
                    status  : STATUS_SUCCESS,
                    result  : result
                });
            });
        });
    };//End getProductDetails()

    /**
     * Function for update product's Detail
     *
     * @param req   As  Request Data
     * @param res   As  Response Data
     * @param next  As  Callback argument to the middleware function
     *
     * @return render/json
     */
    this.editProduct  = (req,res,next)=>{
        if(isPost(req)){

            /** Sanitize Data **/
            req.body        =   sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);

            /** Check validation **/
            req.checkBody({
                "product_name": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_name")
                },
                "category": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_select_category"),
                },
                "sake_meter": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_sake_meter"),
                },
                "flavor": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_flavor")
                },
                "alcohol_level": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_alcohol_level")
                },
                "acidity_level": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_acidity_level")
                },
                "polish_rate": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_polish_rate")
                },
                "sweetness": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_select_sweetness")
                },
                "body": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_select_body")
                },
                "characteristics": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_select_characteristics")
                },
                "pairing_foods": {
                    notEmpty: true,
                    isLength:{
                        options: 2,
                        errorMessage: res.__("admin.products.pairing_foods_length_should_be_minimum_character",2)
                    },
                    errorMessage: res.__("admin.products.please_enter_pairing_foods")
                },
                "product_origin": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_product_origin")
                },
                "description": {
                    notEmpty: true,
                    isLength:{
                        options: 10,
                        errorMessage: res.__("admin.products.description_length_should_be_minimum_character",10)
                    },
                    errorMessage: res.__("admin.products.please_enter_description")
                },
            });

            let productName         = (req.body.product_name)   ? req.body.product_name : '';
            let category            = (req.body.category)       ? req.body.category : '';
            let sakeMeter           = (req.body.sake_meter)     ? req.body.sake_meter : '';
            let flavor              = (req.body.flavor)         ? req.body.flavor : '';
            let alcoholLevel        = (req.body.alcohol_level)  ? req.body.alcohol_level : '';
            let acidityLevel        = (req.body.acidity_level)  ? req.body.acidity_level : '';
            let polishRate          = (req.body.polish_rate)    ? req.body.polish_rate : '';
            let sweetness           = (req.body.sweetness)      ? req.body.sweetness : '';
            let body                = (req.body.body)           ? req.body.body : '';
            let characteristics     = (req.body.characteristics)? JSON.parse(req.body.characteristics) : [];
            let pairingFoods        = (req.body.pairing_foods)  ? req.body.pairing_foods : '';
            let size                = (req.body.size)           ? JSON.parse(req.body.size) : [];
            let defaultProductImage = (req.body.default_product_image)? req.body.default_product_image : '';
            let servingTemperature  = (req.body.serving_temperature)  ? JSON.parse(req.body.serving_temperature) : [];
            let productOrigin       = (req.body.product_origin)       ? req.body.product_origin : '';
            let oldProductSheet     = (req.body.old_product_sheet)    ? req.body.old_product_sheet : '';
            let oldShelfTalker      = (req.body.old_shelf_talker)     ? req.body.old_shelf_talker : '';
            let description         = (req.body.description)          ? req.body.description : '';

            
            /** parse Validation array  **/
            let errors = parseValidation(req.validationErrors(),req);

            /** Serving temperature validation **/
            let productServingTemperature = [];
            if(servingTemperature && servingTemperature.length > 0){
                if(!errors) errors =[];
                servingTemperature.map((records, index)=>{
                    if(records.category_id) productServingTemperature[index] = records['category_id'] = ObjectId(records.category_id)
                    if(records.temperature_id) productServingTemperature[index] = records['temperature_id'] = ObjectId(records.temperature_id)
                    else productServingTemperature.push(records['temperature_id'] = ObjectId(FRONT_USER_ROLE_ID))
                    if(records.rating) productServingTemperature.push(records['rating'] = records.rating)
                    if(!records.category_id && records.rating) errors.push({'param':'serving_temperature_category_'+index,'msg':res.__("admin.products.please_select_category")});
                    if(records.category_id && !records.rating) errors.push({'param':'serving_temperature_rating_'+index,'msg':res.__("admin.products.please_select_rating")});
                }) 
            }

            /** Set characteristics as ObjectID **/
            let productCharacteristics = [];
            if(characteristics && characteristics.length > NOT){
                if(!errors) errors =[];
                characteristics.map((records, index)=>{
                    productCharacteristics.push(ObjectId(records))
                }) 
            }

            /** Product size with image validation **/
            if(size && size.length > 0){
                if(!errors) errors = [];
                size.map((records, index)=>{
                    let oldProductImage = (req.body['old_product_images_'+index]) ? req.body['old_product_images_'+index] : '';
                    if(records && !records.size) errors.push({'param':'size'+index,'msg':res.__("admin.products.please_select_size")});
                    if(records && records.size && !oldProductImage && (!req.files || !req.files['product_images_'+index])){
                        if(!errors) errors =[];
                        errors.push({'param':'product_images_'+index,'msg':res.__("admin.products.please_select_image")});
                    }
                }) 
            }else{
                if(!errors) errors = [];
                errors.push({'param':'size','msg':res.__("admin.products.please_select_at_least_one_size")});
            }

            /** Product image validation **/
            if(size && size.length > 0 && !defaultProductImage){
                if(!errors) errors = [];
                errors.push({'param':'size','msg':res.__("admin.products.please_make_a_product_size_and_image_as_default")});
            }

            /** Product sheet images validation **/
            if(!oldProductSheet && req.files && !req.files['product_sheet']){
                if(!errors) errors =[];
                errors.push({'param':'product_sheet','msg':res.__("admin.products.please_select_pdf_file")});
            }

            /** Shelf talker images validation **/
            if(!oldShelfTalker && req.files && !req.files['shelf_talker']){
                if(!errors) errors =[];
                errors.push({'param':'shelf_talker','msg':res.__("admin.products.please_select_pdf_file")});
            }

            /** Set product food images **/
            let productFoodImages = []
            if(pairingFoods && req.files && req.files['pairing_foods_images_0']){
                for(var i=0; i<3; i++){
                    productFoodImages.push({'pairing_foods_images' : (req.files['pairing_foods_images_'+i]) ? req.files['pairing_foods_images_'+i] : ''})
                }
            }

            if(errors && errors.length != 0){
                /** Send error response **/
                return res.send({
                    status  : STATUS_ERROR,
                    message : errors,
                });
            }

            let authUserId = (req.session.user && req.session.user._id) ? req.session.user._id :'';
            let sizeWithImage = [];
            let removeImages  = [];
            let updatedData = {
                product_name        :   productName,
                category            :   ObjectId(category),
                sake_meter          :   sakeMeter,
                flavor              :   flavor,
                alcohol_level       :   alcoholLevel,
                acidity_level       :   acidityLevel,
                polish_rate         :   polishRate,
                sweetness           :   ObjectId(sweetness),
                body                :   ObjectId(body),
                default_size        :   ObjectId(defaultProductImage),
                characteristics     :   productCharacteristics,
                pairing_foods       :   pairingFoods,
                description         :   description,
                updated_by          :   ObjectId(authUserId),
                serving_temperature :   servingTemperature,
                product_origin      :   productOrigin,
                is_active           :   ACTIVE,
                is_deleted          :   NOT_DELETED,
                modified            :   getUtcDate(),
            }
            if(size && size.length > 0){
                let isDefaultImage = false;
                asyncForEachOf(size, (row, index, callback) => {
                    if(row != null && Object.keys(row).length > NOT){
                        if(defaultProductImage == row.size) isDefaultImage = true;
                        let oldProductImage =   (req.body['old_product_images_'+index]) ? (req.body['old_product_images_'+index]) : ''
                        let image           =   (req.files && req.files['product_images_'+index])  ?   req.files['product_images_'+index] :"";
                        let imgaeOptions    =   {
                            'image'             :   image,
                            'filePath'          :   PRODUCTS_FILE_PATH

                        };
                        /** Upload product image **/
                        moveUploadedFile(req, res, imgaeOptions, callback).then(imgaeResponse=>{
                            let fileName = (imgaeResponse.fileName) ? imgaeResponse.fileName : '';
                            sizeWithImage[index] = {size : ObjectId(row.size), image : (!image) ? oldProductImage : fileName};
                            updatedData['product_images'] = sizeWithImage;
                            if(imgaeResponse.status == STATUS_ERROR){
                                /** Send error response **/
                                return res.send({
                                    status  : STATUS_ERROR,
                                    message : [{'param':'product_image_'+index,'msg':imgaeResponse.message}],
                                });
                            }
                            callback();
                        })
                    }else{
                        sizeWithImage[index] = {size : ObjectId(), image : ''};
                        updatedData['product_images'] = sizeWithImage;
                        callback();
                    }
                }, err => {
                    if(err) return next();

                    let productSheet    =   (req.files && req.files['product_sheet'])  ?   req.files['product_sheet']:"";
                    let imgaeOptionsProductSheet    =   {
                        'image'             :   productSheet,
                        'filePath'          :   PRODUCTS_FILE_PATH,
                        allowedExtensions   :   ALLOWED_FILE_EXTENSIONS,
                        allowedImageError   :   ALLOWED_FILE_ERROR_MESSAGE,
                        allowedMimeTypes    :   ALLOWED_FILE_MIME_EXTENSIONS,
                        allowedMimeError    :   ALLOWED_FILE_MIME_ERROR_MESSAGE
                    };

                    /** Upload product sheet **/
                    moveUploadedFile(req, res, imgaeOptionsProductSheet).then(imgaeResponseProductSheet=>{
                        let fileNameProductSheet = (imgaeResponseProductSheet.fileName) ? imgaeResponseProductSheet.fileName : '';
                        if(productSheet)  updatedData['product_sheet'] = fileNameProductSheet;
                        if(imgaeResponseProductSheet.status == STATUS_ERROR){ 
                            return res.send({
                                status  : STATUS_ERROR,
                                message : [{'param':'product_sheet','msg':imgaeResponseProductSheet.message}],
                            });
                        }

                        let shelfTalker    =   (req.files && req.files['shelf_talker'])  ?   req.files['shelf_talker']:"";
                        let imgaeOptionsShelfTalker    =   {
                            'image'             :   shelfTalker,
                            'filePath'          :   PRODUCTS_FILE_PATH,
                            allowedExtensions   :   ALLOWED_FILE_EXTENSIONS,
                            allowedImageError   :   ALLOWED_FILE_ERROR_MESSAGE,
                            allowedMimeTypes    :   ALLOWED_FILE_MIME_EXTENSIONS,
                            allowedMimeError    :   ALLOWED_FILE_MIME_ERROR_MESSAGE
                        };

                        /** Upload product shelf talker **/
                        moveUploadedFile(req, res, imgaeOptionsShelfTalker).then(imgaeResponseShelfTalker=>{
                            let fileNameShelfTalker = (imgaeResponseShelfTalker.fileName) ? imgaeResponseShelfTalker.fileName : '';
                            if(shelfTalker) updatedData['shelf_talker'] = fileNameShelfTalker;
                            if(imgaeResponseShelfTalker.status == STATUS_ERROR){ 
                                return res.send({
                                    status  : STATUS_ERROR,
                                    message : [{'param':'shelf_talker','msg':imgaeResponseShelfTalker.message}],
                                });
                            }

                             /*** Upload product food images */
                             let pairingFoodsImages = []
                             asyncForEachOf(productFoodImages, (row, index, callback) => {
                                 if(row != null && Object.keys(row).length > NOT){
                                    let image           =   (req.files && req.files['pairing_foods_images_'+index])  ?   req.files['pairing_foods_images_'+index] :"";
                                    let imgaeOptions    =   {
                                        'image'     :   image,
                                        'filePath'  :   PRODUCTS_FILE_PATH
                                    };
                                    /** Upload product image **/
                                    moveUploadedFile(req, res, imgaeOptions, callback).then(imgaeResponse=>{
                                        let fileName = (imgaeResponse.fileName) ? imgaeResponse.fileName : '';
                                        pairingFoodsImages.push({_id : ObjectId(), image : fileName});
                                        removeImages.push(PRODUCTS_FILE_PATH+fileName)
                                        updatedData['pairing_foods_images'] = pairingFoodsImages;
                                        if(imgaeResponse.status == STATUS_ERROR){ 
                                            return res.send({
                                                status  : STATUS_ERROR,
                                                message : [{'param':'pairing_foods_images','msg':imgaeResponse.message}],
                                            });
                                        }
                                        callback();
                                    })
                                 }else{
                                     callback();
                                 }
                             }, error => {
                                 if(error) return next();


                                /** Save product data **/
                                let productId  = (req.params.id)   ?   req.params.id   :"";
                                let collection = db.collection("products");
                                collection.updateOne({_id : ObjectId(productId)},{$set:updatedData},(err,result)=>{
                                    if(err) return next(err);

                                    /** Send success response **/
                                    req.flash(STATUS_SUCCESS,res.__("admin.products.product_has_been_updated_successfully"));
                                    res.send({
                                        status      : STATUS_SUCCESS,
                                        redirect_url: WEBSITE_ADMIN_URL+"products",
                                        message     : res.__("admin.products.product_has_been_updated_successfully"),
                                    });
                                });
                            })
                        }).catch(next);
                    }).catch(next);
                });
            }

        }else{

            /** Get product details **/
            getProductDetails(req, res,next).then(response=>{
                if(response.status != STATUS_SUCCESS){
                    /** Send error response **/
                    req.flash(STATUS_ERROR,response.message);
                    return res.redirect(WEBSITE_ADMIN_URL+"products/");
                }
                let result =  (response.result) ? response.result :{};

                /** Set options **/
                let options ={type : ['category', 'body', 'characteristics', 'size', 'sweetness', 'food_pairing', 'temperature_category', 'serving_temperature']};
                /** Get faq master list **/
                getMasterList(req,res,next,options).then(response=>{
                    if(response.status !== STATUS_SUCCESS) return res.send({status : STATUS_ERROR, message : res.__("system.something_going_wrong_please_try_again")});
                    
                    /** Send  susscess response */
                    let bodies          = (response.result && response.result['body'])            ? response.result['body'] :[];
                    let sizes           = (response.result && response.result['size'])            ? response.result['size'] :[];
                    let sweetness       = (response.result && response.result['sweetness'])       ? response.result['sweetness'] :[];
                    let categories      = (response.result && response.result['category'])        ? response.result['category'] :[];
                    let foodPairing     = (response.result && response.result['food_pairing'])    ? response.result['food_pairing'] :[];
                    let characteristics = (response.result && response.result['characteristics']) ? response.result['characteristics'] :[];
                    let servingTemperature = (response.result && response.result['serving_temperature']) ? response.result['serving_temperature'] :[];
                    let servingTemperatureCategory = (response.result && response.result['temperature_category']) ? response.result['temperature_category'] :[];

                    /*** Set Characteristics  as string in array */
                    let selectedCharacteristics = (result.characteristics) ? result.characteristics :[]
                    let selCharacteristics = [];
                    asyncForEachOf(selectedCharacteristics, (row, index, callback) => {
                        selCharacteristics.push(String(selectedCharacteristics[index]))
                        callback();
                    }, err => {
                        if(err) return next();

                        result['characteristics'] = selCharacteristics
                        
                        /** Render edit page **/
                        req.breadcrumbs(BREADCRUMBS["admin/products/edit"]);
                        res.render('edit',{
                            sizes	        : sizes,
                            result          : result,
                            bodies	        : bodies,
                            sweetness       : sweetness,
                            categories	    : categories,
                            food_pairing    : foodPairing,
                            characteristics	: characteristics,
                            serving_temperature	: servingTemperature,
                            serving_temperature_category : servingTemperatureCategory,
                        });
                    });  
                }).catch(next);
            }).catch(next);
        }
    };//End editUser()

    /**
     * Function for view user's Detail
     *
     * @param req   As  Request Data
     * @param res   As  Response Data
     * @param next  As  Callback argument to the middleware function
     *
     * @return render
     */
    this.viewProductDetails = (req,res,next)=>{
        let productId      = (req.params.id)  ? req.params.id  : "";

        /*** Set conditions */
        let conditions =  {
            _id  : ObjectId(productId),
        };

        /** Get Product details **/
        const collection = db.collection("products");
        collection.aggregate([
            {$match : conditions},
            {$lookup:{
                from: "masters",
                let: { categoryId: "$category" },
                pipeline: [
                  {$match: {
                    $expr: {
                      $and: [
                        { $eq: ["$_id", "$$categoryId"] },
                      ],
                    },
                  }},
                ],
                as: "categoryDetail",
            }},
            {$lookup:{
                from: "masters",
                let: { sweetnessId: "$sweetness" },
                pipeline: [
                  {$match: {
                    $expr: {
                      $and: [
                        { $eq: ["$_id", "$$sweetnessId"] },
                      ],
                    },
                  }},
                ],
                as: "sweetnessDetail",
            }},
            {$lookup:{
                from: "masters",
                let: { bodyId: "$body" },
                pipeline: [
                  {$match: {
                    $expr: {
                      $and: [
                        { $eq: ["$_id", "$$bodyId"] },
                      ],
                    },
                  }},
                ],
                as: "bodyDetail",
            }},
            {$lookup:{
                from: "masters",
                let: { characteristicsId: "$characteristics" },
                pipeline: [
                  {$match: {
                    $expr: {
                      $and: [
                        { $in: ["$_id", "$$characteristicsId"] },
                      ],
                    },
                  }},
                  {$group:{
                    _id : null,
                    "data": { "$push": "$name"},
                  }}
                ],
                as: "characteristicsDetail",
            }},
            
            {$project:{
                product_name  : 1, product_images : 1,category : 1,body:1, slug:1,product_origin:1,
                sweetness:1,serving_temperature:1,polish_rate :1,acidity_level:1, product_sheet:1,
                alcohol_level:1,flavor:1,sake_meter:1, pairing_foods:1, description:1,shelf_talker:1,
                is_active : 1, modified :1, created: 1,is_popular:1,pairing_foods_images:1,polish_rate:1,
                category_name : {'$arrayElemAt' : ['$categoryDetail.name',0]},
                body_name : {'$arrayElemAt' : ['$bodyDetail.name',0]},
                sweetness_name : {'$arrayElemAt' : ['$sweetnessDetail.name',0]},
                characteristics : '$characteristicsDetail.data',
            }},
            {$unwind : "$serving_temperature"},
            {$lookup:{
                from: "masters",
                let: { categoryId: "$serving_temperature.category_id" },
                pipeline: [
                  {$match: {
                    $expr: {
                      $and: [
                        { $eq: ["$_id", "$$categoryId"] },
                      ],
                    },
                  }},
                ],
                as: "servingTemperatureCategoryDetail",
            }},
            {$lookup:{
                from: "masters",
                let: { temperatureId: "$serving_temperature.temperature_id" },
                pipeline: [
                  {$match: {
                    $expr: {
                      $and: [
                        { $eq: ["$_id", "$$temperatureId"] },
                      ],
                    },
                  }},
                ],
                as: "servingTemperatureTemperatureDetail",
            }},
            {$group:{
                _id : "$_id",
                product_name : { $first: '$product_name'},
                product_images : { $first: '$product_images'},
                category : { $first: '$category'},
                slug : { $first: '$slug'},
                is_popular : { $first: '$is_popular'},
                serving_temperature : { $push: { 
                    temp_name : {'$arrayElemAt':['$servingTemperatureTemperatureDetail.name',0]},
                    category_name : {'$arrayElemAt':['$servingTemperatureCategoryDetail.name',0]},
                    rating : '$serving_temperature.rating',
                }},
                alcohol_level : { $first: '$alcohol_level'},
                polish_rate : { $first: '$polish_rate'},
                acidity_level : { $first: '$acidity_level'},
                flavor : { $first: '$flavor'},
                sake_meter : { $first: '$sake_meter'},
                pairing_foods : { $first: '$pairing_foods'},
                product_origin : { $first: '$product_origin'},
                product_sheet : { $first: '$product_sheet'},
                shelf_talker : { $first: '$shelf_talker'},
                pairing_foods_images : { $first: '$pairing_foods_images'},
                description : { $first: '$description'}, 
                is_active : { $first: '$is_active'}, 
                modified : { $first: '$modified'}, 
                created : { $first: '$created'}, 
                category_name : { $first: '$category_name'}, 
                body_name : { $first: '$body_name'}, 
                sweetness_name : { $first: '$sweetness_name'}, 
                characteristics : { $first: '$characteristics'}, 
            }}
        ]).toArray((err, results)=>{
            if(err) return next(err);
            let result = (results && results.length > 0 && results[0]) ? results[0] : null;
            if(!result){
                /** Send error response **/
                req.flash(STATUS_ERROR,res.__("admin.system.invalid_access"));
                res.redirect(WEBSITE_ADMIN_URL+"products/");
                return;
            }

            if(result && result.is_deleted == DELETED){
                /** Send error response **/
                req.flash(STATUS_ERROR,res.__("admin.product.this_product_is_deleted_from_the_system"));
                res.redirect(WEBSITE_ADMIN_URL+"products/");
                return;
            }

            /** Set options for append image full path **/
            let options = {
                "file_url"          :   PRODUCTS_URL,
                "file_path"         :   PRODUCTS_FILE_PATH,
                "result"            :   result.product_images,
                "database_field"    :   "image"
            };
            
            /** Append image with full path **/
            appendFileExistData(options).then(fileResponse=>{
                let productImages = (fileResponse && fileResponse.result && fileResponse.result)   ?   fileResponse.result :[]
                result['product_images'] = productImages

                /** Render view page*/
                req.breadcrumbs(BREADCRUMBS["admin/products/view"]);
                res.render("view",{
                    result  : result,
                });
            });
        });
    };//End viewProductDetails()

    /**
     * Function for update product's status
     *
     * @param req   As Request Data
     * @param res   As Response Data
     * @param next  As  Callback argument to the middleware function
     *
     * @return null
     */
    this.updateProductStatus = (req,res,next)=>{
        let productId   = (req.params.id)           ? req.params.id         : "";
        let userStatus  = (req.params.status)       ? req.params.status     : "";
        let statusType  = (req.params.status_type)  ? req.params.status_type: "";

        /** Set update data **/
        let updateData = {modified  : getUtcDate()};
        if(statusType == ACTIVE_INACTIVE_STATUS) updateData.is_active = (userStatus==ACTIVE) ? DEACTIVE :ACTIVE;

        /** Update products status*/
        const collection = db.collection("products");
        collection.updateOne({_id : ObjectId(productId)},{$set :updateData},(err,result)=>{
            if(err) return next(err);

            /** Send success response **/
            req.flash(STATUS_SUCCESS,res.__("admin.products.product_status_has_been_updated_successfully"));
            res.redirect(WEBSITE_ADMIN_URL+"products/");
        });
    };//End updateProductStatus()

        /**
     * Function for update product's status(Popular)
     *
     * @param req   As Request Data
     * @param res   As Response Data
     * @param next  As  Callback argument to the middleware function
     *
     * @return null
     */
    this.popularProductStatus = (req,res,next)=>{
        let productId   = (req.params.id)           ? req.params.id         : "";
        let userStatus  = (req.params.status)       ? req.params.status     : "";
        let statusType  = (req.params.status_type)  ? req.params.status_type: "";

        /** Set update data **/
        let updateData = {modified  : getUtcDate()};
        if(statusType == ACTIVE_INACTIVE_STATUS) updateData.is_popular = (userStatus==ACTIVE) ? DEACTIVE :ACTIVE;

        /** Update products status*/
        const collection = db.collection("products");
        collection.updateOne({_id : ObjectId(productId)},{$set :updateData},(err,result)=>{
            if(err) return next(err);

            /** Send success response **/
            req.flash(STATUS_SUCCESS,res.__("admin.products.product_status_has_been_updated_successfully"));
            res.redirect(WEBSITE_ADMIN_URL+"products/");
        });
    };//End updateProductStatus()

    /**
     * Function for update product's status(sale on)
     *
     * @param req   As Request Data
     * @param res   As Response Data
     * @param next  As  Callback argument to the middleware function
     *
     * @return null
     */
    this.isSaleOnProductStatus = (req,res,next)=>{
        let productId   = (req.params.id)           ? req.params.id         : "";
        let userStatus  = (req.params.status)       ? req.params.status     : "";
        let statusType  = (req.params.status_type)  ? req.params.status_type: "";

        /** Set update data **/
        let updateData = {modified  : getUtcDate()};
        if(statusType == ACTIVE_INACTIVE_STATUS) updateData.is_sale_on = (userStatus==ACTIVE) ? DEACTIVE :ACTIVE;

        /** Update products status*/
        const collection = db.collection("products");
        collection.updateOne({_id : ObjectId(productId)},{$set :updateData},(err,result)=>{
            if(err) return next(err);

            /** Send success response **/
            req.flash(STATUS_SUCCESS,res.__("admin.products.product_status_has_been_updated_successfully"));
            res.redirect(WEBSITE_ADMIN_URL+"products/");
        });
    };//End isSaleOnProductStatus()

    /**
     * Function for delete product
     *
     * @param req   As Request Data
     * @param res   As Response Data
     * @param next  As  Callback argument to the middleware function
     *
     * @return null
     */
    this.deleteProduct = (req,res,next)=>{
        /** Delete user*/
        let productId       =   (req.params.id) ? req.params.id : "";
        const collection    =   db.collection("products");
        collection.updateOne(
            {_id : ObjectId(productId)},
            {$set : {
                is_deleted  : DELETED,
                deleted_at  : getUtcDate(),
                modified    : getUtcDate()
            }},(err,result)=>{
                if(err) return next(err);

                /** Send success response **/
                req.flash(STATUS_SUCCESS,res.__("admin.products.product_has_been_deleted_successfully"));
                res.redirect(WEBSITE_ADMIN_URL+"products");
            }
        );
    };//End deleteProduct()
}
module.exports = new Product();

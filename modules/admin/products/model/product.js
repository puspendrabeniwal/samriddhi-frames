const asyncParallel = require("async/parallel");
const asyncForEachOf = require("async/forEachOf");
const { ObjectId } = require('mongodb');


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
                            {$project: {
                                _id:1,product_name:1,price:1, discount_price:1,created:1,is_active:1,
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
                "price": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_price"),
                },
                "discount_price": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_discount_price"),
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

            let productName      = (req.body.product_name)      ? req.body.product_name : '';
            let price            = (req.body.price)             ? Number(req.body.price) : 0;
            let discountPrice   = (req.body.discount_price)    ? Number(req.body.discount_price) : 0;
            let description      = (req.body.description)       ? req.body.description : '';

            
            /** parse Validation array  **/
            let errors = parseValidation(req.validationErrors(),req);

            if(discountPrice > 100){
                if(!errors) errors =[];
                errors.push({'param':'discount_price','msg':res.__("admin.products.discount_price_should_not_be_gretaer_than_100")});
            }

            if(discountPrice > price){
                if(!errors) errors =[];
                errors.push({'param':'discount_price','msg':res.__("admin.products.discount_price_should_not_be_gretaer_than_price")});
            }

            /** Product sheet images validation **/
            if(req.files && !req.files['images']){
                if(!errors) errors =[];
                errors.push({'param':'images','msg':res.__("admin.products.please_select_product_image")});
            }

            if(errors && errors.length != 0){
                /** Send error response **/
                return res.send({
                    status  : STATUS_ERROR,
                    message : errors,
                });
            }
            
            let discountPercentage = (price*discountPrice)/100;
            let insertedData = {
                product_name        :   productName,
                price               :   Number(price),
                discount_price      :   Number(price-discountPercentage),
                discount_percentage :   Number(discountPrice),
                description         :   description,
                is_active           :   ACTIVE,
                is_deleted          :   NOT_DELETED,
                created             :   getUtcDate()
            }

            let image           =   (req.files && req.files['images'])  ?   req.files['images'] :"";
            let imgaeOptions    =   {
                'image'     :   image,
                'filePath'  :   PRODUCTS_FILE_PATH
            };

            /** Upload product image **/
            moveUploadedFile(req, res, imgaeOptions).then(response=>{
                let productImage = (response.fileName) ? response.fileName : '';
                insertedData['image'] = productImage;
                if(response.status == STATUS_ERROR){ 
                    return res.send({
                        status  : STATUS_ERROR,
                        message : [{'param':'image','msg':response.message}],
                    });
                }

                    
                /** Set options for get user slug **/
                let slugOptions = {
                    title       : productName,
                    table_name  : "products",
                    slug_field  : "slug"
                };

                /** Get slug **/
                getDatabaseSlug(slugOptions).then(slugResponse=>{
                    insertedData['slug']        =  (slugResponse && slugResponse.title) ? slugResponse.title :"";
   
                    /** Save product data **/
                    let collection = db.collection("products");
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
            }).catch(next);
        }else{
           
            /** Render add page **/
            req.breadcrumbs(BREADCRUMBS["admin/products/add"]);
            res.render('add');
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
                "price": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_price"),
                },
                "discount_price": {
                    notEmpty: true,
                    errorMessage: res.__("admin.products.please_enter_discount_price"),
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

            let productName      = (req.body.product_name)      ? req.body.product_name : '';
            let price            = (req.body.price)             ? Number(req.body.price) : '';
            let discountPrice    = (req.body.discount_price)    ? Number(req.body.discount_price) : '';
            let description      = (req.body.description)       ? req.body.description : '';

            let discountPercentage = (price*discountPrice)/100;
            let updatedData = {
                product_name : productName,
                price : price,
                discount_price : Number(price-discountPercentage),
                discount_percentage : discountPrice,
                description : description,
            }

            /** parse Validation array  **/
            let errors = parseValidation(req.validationErrors(),req);
            if(discountPrice > 100){
                if(!errors) errors =[];
                errors.push({'param':'discount_price','msg':res.__("admin.products.discount_price_should_not_be_gretaer_than_100")});
            }

            if(discountPrice > price){
                if(!errors) errors =[];
                errors.push({'param':'discount_price','msg':res.__("admin.products.discount_price_should_not_be_gretaer_than_price")});
            }

            if(errors && errors.length != 0){
                /** Send error response **/
                return res.send({
                    status  : STATUS_ERROR,
                    message : errors,
                });
            }

            /** Set options for upload image **/
            let oldimage=   (req.body.old_image) ? req.body.old_image :"";
            let image   =   (req.files && req.files.images)  ?   req.files.images :"";

            let options =   {
                'image'     :   image,
                'filePath'  :   PRODUCTS_FILE_PATH,
                'oldPath'   :   oldimage
            };

            /** Upload user  image **/
            moveUploadedFile(req, res,options).then(response=>{
                let productImage = (response.fileName) ? response.fileName : '';
                updatedData['image'] = productImage;
                if(response.status == STATUS_ERROR){                                            
                    /** Send error response **/
                    return res.send({
                        status  : STATUS_ERROR,
                        message : [{'param':'images','msg':response.message}],
                    });
                }

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
            }).catch(next) 

        }else{

            /** Get product details **/
            getProductDetails(req, res,next).then(response=>{
                if(response.status != STATUS_SUCCESS){
                    /** Send error response **/
                    req.flash(STATUS_ERROR,response.message);
                    return res.redirect(WEBSITE_ADMIN_URL+"products/");
                }
                let result =  (response.result) ? response.result :{};

                /** Render edit page **/
                req.breadcrumbs(BREADCRUMBS["admin/products/edit"]);
                res.render('edit',{
                    result          : result,           
                });
                    
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
            {$project:{
                product_name  : 1, price : 1, discount_percentage :1, discount_price : 1, description:1, slug:1, image:1,
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
                "result"            :   results,
                "database_field"    :   "image"
            };
            
            /** Append image with full path **/
            appendFileExistData(options).then(fileResponse=>{

                let productImages = (fileResponse && fileResponse.result && fileResponse.result)   ?   fileResponse.result :[]

                /** Render view page*/
                req.breadcrumbs(BREADCRUMBS["admin/products/view"]);
                res.render("view",{
                    result  : productImages[0],
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


function Products() {
    /**
     * Function for product listing
     *
     * @param req   As  Request Data
     * @param res   As  Response Data
     * @param next  As  Callback argument to the middleware function
     *
     * @return render/json
     */
    this.productList = (req, res)=>{
        let collection     = db.collection("products");
        collection.find({
            is_active : ACTIVE
        }).toArray((err,result)=>{

            if(!err){
                let options = {
                    
                    file_path : PRODUCTS_FILE_PATH,
                    file_url : PRODUCTS_URL,
                    result   : result,
                    database_field : "image"   
                }
                appendFileExistData(options).then(response=>{
                    return res.send({
                        "status"      : API_STATUS_SUCCESS,
                        "message"     : '',
                        "error"       : [],
                        "result"      : response.result
                    });
                })
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


        /**
     * Function for product detail
     *
     * @param req   As  Request Data
     * @param res   As  Response Data
     * @param next  As  Callback argument to the middleware function
     *
     * @return render/json
     */
    this.productDetail = (req, res)=>{
        let productId = (req.params.id) ? req.params.id : "";
        let collection     = db.collection("products");
        collection.findOne({
            _id : ObjectId(productId),
            is_active : ACTIVE
        },(err,result)=>{
            if(!err){
                let options = {
                    file_path : PRODUCTS_FILE_PATH,
                    file_url : PRODUCTS_URL,
                    result   : [result],
                    database_field : "image"   
                }
                appendFileExistData(options).then(response=>{
                    return res.send({
                        "status"      : API_STATUS_SUCCESS,
                        "message"     : '',
                        "error"       : [],
                        "result"      : (response.result) ? response.result[0] : {}
                    });
                })
            }else{
                return res.send({
                    "status"      : API_STATUS_ERROR,
                    "message"     : res.__("front.system.something_went_wrong"),
                    "error"       : [],
                    "result"      : {}
                });
            }
        })
    }      
}
module.exports = new Products();
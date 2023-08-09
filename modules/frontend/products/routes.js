/** Model file path for current plugin **/
const modelPath     =	__dirname+"/model/product";
const modulePath	= 	"/api/";
const frontProduct	    =   require(modelPath);

/** Routing is used to get products*/
app.all(modulePath+"products",(req, res)=>{
    frontProduct.productList(req, res);
});

/** Routing is used to get products detail*/
app.all(modulePath+"product/:id",(req, res)=>{
    frontProduct.productDetail(req, res);
});
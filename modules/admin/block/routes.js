/** Model file path for current plugin **/
const modelPath     = 	__dirname+"/model/block";
const modulePath	= 	"/"+ADMIN_NAME+"/block/";
const adminBlock      =   require(modelPath);

/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
    req.rendering.views	=	__dirname + "/views";
    next();
});

/** Routing is used to get list **/
app.all(modulePath,checkLoggedInAdmin,(req, res,next) => {
    adminBlock.getBlockList(req, res,next);
});

/** Routing is used to add **/
app.all(modulePath+"add",checkLoggedInAdmin,(req,res,next) => {
    adminBlock.addBlock(req,res,next);
});

/** Routing is used to edit  **/
app.all(modulePath+"edit/:id",checkLoggedInAdmin,(req,res,next) => {
    adminBlock.editBlock(req,res,next);
});

/** Routing is used to upload ckeditor file **/
app.all("/"+ADMIN_NAME+"/ckeditor_uploader",checkLoggedInAdmin,(req, res, next)=>{
    adminBlock.ckeditorUploader(req, res,next);
});
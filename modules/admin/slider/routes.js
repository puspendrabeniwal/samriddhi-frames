/** Model file path for current plugin **/
const modelPath     = 	__dirname+"/model/slider";
const modulePath	= 	"/"+ADMIN_NAME+"/slider/";
const adminSlider      =   require(modelPath);

/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
    req.rendering.views	=	__dirname + "/views";
    next();
});

/** Routing is used to get slider list **/
app.all(modulePath,checkLoggedInAdmin,(req, res,next) => {
    adminSlider.getSliderList(req, res,next);
});

/** Routing is used to add slider **/
app.all(modulePath+"add",checkLoggedInAdmin,(req,res,next) => {
    adminSlider.addSlider(req,res,next);
});

/** Routing is used to edit slider **/
app.all(modulePath+"edit/:id",checkLoggedInAdmin,(req,res,next) => {
    adminSlider.editSlider(req,res,next);
});

/** Routing is used to delete slider **/
app.all(modulePath+"delete/:id",checkLoggedInAdmin,(req,res,next) => {
	console.log("delete")
    adminSlider.deleteSlider(req,res,next);
});

/** Routing is used to update slider status **/
app.all(modulePath+"change_status/:id/:status",checkLoggedInAdmin,(req,res,next) => {
    adminSlider.updateSliderStatus(req,res,next);
});


/** Routing is used to update show home page status **/
app.all(modulePath+"change_home_page_status/:id/:display_on_home_page",checkLoggedInAdmin,(req,res,next) => {
    adminSlider.updateSliderHomePageShowStatus(req,res,next);
});

/** Routing is used to update show home page status **/
app.all(modulePath+"make_featured/:id",checkLoggedInAdmin,(req,res,next) => {
    adminSlider.makeFeatured(req,res,next);
});
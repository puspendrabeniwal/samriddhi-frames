/** Model file path for current plugin **/
const modelPath  		= 	__dirname+"/model/distributors";
const modulePath		= 	"/"+ADMIN_NAME+"/distributors/";
const adminDistributors =	require(modelPath);

/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
   	req.rendering.views	=	__dirname + "/views";
    next();
});


/** Routing is used to get distributor list **/
app.all(modulePath,checkLoggedInAdmin,(req, res) => {
	adminDistributors.getDistributorList(req, res);
});

/** Routing is used to add or edit distributor **/
app.all([modulePath+"add",modulePath+"edit/:id"],checkLoggedInAdmin,(req, res, next) => {
	adminDistributors.addEditDistributor(req, res, next);
});

/** Routing is used to delete distributor details **/
app.get(modulePath+"delete/:id",checkLoggedInAdmin,(req, res, next) => {
	adminDistributors.DistributorDelete(req, res, next);
});

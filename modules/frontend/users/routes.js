/** Model file path for current plugin **/
const modelPath     =	__dirname+"/model/user";
const modulePath	= 	"/api/";
const frontUser	    =   require(modelPath);

/** Routing is used to save contact enquiries*/
app.post(modulePath+"contact_us",(req, res)=>{
    frontUser.contactUs(req, res);
});

/** Routing is used to get cms*/
app.all(modulePath+"cms/:slug",(req, res)=>{
    frontUser.getCms(req, res);
});

/** Routing is used to get block*/
app.all(modulePath+"block/:page_name",(req, res)=>{
    frontUser.getBlock(req, res);
});


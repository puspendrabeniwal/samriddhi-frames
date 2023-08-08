/** Model file path for current plugin **/
const modelPath     =	__dirname+"/model/user";
const modulePath	= 	"/api/";
const frontUser	    =   require(modelPath);

/** Routing is used to save contact enquiries*/
app.post(modulePath+"contact_us",(req, res)=>{
    frontUser.contactUs(req, res);
});
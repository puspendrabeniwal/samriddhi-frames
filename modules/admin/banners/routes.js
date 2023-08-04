/** Model file path for current plugin **/
const modelPath = __dirname + "/model/banners";
const modulePath = "/" + ADMIN_NAME + "/banners/";
const banners = require(modelPath);

/** Set current view folder **/
app.use(modulePath, (req, res, next) => {
    req.rendering.views = __dirname + "/views";
    next();
});

/** Routing is used to get banner list **/
app.all(modulePath, checkLoggedInAdmin, (req, res, next) => {
    banners.getBannersList(req, res, next);
});

/** Routing is used to add banner **/
app.all(modulePath + "add", checkLoggedInAdmin, (req, res, next) => {
    banners.addBanner(req, res, next);
});

/** Routing is used to edit banner **/
app.all(modulePath + "edit/:id", checkLoggedInAdmin, (req, res, next) => {
    banners.editBanner(req, res, next);
});

/** Routing is used to delete user details **/
app.get(modulePath+"delete/:id",checkLoggedInAdmin,(req,res,next)=>{
    banners.deleteBanner(req,res,next);
});

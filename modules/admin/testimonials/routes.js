/** Model file path for current plugin **/
const modelPath = __dirname + "/model/testimonials";
const modulePath = "/" + ADMIN_NAME + "/testimonials/";
const testimonials = require(modelPath);

/** Set current view folder **/
app.use(modulePath, (req, res, next) => {
    req.rendering.views = __dirname + "/views";
    next();
});

/** Routing is used to get list **/
app.all(modulePath, checkLoggedInAdmin, (req, res, next) => {
    testimonials.getList(req, res, next);
});

/** Routing is used to add **/
app.all(modulePath + "add", checkLoggedInAdmin, (req, res, next) => {
    testimonials.addTestimonial(req, res, next);
});

/** Routing is used to edit **/
app.all(modulePath + "edit/:id", checkLoggedInAdmin, (req, res, next) => {
    testimonials.editTestimonial(req, res, next);
});

/** Routing is used to delete **/
app.get(modulePath+"delete/:id",checkLoggedInAdmin,(req,res,next)=>{
    testimonials.deleteTestimonial(req,res,next);
});

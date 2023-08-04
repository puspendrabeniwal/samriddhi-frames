/** Model file path for current plugin **/
const modelPath = __dirname + "/model/jobs";
const modulePath = "/" + ADMIN_NAME + "/jobs/";
const jobs = require(modelPath);

/** Set current view folder **/
app.use(modulePath, (req, res, next) => {
    req.rendering.views = __dirname + "/views";
    next();
});

/** Routing is used to get Job list **/
app.all(modulePath, checkLoggedInAdmin, (req, res, next) => {
    jobs.getJobList(req, res, next);
});

/** Routing is used to add Job **/
app.all(modulePath + "add", checkLoggedInAdmin, (req, res, next) => {
    jobs.addJob(req, res, next);
});

/** Routing is used to edit Job **/
app.all(modulePath + "edit/:id", checkLoggedInAdmin, (req, res, next) => {
    jobs.editJob(req, res, next);
});
/** Routing is used to delete Job **/
app.all(modulePath + "delete/:id", checkLoggedInAdmin, (req, res, next) => {
    jobs.deleteJob(req, res, next);
});
/** Routing is used to view Job details **/
app.get(modulePath + "view/:id", checkLoggedInAdmin, (req, res, next) => {
    jobs.getJobDetails(req, res, next);
});

/** Routing is used to view career details **/
app.all(modulePath + "resume_list/:id", checkLoggedInAdmin, (req, res, next) => {
    jobs.getResumeList(req, res, next);
});
/** Routing is used to update status**/
app.all(modulePath+"update-status/:id/:status",checkLoggedInAdmin,(req, res) => {
	jobs.updateStatus(req, res);
});
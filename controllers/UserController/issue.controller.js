const issueModel = require("../../models/UserModels/issue.model");

//✅ Add Issue
const addIssue = async(req, res) =>{
    try {
        const{issue} = req.body;
        if(!issue){
            return res.status(400).json({
                success:false,
                message:"Issue is required"
            })
        }
        const newIssue = await issueModel.create({issue});
        return res.status(201).json({
            success:true,
            message:"Issue added successfully",
            newIssue
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Something went wrong"
        })
    }
};

//✅ Get All Issue
const getAllIssue = async(req, res) =>{
    try {
        const issues = await issueModel.find().select("_id issue");
        return res.status(200).json({
            success:true,
            message:"Issues fetched successfully",
            issues
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Something went wrong"
        })
    }
}

module.exports = {
    addIssue,
    getAllIssue
}

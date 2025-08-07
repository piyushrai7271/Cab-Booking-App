const issueDetails = require("../../models/UserModels/issueDetails.model");


const createTitleDescription = async(req, res) =>{
    try {
        const{issueId} = req.params
        const userId = req.user._id;
        const {title, description} = req.body;
        if(!title || !description){
            return res.status(400).json({
                success:false,
                message:"Title and Description are required"
            })
        }
        const newIssueDetails = await issueDetails.create({userId,issueId, title, description});
        return res.status(201).json({
            success:true,
            message:"Title and Description created successfully",
            newIssueDetails
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Failed To Create Title and Description"
        })
    }
}

//✅ get issue title
const getIssueTitle = async(req, res) =>{
    try {
        const {issueId} = req.params;
        const rawData = await issueDetails.find({ issueId })
      .select("title issueId")
      .populate("issueId", "issue");

    
    const formattedData = rawData.map(item => ({
      _id: item._id,
      title: item.title,
      issue: item.issueId?.issue  
    }));
    return res.status(200).json({
        success:true,
        message:"Title fetched successfully",
        getIssueByTitle: formattedData
    })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Failed To Fetch Title"
        })
    }
}

const getIssuewithTitleAndDescription = async(req, res) =>{
    try {
        const {id} = req.params;
        const userId = req.user._id;
        if(!userId){
            return res.status(400).json({
                success:false,
                message:"Unauthorized: Please log in to access this resource"
            })
        }
        const rawData = await issueDetails.find({ _id:id })
        .select("title description issueId")
        .populate("issueId", "issue");
  
      
      const formattedData = rawData.map(item => ({
        issue: item.issueId?.issue,
        _id: item._id,
        title: item.title,
        description: item.description
      }));
        return res.status(200).json({
            success:true,
            message:"Title and Description fetched successfully",
            getIssueById: formattedData
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Failed To Fetch Title and Description"
        })
    }
}


module.exports = {
  createTitleDescription, 
  getIssueTitle,
  getIssuewithTitleAndDescription
}
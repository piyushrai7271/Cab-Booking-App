const GetHelp = require("../../models/UserModels/getHelp.model");

// Create a new help category with sub-issues
const createHelpCategory = async (req, res) => {
  try {
    const { category, subIssues } = req.body;

    // Basic validation
    if (!category || typeof category !== "string") {
      return res
        .status(400)
        .json({ message: "Category is required and must be a string." });
    }

    if (!Array.isArray(subIssues)) {
      return res.status(400).json({ message: "Sub-issues must be an array." });
    }

    for (const issue of subIssues) {
      if (!issue.title || !issue.description) {
        return res.status(400).json({
          message: "Each sub-issue must have a title and description.",
        });
      }
    }

    const existing = await GetHelp.findOne({ category });
    if (existing) {
      return res.status(409).json({ message: "Category already exists." });
    }

    const newCategory = new GetHelp({ category, subIssues });
    await newCategory.save();

    return res
      .status(201)
      .json({ message: "Help category created.", data: newCategory });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Get all help categories with sub-issues
const getAllHelpCategories = async (req, res) => {
  try {
    const data = await GetHelp.find();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update help category or sub-issues
const updateHelpCategory = async (req, res) => {
  try {
    let { category } = req.params;

    category = category.trim();
    const { newCategoryName, subIssues } = req.body;

    if (!newCategoryName && !subIssues) {
      return res.status(400).json({
        message: "Provide new category name or sub-issues to update.",
      });
    }
    const updateData = {};
    // If updating category name, check for duplicates
    if (newCategoryName) {
      const existing = await GetHelp.findOne({
        category: newCategoryName.trim(),
      });
      if (existing && existing.category !== category) {
        return res
          .status(409)
          .json({ message: "Category with new name already exists." });
      }
      updateData.category = newCategoryName.trim();
    }
    if (subIssues) {
      if (!Array.isArray(subIssues)) {
        return res
          .status(400)
          .json({ message: "Sub-issues must be an array." });
      }

      for (const issue of subIssues) {
        if (!issue.title || !issue.description) {
          return res
            .status(400)
            .json({message: "Each sub-issue must have a title and description.",
          });
        }
      }

      updateData.subIssues = subIssues;
    }

    const updated = await GetHelp.findOneAndUpdate({ category }, updateData, {
      new: true,
    });

    if (!updated) {
      return res
         .status(404)
         .json({ message: "Category not found." });
    }

    return res
      .status(200)
      .json({ message: "Category updated successfully.", data: updated });
  } catch (error) {
    return res
       .status(500)
       .json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createHelpCategory,
  getAllHelpCategories,
  updateHelpCategory,
};

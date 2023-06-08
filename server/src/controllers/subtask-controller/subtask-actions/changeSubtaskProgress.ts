// Dependencies
import { Response } from "express"
import mongoose from "mongoose"

// Models
import PostModel from "../../../models/Post"
import TaskModel from "../../../models/Task"
import SubtaskModel from "../../../models/Subtask"

// Validators
import updateSubtaskProgressSchema from "../../../lib/validations/subtask/updateSubtaskProgressValidator"

// Types
import JWTRequest from "../../../lib/types/JWTRequestType"

export const changeSubtaskProgress = async (req: JWTRequest, res: Response) => {
  try {
    // Validate body using the update subtask progress schema
    updateSubtaskProgressSchema.parse(req.body)

    // Extract progress payload from the request body and params
    const { progress } = req.body
    const { subtaskId } = req.params

    // Extract postId and taskId from the request query
    const { postId, taskId } = req.query
    if (!postId || !taskId) {
      return res.status(400).json({
        message: "Bad Request!",
        data: null,
        ok: false,
      })
    }

    // Check if post exists
    const existingPost = await PostModel.findById(postId)
    if (!existingPost) {
      return res.status(404).json({
        message: "Post not found!",
        data: null,
        ok: false,
      })
    }

    // Check if task exists
    const existingTask = await TaskModel.findById(taskId)
    if (!existingTask) {
      return res.status(404).json({
        message: "Task not found!",
        data: null,
        ok: false,
      })
    }

    // Check if subtask exists
    const existingSubtask = await SubtaskModel.findById(subtaskId)
    if (!existingSubtask) {
      return res.status(404).json({
        message: "Subtask not found!",
        data: null,
        ok: false,
      })
    }

    // Check if the user who is updating the subtask is authorized to do so
    const { _idFromToken } = req.user
    const objectId = new mongoose.Types.ObjectId(_idFromToken)
    const isOwner = existingPost.creatorId!.equals(objectId)
    const isCollaborator = existingPost.authorizedUsers.some((userId) =>
      userId.equals(objectId)
    )
    if (!isOwner && !isCollaborator) {
      return res
        .status(400)
        .json({ message: "Unauthorized request!", data: null, ok: false })
    }

    // Update subtask progress
    existingSubtask.progress = progress
    await existingSubtask.save()

    res.status(200).json({
      message: "Task progress updated successfully!",
      data: existingSubtask,
      ok: true,
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      message: "Internal server error",
      data: null,
      ok: false,
    })
  }
}

// Dependencies
import { Response } from "express"
import mongoose from "mongoose"

// Models
import UserModel from "../../../models/User"

// Types
import JWTRequest from "../../../lib/types/JWTRequestType"

export const unfollowUser = async (req: JWTRequest, res: Response) => {
  // Extract userId and followerId from request params
  const { userId, followerId } = req.params

  // Check if appropriate payload is attached to the body
  if (!userId || !followerId) {
    return res.status(400).json({
      message: "userId and followerId params are required!",
      data: null,
      ok: false,
    })
  }

  // Extract decoded token from verifyToken middleware
  const { _idFromToken } = req.user

  // Check if user has an id equal to the id from the token
  if (userId !== _idFromToken) {
    return res
      .status(400)
      .json({ message: "Invalid Credentials!", data: null, ok: false })
  }

  // Check if userId and followerId are valid ObjectIds
  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(followerId)
  ) {
    return res.status(400).json({
      message: "Invalid userId or followerId!",
      data: null,
      ok: false,
    })
  }

  try {
    // Check if user exists
    const existingUser = await UserModel.findById(userId)
    if (!existingUser) {
      return res
        .status(404)
        .json({ message: "User not found!", data: null, ok: false })
    }

    // Check if follower exists
    const existingFollower = await UserModel.findById(followerId)
    if (!existingFollower) {
      return res
        .status(404)
        .json({ message: "Follower not found!", data: null, ok: false })
    }

    const objectId = new mongoose.Types.ObjectId(followerId)
    // Check if the user is followed by the follower
    if (!existingUser.followers.includes(objectId)) {
      return res.status(400).json({
        message: "User is not followed by the follower!",
        data: null,
        ok: false,
      })
    }

    // Update user's followers and follower's following list
    existingUser.followers = existingUser.followers.filter(
      (follower) => !follower.equals(objectId)
    )
    existingFollower.following = existingFollower.following.filter(
      (user) => !user.equals(userId)
    )

    await existingUser.save()
    await existingFollower.save()

    res.status(200).json({
      message: "User successfully unfollowed!",
      data: null,
      ok: true,
    })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: err, data: null, ok: false })
  }
}
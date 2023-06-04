import { Request, Response } from "express"
import UserModel from "../models/User"
import mongoose from "mongoose"
import JWTRequest from "../lib/types/JWTRequestType"

export const getUser = async (req: Request, res: Response) => {
  // Extract username from request params
  const { userId } = req.params

  // Check if appropriate payload is attached to the body
  if (!userId) {
    return res
      .status(400)
      .json({ message: "userId params is required!", data: null, ok: false })
  }

  // Check if userId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res
      .status(400)
      .json({ message: "Invalid userId!", data: null, ok: false })
  }

  try {
    // Check if user exists
    const existingUser = await UserModel.findById(userId).populate(
      "posts savedPosts upvotedPosts downvotedPosts notifications"
    )
    if (!existingUser) {
      return res
        .status(404)
        .json({ message: "User not found!", data: null, ok: false })
    }

    res.status(200).json({
      message: "User successfully fetched!",
      data: existingUser,
      ok: true,
    })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: err, data: null, ok: false })
  }
}

export const getUserFollowing = async (req: Request, res: Response) => {
  // Extract username from params
  const { userId } = req.params

  // Check if appropriate payload is attached to the body
  if (!userId) {
    return res
      .status(400)
      .json({ message: "userId params is required!", data: null, ok: false })
  }

  // Check if userId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res
      .status(400)
      .json({ message: "Invalid userId!", data: null, ok: false })
  }

  try {
    // Check if user exists
    const existingUser = await UserModel.findById(userId).populate("following")
    if (!existingUser) {
      return res
        .status(404)
        .json({ message: "User not found!", data: null, ok: false })
    }

    res.status(200).json({
      message: "User following successfully fetched!",
      data: existingUser.following,
      ok: true,
    })
  } catch (err) {
    res.status(500).json({ message: err, data: null, ok: false })
  }
}

export const getUserFollowers = async (req: Request, res: Response) => {
  // Extract username from params
  const { userId } = req.params

  // Check if appropriate payload is attached to the body
  if (!userId) {
    return res
      .status(400)
      .json({ message: "userId params is required!", data: null, ok: false })
  }

  // Check if userId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res
      .status(400)
      .json({ message: "Invalid userId!", data: null, ok: false })
  }

  try {
    // Check if user exists
    const existingUser = await UserModel.findById(userId).populate("followers")
    if (!existingUser) {
      return res
        .status(404)
        .json({ message: "User not found!", data: null, ok: false })
    }

    res.status(200).json({
      message: "User followers successfully fetched!",
      data: existingUser.followers,
      ok: true,
    })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: err, data: null, ok: false })
  }
}

export const getUserBlocked = async (req: JWTRequest, res: Response) => {
  // Extract username from params
  const { userId } = req.params

  // Check if appropriate payload is attached to the body
  if (!userId) {
    return res
      .status(400)
      .json({ message: "userId params is required!", data: null, ok: false })
  }

  // Check if userId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res
      .status(400)
      .json({ message: "Invalid userId!", data: null, ok: false })
  }

  // Extract decoded token from verifyToken middleware
  const { _idFromToken } = req.user

  // Check if user has an id equal to the id from the token
  if (userId !== _idFromToken) {
    return res
      .status(400)
      .json({ message: "Invalid Credentials!", data: null, ok: false })
  }

  try {
    // Check if user exists
    const existingUser = await UserModel.findById(userId).populate("blocked")
    if (!existingUser) {
      return res
        .status(404)
        .json({ message: "User not found!", data: null, ok: false })
    }

    res.status(200).json({
      message: "User blocked successfully fetched!",
      data: existingUser.blocked,
      ok: true,
    })
  } catch (err) {
    res.status(500).json({ message: err, data: null, ok: false })
  }
}

export const followUser = async (req: JWTRequest, res: Response) => {
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
    // Check if the user is already followed by the follower
    if (existingUser.followers.includes(objectId)) {
      return res.status(400).json({
        message: "User is already followed by the follower!",
        data: null,
        ok: false,
      })
    }

    // Update user's followers and follower's following list
    existingUser.followers.push(objectId)
    existingFollower.following.push(objectId)
    await existingUser.save()
    await existingFollower.save()

    res.status(200).json({
      message: "User successfully followed!",
      data: null,
      ok: true,
    })
  } catch (err) {
    res.status(500).json({ message: err, data: null, ok: false })
  }
}

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

export const blockUser = async (req: JWTRequest, res: Response) => {
  // Extract userId and blockedUserId from request params
  const { userId, blockedUserId } = req.params

  // Check if appropriate payload is attached to the body
  if (!userId || !blockedUserId) {
    return res.status(400).json({
      message: "userId and blockedUserId params are required!",
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

  // Check if userId and blockedUserId are valid ObjectIds
  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(blockedUserId)
  ) {
    return res.status(400).json({
      message: "Invalid userId or blockedUserId!",
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

    // Check if blocked user exists
    const blockedUser = await UserModel.findById(blockedUserId)
    if (!blockedUser) {
      return res
        .status(404)
        .json({ message: "Blocked user not found!", data: null, ok: false })
    }

    const blockedUserObjectId = new mongoose.Types.ObjectId(blockedUserId)
    // Check if the user is already blocked
    if (existingUser.blocked.includes(blockedUserObjectId)) {
      return res.status(400).json({
        message: "User is already blocked!",
        data: null,
        ok: false,
      })
    }

    // Remove the blocked user from the user's following list
    existingUser.following = existingUser.following.filter(
      (id) => !id.equals(blockedUserObjectId)
    )

    // Remove the user from the blocked user's followers list
    blockedUser.followers = blockedUser.followers.filter(
      (id) => !id.equals(existingUser._id)
    )

    // Add blockedUserId to user's blocked array
    existingUser.blocked.push(blockedUserObjectId)

    await existingUser.save()
    await blockedUser.save()

    res.status(200).json({
      message: "User successfully blocked!",
      data: null,
      ok: true,
    })
  } catch (err) {
    res.status(500).json({ message: err, data: null, ok: false })
  }
}

export const unblockUser = async (req: JWTRequest, res: Response) => {
  // Extract userId and unblockedUserId from request params
  const { userId, unblockedUserId } = req.params

  // Check if appropriate payload is attached to the body
  if (!userId || !unblockedUserId) {
    return res.status(400).json({
      message: "userId and unblockedUserId params are required!",
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

  // Check if userId and unblockedUserId are valid ObjectIds
  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(unblockedUserId)
  ) {
    return res.status(400).json({
      message: "Invalid userId or unblockedUserId!",
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

    // Check if unblocked user exists
    const unblockedUser = await UserModel.findById(unblockedUserId)
    if (!unblockedUser) {
      return res
        .status(404)
        .json({ message: "Unblocked user not found!", data: null, ok: false })
    }

    const unblockedUserObjectId = new mongoose.Types.ObjectId(unblockedUserId)
    // Check if the user is already unblocked
    if (!existingUser.blocked.includes(unblockedUserObjectId)) {
      return res.status(400).json({
        message: "User is not blocked!",
        data: null,
        ok: false,
      })
    }

    // Remove the unblocked user from the user's blocked array
    existingUser.blocked = existingUser.blocked.filter(
      (id) => !id.equals(unblockedUserObjectId)
    )

    await existingUser.save()

    res.status(200).json({
      message: "User successfully unblocked!",
      data: null,
      ok: true,
    })
  } catch (err) {
    res.status(500).json({ message: err, data: null, ok: false })
  }
}

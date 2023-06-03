// Dependencies
import { Request, Response } from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

// Models
import UserModel from "../models/User"

// Types
import JWTRequest from "../lib/types/JWTRequestType"

// Validators
import { registerFormSchema } from "../../../common/validations/registerFormValidator"
import { loginFormSchema } from "../../../common/validations/loginFormValidator"
import { forgotPasswordFormSchema } from "../../../common/validations/forgotPasswordFormValidator"
import { securityAnswerFormSchema } from "../../../common/validations/securityAnswerFormValidator"
import { resetPasswordFormSchema } from "../../../common/validations/resetPasswordFormValidator"

export const registerUser = async (req: Request, res: Response) => {
  // Validate body using the register form schema
  try {
    registerFormSchema.parse(req.body)
  } catch (err) {
    console.log(err)
    return res.status(400).json({
      message: "Invalid register form data!",
      data: null,
      ok: false,
    })
  }

  // destructure the payload attached to the body
  const {
    firstName,
    lastName,
    email,
    username,
    password,
    securityQuestion,
    securityAnswer,
  } = req.body

  try {
    const salt = await bcrypt.genSalt()

    // Hashing password
    const hashedPassword = await bcrypt.hash(password, salt)

    // Hashing securityAnswer
    const hashedSecurityAnswer = await bcrypt.hash(securityAnswer, salt)

    // Check if the username or email already exists in the db
    const existingUser = await UserModel.findOne({
      $or: [{ username }, { email }],
    })
    if (existingUser) {
      return res.status(400).json({
        message: "Username or email already exists!",
        data: null,
        ok: false,
      })
    }

    // Creating new User
    const user = new UserModel({
      firstName,
      lastName,
      profilePicture: "",
      email,
      username,
      password: hashedPassword,
      securityQuestion,
      securityAnswer: hashedSecurityAnswer,
      following: [],
      followers: [],
      blocked: [],
      posts: [],
      upvotedPosts: [],
      downvotedPosts: [],
      savedPosts: [],
      comments: [],
    })

    // Saving new User
    const registeredUser = await user.save()
    res.status(200).json({
      message: "User successfully registered!",
      data: registeredUser,
      ok: true,
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error, data: null, ok: false })
  }
}

export const loginUser = async (req: Request, res: Response) => {
  /* 
	Search DB via the User Schema w/ unique username. 
	Compare the password in the req to encrypted password in the DB.
	*/

  // Validate body using the register form schema
  try {
    loginFormSchema.parse(req.body)
  } catch (err) {
    console.log(err)
    return res.status(400).json({
      message: "Invalid login form data!",
      data: null,
      ok: false,
    })
  }

  // destructure the payload attached to the body
  const { username, password } = req.body

  try {
    // Check if user exists
    const user = await UserModel.findOne({
      username,
    })
    if (!user)
      return res
        .status(400)
        .json({ message: "User not found", data: null, ok: false })

    // Check if the password matches
    const doesPasswordMatch = await bcrypt.compare(password, user.password)
    if (!doesPasswordMatch)
      return res
        .status(400)
        .json({ message: "User not found", data: null, ok: false })

    const token = jwt.sign(
      { _idFromToken: user._id },
      process.env.JWT_KEY as jwt.Secret
    )

    return res
      .status(200)
      .header("Authorization", `Bearer ${token}`)
      .json({ message: "Login Success!", data: { user, token }, ok: true })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: error, data: null, ok: false })
  }
}

export const getSecurityQuestion = async (req: Request, res: Response) => {
  // Validate body using the register form schema
  try {
    forgotPasswordFormSchema.parse(req.body)
  } catch (err) {
    console.log(err)
    return res.status(400).json({
      message: "Invalid security question form data!",
      data: null,
      ok: false,
    })
  }

  // destructure the payload attached to the body
  const { usernameOrEmail } = req.body

  try {
    // Check if the username already exists in the db
    const existingUser = await UserModel.findOne({
      $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    })
    if (!existingUser) {
      return res
        .status(400)
        .json({ message: "User does not exist!", data: null, ok: false })
    }

    res.status(200).json({
      message: "Security questions successfully fetched!",
      data: {
        firstName: existingUser.firstName,
        username: existingUser.username,
        securityQuestion: existingUser.securityQuestion,
      },
      ok: true,
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error, data: null, ok: false })
  }
}

export const verifySecurityQA = async (req: Request, res: Response) => {
  // Validate body using the register form schema
  try {
    securityAnswerFormSchema.parse(req.body)
  } catch (err) {
    console.log(err)
    return res.status(400).json({
      message: "Invalid security answer form data!",
      data: null,
      ok: false,
    })
  }

  // destructure the payload attached to the body
  const { securityAnswer, username } = req.body

  try {
    // Check if the username already exists in the db
    const existingUser = await UserModel.findOne({
      username,
    })
    if (!existingUser) {
      return res
        .status(400)
        .json({ message: "Invalid auth!", data: null, ok: false })
    }

    const isMatch = await bcrypt.compare(
      securityAnswer,
      existingUser.securityAnswer
    )
    // Check if the security question answer matches existing user's answer
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Invalid auth!", data: null, ok: false })
    }

    res.status(200).json({
      message: "Security question answered successfully!",
      data: existingUser.username,
      ok: true,
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error, data: null, ok: false })
  }
}

export const resetPassword = async (req: Request, res: Response) => {
  // Validate body using the register form schema
  try {
    resetPasswordFormSchema.parse(req.body)
  } catch (err) {
    console.log(err)
    return res.status(400).json({
      message: "Invalid reset password form data!",
      data: null,
      ok: false,
    })
  }

  // destructure the payload attached to the body
  const { username, newPassword } = req.body

  try {
    // Check if user exists
    const existingUser = await UserModel.findOne({ username })
    if (!existingUser) {
      return res
        .status(404)
        .json({ message: "Bad request!", data: null, ok: false })
    }

    // Check if new password matches old password
    const doesOldPasswordMatch = await bcrypt.compare(
      newPassword,
      existingUser.password
    )
    if (doesOldPasswordMatch) {
      return res.status(400).json({
        message: "New password cannot be the same as the old password!",
        data: null,
        ok: false,
      })
    }

    // Hashing new password
    const salt = await bcrypt.genSalt(10)
    const newHashedPassword = await bcrypt.hash(newPassword, salt)

    // Update user password
    existingUser.password = newHashedPassword
    await existingUser.save()

    res.status(200).json({
      message: "Password Reset Successful!",
      data: { username: existingUser.username, _id: existingUser._id },
      ok: true,
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error, data: null, ok: false })
  }
}

export const changeUserDetails = async (req: JWTRequest, res: Response) => {
  // Destructure the payload attached to the body
  const { firstName, lastName, userId, password, address } = req.body

  // Check if appropriate payload is attached to the body
  if (!userId || !password || !firstName || !lastName || !address) {
    return res.status(400).json({
      message: "Full Name, Password and Address properties are required!",
      data: null,
      ok: false,
    })
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

  // Check if user exists
  const existingUser = await UserModel.findOne({ _id: userId })
  if (!existingUser) {
    return res
      .status(400)
      .json({ message: "Bad Request!", data: null, ok: false })
  }

  // Check if password matches user password
  const doesPasswordMatch = await bcrypt.compare(
    password,
    existingUser.password
  )
  if (!doesPasswordMatch) {
    return res.status(400).json({
      message: "You provided the wrong password!",
      data: null,
      ok: false,
    })
  }

  try {
    // Update user details
    existingUser.firstName = firstName
    existingUser.lastName = lastName
    await existingUser.save()

    res.status(200).json({
      message: "User Details Updated Successfully!",
      data: null,
      ok: true,
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error, data: null, ok: false })
  }
}

export const changePassword = async (req: JWTRequest, res: Response) => {
  // Destructure the payload attached to the body
  const { userId, oldPassword, newPassword, newConfirmPassword } = req.body

  // Check if appropriate payload is attached to the body
  if (!oldPassword || !newPassword || !newConfirmPassword) {
    return res.status(400).json({
      message:
        "Old Password, New Password, and Confirm Password properties are required!",
      data: null,
      ok: false,
    })
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

  // Check if user exists
  const existingUser = await UserModel.findOne({ _id: userId })
  if (!existingUser) {
    return res
      .status(400)
      .json({ message: "Bad Request!", data: null, ok: false })
  }

  // Check if oldPassword and newPassword matches
  const didPasswordEvenChange = await bcrypt.compare(
    newPassword,
    existingUser.password
  )
  if (didPasswordEvenChange) {
    return res.status(400).json({
      message: "New password cannot match your old password!",
      data: null,
      ok: false,
    })
  }

  try {
    // Hashing new password
    const salt = await bcrypt.genSalt(10)
    const newHashedPassword = await bcrypt.hash(newPassword, salt)

    // Update user password
    existingUser.password = newHashedPassword
    await existingUser!.save()

    res.status(200).json({
      message: "Password Changed Successful!",
      data: null,
      ok: true,
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error, data: null, ok: false })
  }
}

export const changeSecurityQA = async (req: JWTRequest, res: Response) => {
  // destructure the payload attached to the body
  const { userId, password, newSecurityQuestion, newSecurityQAnswer } = req.body

  // Check if appropriate payload is attached to the body
  if (!password || !newSecurityQuestion || !newSecurityQAnswer) {
    return res.status(400).json({
      message:
        "New Security Question, New Security Question Answer, and Password properties are required!",
      data: null,
      ok: false,
    })
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

  // Check if user exists
  const existingUser = await UserModel.findOne({ _id: userId })
  if (!existingUser) {
    return res
      .status(400)
      .json({ message: "Bad Request!", data: null, ok: false })
  }

  // Check if password matches user password
  const doesPasswordMatch = await bcrypt.compare(
    password,
    existingUser.password
  )
  if (!doesPasswordMatch) {
    return res.status(400).json({
      message: "You provided the wrong password!",
      data: null,
      ok: false,
    })
  }

  try {
    // Hashing new security question answer
    const salt = await bcrypt.genSalt(10)
    const hashedSecurityQAnswer = await bcrypt.hash(newSecurityQAnswer, salt)

    // Update user security qa
    existingUser.securityQuestion = newSecurityQuestion
    existingUser.securityAnswer = hashedSecurityQAnswer
    await existingUser!.save()

    res.status(200).json({
      message: "Security QA Updated Successfully!",
      data: null,
      ok: true,
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error, data: null, ok: false })
  }
}

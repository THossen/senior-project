// Hooks
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"

// Components
import RHFInputField from "../../../ui/rhf/RHFInputField"

// Validators
import { zodResolver } from "@hookform/resolvers/zod"
import {
  forgotPasswordFormSchema,
  forgotPasswordFormType,
} from "../../../../../../common/validations/forgotPasswordFormValidator"

const ForgotPasswordForm = () => {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
  } = useForm<forgotPasswordFormType>({
    resolver: zodResolver(forgotPasswordFormSchema),
  })

  useEffect(() => {
    setFocus("usernameOrEmail")
  }, [setFocus])

  const getSecurityQuestionHandler = async (
    formData: forgotPasswordFormType
  ) => {
    const response = await fetch(
      `http://localhost:${
        import.meta.env.VITE_BACKEND_SERVER_PORT
      }/api/auth/get-security-question`,
      {
        method: "POST",
        body: JSON.stringify({
          ...formData,
        }),
        headers: { "Content-Type": "application/json" },
      }
    )

    const data = await response.json()

    if (!data.ok) {
      navigate("/login")
      return
    }

    navigate("/security-answer", {
      state: {
        firstName: data.data.firstName,
        username: data.data.username,
        securityQuestion: data.data.securityQuestion,
      },
    })
  }

  return (
    <div className="p-10">
      <form
        className="flex flex-col"
        onSubmit={handleSubmit(getSecurityQuestionHandler)}
      >
        <h1 className="text-center text-sm mb-10">
          Please enter the username or email that is associated with your
          account
        </h1>
        <RHFInputField
          label="Username or Email"
          register={register("usernameOrEmail")}
          error={errors.usernameOrEmail?.message}
        />
        <SubmitButton />
      </form>
    </div>
  )
}

export default ForgotPasswordForm

const SubmitButton = () => {
  return (
    <button
      className={`w-full mt-4 p-4 rounded-lg duration-200 hover:bg-secondary ease-in-out bg-tertiary text-secondary hover:text-main font-bold text-sm dark:bg-secondary dark:hover:bg-tertiary`}
      type="submit"
    >
      Submit
    </button>
  )
}
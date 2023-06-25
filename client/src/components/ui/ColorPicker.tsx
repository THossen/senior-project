/* eslint-disable @typescript-eslint/no-explicit-any */
import { TwitterPicker } from "react-color"
import { useState } from "react"
import { isAxiosError } from "axios"
import { useDispatch } from "react-redux"
import { setFeedback } from "../../lib/store/slices/feedback-slice/feedbackSlice"
import postAPI from "../../lib/services/axios-instances/postAPI"

type Props = {
  initialColor: string
  postId: string
  handleParentColorChange: (color: any) => void
}

const ColorPicker = ({
  initialColor,
  postId,
  handleParentColorChange,
}: Props) => {
  const [color, setColor] = useState(initialColor)
  const dispatch = useDispatch()

  const handleColorChange = async (color: any) => {
    setColor(color)
    handleParentColorChange(color.hex)
    try {
      const { data } = await postAPI.put(`/${postId}`, { color: color.hex })
      dispatch(
        setFeedback({
          feedbackMessage: data.message,
          feedbackType: "success",
        })
      )
      console.log(data)
    } catch (err) {
      if (isAxiosError(err)) {
        dispatch(
          setFeedback({
            feedbackMessage: err.response?.data.message,
            feedbackType: "error",
          })
        )
      } else {
        console.error(err)
      }
    }
  }

  return <TwitterPicker onChange={handleColorChange} color={color} />
}

export default ColorPicker

import { useState } from "react"
import { Tab, Tabs } from "@mui/material"
import { useNavigate } from "react-router-dom"

const NavigationTabs = () => {
  const navigate = useNavigate()
  const [value, setValue] = useState("timeline")

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue)
  }

  const handleTimelineClick = () => {
    navigate("/app")
  }

  const handleWorkspaceClick = () => {
    navigate("/app/workspace")
  }

  return (
    <div className="text-blue-500">
      <Tabs
        value={value}
        onChange={handleChange}
        TabIndicatorProps={{
          className: "bg-tertiary",
        }}
      >
        <Tab
          value="timeline"
          label="Timeline"
          className={`font-semibold text-md ${
            value === "timeline" ? "text-tertiary" : "text-secondary"
          }`}
          onClick={handleTimelineClick}
        />
        <Tab
          value="workspace"
          label="Workspace"
          className={`font-semibold text-md ${
            value === "workspace" ? "text-tertiary" : "text-secondary"
          }`}
          onClick={handleWorkspaceClick}
        />
      </Tabs>
    </div>
  )
}

export default NavigationTabs

import React from 'react'
import { Outlet } from 'react-router-dom'

const AuthLayout = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#274744]">
        <Outlet />
    </div>
  )
}

export default AuthLayout

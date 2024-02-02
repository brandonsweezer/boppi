'use client'
import { useEffect } from "react"
import Cookies from 'js-cookie'
import { redirect } from "next/navigation";

export default function Logout() {
    useEffect(() => {
        Cookies.remove('token');
        redirect('/login')
    }, [])

    return (<div>logging out...</div>)
}
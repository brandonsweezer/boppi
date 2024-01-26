"use client"
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/v1/host')
}
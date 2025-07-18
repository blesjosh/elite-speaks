'use client'
import React from 'react'
import 'swiper/css'
import 'swiper/css/autoplay'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/effect-coverflow'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { ArrowRight, Menu, Rocket, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { SwiperComponent } from './ui/swiper'

const menuItems = [
    { name: 'Features', href: '#features' },
    { name: 'Why Elite-speaks', href: '#why-elite-speaks' },
    { name: 'About', href: '#about' },
]

export default function HeroSection() {
    const [menuState, setMenuState] = React.useState(false)
    const { user, signOut } = useAuth()

    const handleSignOut = async () => {
        await signOut()
    }

    return (
        <>
            <header>
                <nav
                    data-state={menuState && 'active'}
                    className="fixed z-20 w-full border-b border-dashed bg-white backdrop-blur md:relative lg:bg-white">
                    <div className="m-auto max-w-5xl px-6">
                        <div className="flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
                            <div className="flex w-full justify-between lg:w-auto">
                                <Link
                                    href="/"
                                    aria-label="home"
                                    className="flex items-center space-x-2">
                                    <Logo />
                                </Link>

                                <button
                                    onClick={() => setMenuState(!menuState)}
                                    aria-label={menuState == true ? 'Close Menu' : 'Open Menu'}
                                    className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden">
                                    <Menu className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                                    <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                                </button>
                            </div>

                            <div className="bg-background in-data-[state=active]:block lg:in-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
                                <div className="lg:pr-4">
                                    <ul className="space-y-6 text-base lg:flex lg:gap-8 lg:space-y-0 lg:text-sm">
                                        {menuItems.map((item, index) => (
                                            <li key={index}>
                                                <Link
                                                    href={item.href}
                                                    className="text-muted-foreground hover:text-accent-foreground block duration-150">
                                                    <span>{item.name}</span>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit lg:border-l lg:pl-6">
                                    {user ? (
                                        <>
                                            <Button
                                                asChild
                                                variant="outline"
                                                size="sm">
                                                <Link href="/dashboard">
                                                    <span>Dashboard</span>
                                                </Link>
                                            </Button>
                                            <Button
                                                onClick={handleSignOut}
                                                size="sm">
                                                <span>Sign Out</span>
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button
                                                asChild
                                                variant="outline"
                                                size="sm">
                                                <Link href="/login">
                                                    <span>Login</span>
                                                </Link>
                                            </Button>
                                            <Button
                                                asChild
                                                size="sm">
                                                <Link href="/signup">
                                                    <span>Signup</span>
                                                </Link>
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </nav>
            </header>
            <main className="overflow-hidden">
                <section className="relative bg-transparent">
                    <div className="relative py-24 lg:py-28 bg-transparent">
                        <div className="mx-auto max-w-7xl px-6 md:px-12">
                            <div className="text-center sm:mx-auto sm:w-10/12 lg:mr-auto lg:mt-0 lg:w-4/5">
                                <Link
                                    href="/"
                                    className="rounded-(--radius) mx-auto flex w-fit items-center gap-2 border p-1 pr-3">
                                    <span className="bg-muted rounded-[calc(var(--radius)-0.25rem)] px-2 py-1 text-xs">Disclaimer</span>
                                    <span className="text-sm">This is not for losers</span>
                                    <span className="bg-(--color-border) block h-4 w-px"></span>

                                    <ArrowRight className="size-4" />
                                </Link>

                                <h1 className="mt-8 text-3xl font-semibold md:text-5xl xl:text-7xl xl:[line-height:1.125] font-['Inter_Tight']">
                                    Still complaining about your <br /> english communication ?
                                </h1>
                                <p className="mx-auto mt-8 hidden max-w-2xl text-wrap text-lg sm:block">This is the one end solution to all your english communication problems</p>
                                <p className="mx-auto mt-6 max-w-2xl text-wrap sm:hidden">This is the one end solution to all your english communication problems</p>

                                <div className="mt-8">
                                    <Button
                                        size="lg"
                                        asChild>
                                        <Link href="#">
                                            <Rocket className="relative size-4" />
                                            <span className="text-nowrap">Let's start</span>
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                            <div className="relative mx-auto mt-8 max-w-lg sm:mt-12">
                                <div className="absolute inset-0 -top-8 left-1/2 -z-20 h-56 w-full -translate-x-1/2 [background-image:linear-gradient(to_bottom,transparent_98%,theme(colors.gray.200/75%)_98%),linear-gradient(to_right,transparent_94%,_theme(colors.gray.200/75%)_94%)] [background-size:16px_35px] [mask:radial-gradient(black,transparent_95%)] dark:opacity-10"></div>
                                <div className="absolute inset-x-0 top-12 -z-[1] mx-auto h-1/3 w-2/3 rounded-full bg-blue-300 blur-3xl dark:bg-white/20"></div>

                                {/* <SwiperComponent/> */}

                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    )
}

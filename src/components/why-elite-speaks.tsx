'use client'
import * as motion from "motion/react-client"
import type { Variants } from "motion/react"

export default function WhyEliteSpeaks() {
    return (
        <section className="py-12 md:py-16 lg:py-20">
            <div className="mx-auto max-w-4xl px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-5xl font-semibold font-['Inter_Tight'] mb-4">
                        Why Elite Speaks?
                    </h2>
                    <p className="text-base text-muted-foreground max-w-xl mx-auto">
                        Discover what makes Elite Speaks the ultimate solution for English communication mastery
                    </p>
                </div>
                
                <div style={container}>
                    {reasons.map(([icon, title, description, hueA, hueB], i) => (
                        <ReasonCard 
                            key={title}
                            i={i} 
                            icon={icon} 
                            title={title}
                            description={description}
                            hueA={hueA} 
                            hueB={hueB} 
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}

interface ReasonCardProps {
    icon: string
    title: string
    description: string
    hueA: number
    hueB: number
    i: number
}

function ReasonCard({ icon, title, description, hueA, hueB, i }: ReasonCardProps) {
    const background = `linear-gradient(306deg, ${hue(hueA)}, ${hue(hueB)})`

    return (
        <motion.div
            className={`reason-card-container-${i}`}
            style={cardContainer}
            initial="offscreen"
            whileInView="onscreen"
            viewport={{ amount: 0.8 }}
        >
            <div style={{ ...splash, background }} />
            <motion.div style={card} variants={cardVariants} className="reason-card">
                <div className="text-center p-4">
                    <div className="text-4xl mb-3">{icon}</div>
                    <h3 className="text-lg font-semibold mb-2 font-['Inter_Tight']">{title}</h3>
                    <p className="text-xs text-gray-600 leading-relaxed">{description}</p>
                </div>
            </motion.div>
        </motion.div>
    )
}

const cardVariants: Variants = {
    offscreen: {
        y: 200,
    },
    onscreen: {
        y: 30,
        rotate: -8,
        transition: {
            type: "spring",
            bounce: 0.4,
            duration: 0.8,
        },
    },
}

const hue = (h: number) => `hsl(${h}, 100%, 50%)`

/**
 * ==============   Styles   ================
 */

const container: React.CSSProperties = {
    margin: "60px auto",
    maxWidth: 600,
    paddingBottom: 60,
    width: "100%",
}

const cardContainer: React.CSSProperties = {
    overflow: "hidden",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    paddingTop: 15,
    marginBottom: -80,
}

const splash: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    clipPath: `path("M 0 303.5 C 0 292.454 8.995 285.101 20 283.5 L 460 219.5 C 470.085 218.033 480 228.454 480 239.5 L 500 430 C 500 441.046 491.046 450 480 450 L 20 450 C 8.954 450 0 441.046 0 430 Z")`,
}

const card: React.CSSProperties = {
    width: 280,
    height: 320,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    background: "#ffffff",
    boxShadow:
        "0 0 1px hsl(0deg 0% 0% / 0.075), 0 0 2px hsl(0deg 0% 0% / 0.075), 0 0 4px hsl(0deg 0% 0% / 0.075), 0 0 8px hsl(0deg 0% 0% / 0.075), 0 0 16px hsl(0deg 0% 0% / 0.075)",
    transformOrigin: "10% 60%",
}

/**
 * ==============   Data   ================
 */

const reasons: [string, string, string, number, number][] = [
    ["🎯", "Targeted Learning", "Personalized curriculum designed specifically for your communication goals and skill level", 340, 10],
    ["🚀", "Rapid Progress", "See noticeable improvement in your English speaking confidence within weeks, not months", 20, 40],
    ["🤖", "AI-Powered Feedback", "Get instant, detailed analysis of your speech patterns, grammar, and pronunciation", 60, 90],
    ["💼", "Professional Focus", "Master workplace communication, presentations, and business English for career advancement", 205, 245],
]
import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Img,
	Preview,
	Section,
	Tailwind,
	Text,
} from "@react-email/components"
import React from "react"

type Props = {
	name: string
}

export const WelcomeEmail = ({ name }: Props) => {
	return (
		<Html>
			<Head />
			<Preview>Welcome to Sweetie</Preview>
			<Tailwind>
				<Body style={main}>
					<Container style={container}>
						<Section style={box}>
							<Heading className='color-["#333"] m-[40px 0px] font-bold p-0'>
								Welcome!
							</Heading>
							<Text>Hey {name?.split(" ")[0] || ""},</Text>
							<Section className="flex justify-center">
								<Img
									src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDZ4d2R0OGZuNTM2OGkxeWE1cmNjemhpN2h2ZnlzZjJtaWJhbnp3ciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Cmr1OMJ2FN0B2/giphy.gif"
									alt="Sweetie"
									height="300"
								/>
							</Section>
							<Text>
								Welcome! I'm Quinn Vaughn, the founder of Sweetie. Ever found
								yourself scratching your head over date plans? Yep, been there.
								That's why I created Sweetie – to simplify the whole process.
							</Text>
							<Button href={"https://trysweetie.com"} style={button}>
								Find Your Perfect Date
							</Button>
							<Hr style={hr} />
							<Text>
								Need date ideas or have questions? Just hit reply! I'm here to
								help you ace those dates.
							</Text>
							<Text>Cheers to unforgettable experiences!</Text>
						</Section>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	)
}

export default WelcomeEmail

const main = {
	backgroundColor: "#f6f9fc",
	fontFamily:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
	backgroundColor: "#ffffff",
	margin: "0 auto",
	padding: "20px 0 48px",
	marginBottom: "64px",
}

const box = {
	padding: "0 48px",
}

const hr = {
	borderColor: "#e6ebf1",
	margin: "20px 0",
}

const button = {
	backgroundColor: "#FF559D",
	borderRadius: "5px",
	color: "#fff",
	fontSize: "16px",
	fontWeight: "bold",
	textDecoration: "none",
	textAlign: "center" as const,
	display: "block",
	width: "100%",
	padding: "10px",
}

import {
	GroupDate,
	GroupDateAddOn,
	GroupDateOrderedStop,
	GroupDateProduct,
	Location,
} from "@prisma/client"
import { prisma } from "./db"

type CustomOrderedStop = Omit<
	GroupDateOrderedStop,
	| "groupDateId"
	| "id"
	| "createdAt"
	| "updatedAt"
	| "zenstack_guard"
	| "locationId"
> & {
	location: CustomLocation
}

type CustomGroupDateProduct = Omit<
	GroupDateProduct,
	"id" | "createdAt" | "updatedAt" | "zenstack_guard" | "groupDateId"
> & {}

type CustomLocation = {
	name: string
	website: string
	images: string[]
	address: {
		street: string
		city: string
		postalCode: string
		coordinates: {
			lat: number
			lng: number
		}
	}
}

type CustomGroupDateAddOn = Omit<
	GroupDateAddOn,
	"id" | "createdAt" | "updatedAt" | "zenstack_guard" | "groupDateId"
>

type CustomGroupDate = Omit<
	GroupDate,
	"tastemakerId" | "id" | "createdAt" | "updatedAt" | "zenstack_guard"
> & {
	userEmail: string
	stops: CustomOrderedStop[]
	products: CustomGroupDateProduct[]
	addOns: CustomGroupDateAddOn[]
}

const groupDate: CustomGroupDate = {
	userEmail: "quinn@trysweetie.com",
	title: "Virtual Ventures: A Pixelated Playdate",
	numSpots: 30,
	description:
		"Embark on a thrilling journey of digital delights with your special someone and invite other couples along for a night of unforgettable fun! Step into the heart of LA's entertainment scene and immerse yourselves in a world of virtual reality, high-tech arcade games, and interactive experiences. Whether you're exploring distant galaxies in VR or engaging in friendly competition on the arcade floor, there's something for every couple to enjoy. With a myriad of activities and cutting-edge technology at your disposal, this group date night promises excitement, laughter, and plenty of memorable moments for all. Join us for an evening of boundless fun and endless possibilities!",
	image:
		"https://imageio.forbes.com/blogs-images/charliefink/files/2018/08/tbc-sign-680.jpg",
	minimumPrice: 35000,
	maximumPrice: 37500,
	addOns: [
		{
			name: "Avoid looking like an asshole: Get her flowers",
			minimumPrice: 5000,
			maximumPrice: 10000,
			description:
				"We're going to have the wait staff bring her flowers before you leave. You don't want to be the only one who doesn't. You're welcome.",
			order: 1,
			image:
				"https://www.bloomdf.com/cdn/shop/products/bloom-de-fleur-bouquet-bouquet-101-long-red-roses-13940562100287.jpg?v=1619023835",
		},
	],
	products: [
		{
			name: "Club 01 Rental",
			description:
				"We will have the entire Club 01 to ourselves. Feel free to store your things here and come and go as you please.",
			image:
				"https://partyslate.imgix.net/photos/783464/photo-2aac43f2-96cd-48c5-83b5-f64cd656e06e.png",
			order: 1,
		},
		{
			name: "Taco Buffet",
			description:
				"Your choice of chicken or carne asada tacos, served with rice, beans, cheese, onions, and cilantro on corn tortillas. We will also have fajita veggies if you one of you is vegetarian.",
			image:
				"https://bakeitwithlove.com/wp-content/uploads/2023/02/taco-bar-h.jpg",
			order: 2,
		},
		{
			name: "Player Cards",
			description:
				"Each person will get a player card with 85 on it to spend on drinks and games",
			image:
				"https://twobitcircus.com/wp-content/uploads/2019/09/TBC_837-copy.jpg",
			order: 3,
		},
		{
			name: "Interactive Game Show",
			description:
				"We will have an interactive game show for everyone to participate in. We're keeping the details a secret, but it's going to be a blast!",
			image:
				"https://twobitcircus.com/wp-content/uploads/2019/08/attraction_header.jpg",
			order: 4,
		},
		{
			name: "Goodie Bags",
			description: "We will have goodie bags for everyone to take home",
			image:
				"https://i5.walmartimages.com/seo/3-Filled-Goodie-Bags-w-Treats-Toys-Easter-Gifts-for-Kids-Chocolate-Candy_751e6070-0387-4abb-a5d2-6956e6721a66_1.b6fe686342d67a4a31abdde1ef340db1.jpeg",
			order: 5,
		},
	],
	stops: [
		{
			description:
				"Picture Dave and Buster's with a futuristic flair — that's Two Bit Circus! Get ready for an exclusive group date night packed with high-tech arcade games, mind-blowing virtual reality experiences, and delicious bites. It's the perfect date spot for an unforgettable evening filled with excitement and fun.",
			estimatedTime: 180,
			order: 1,
			location: {
				name: "Two Bit Circus",
				website: "https://twobitcircus.com/",
				address: {
					street: "634 Mateo St",
					city: "Los Angeles",
					postalCode: "90021",
					coordinates: {
						lat: 34.03726345961291,
						lng: -118.23194778808752,
					},
				},
				images: [
					"https://s7d2.scene7.com/is/image/TWCNews/two_bit_circus_losangelesartsdistrictcourtesytwobitcircus_04132022",
					"https://twobitcircus.com/wp-content/uploads/2023/04/Two-Bit-Dallas-About-2.png",
				],
			},
		},
	],
}

export async function main() {
	// create locations
	const locations: Location[] = []
	for (const stop of groupDate.stops) {
		// create or connect location
		// get addressId
		// get city id
		const city = await prisma.city.findFirst({
			where: {
				name: stop.location.address.city,
			},
		})
		if (!city) {
			throw new Error("City not found")
		}
		const address = await prisma.address.upsert({
			where: {
				street_postalCode_cityId: {
					street: stop.location.address.street,
					cityId: city.id,
					postalCode: stop.location.address.postalCode,
				},
			},
			update: {},
			create: {
				street: stop.location.address.street,
				cityId: city.id,
				postalCode: stop.location.address.postalCode,
				coordinates: {
					create: {
						lat: stop.location.address.coordinates.lat,
						lng: stop.location.address.coordinates.lng,
					},
				},
			},
		})
		const location = await prisma.location.upsert({
			where: {
				name_addressId: {
					name: stop.location.name,
					addressId: address.id,
				},
			},
			update: {},
			create: {
				name: stop.location.name,
				addressId: address.id,
				website: stop.location.website,
				images: {
					set: stop.location.images,
				},
			},
		})
		locations.push(location)
	}
	// get user
	const user = await prisma.user.findUnique({
		where: {
			email: groupDate.userEmail,
		},
		include: {
			tastemaker: true,
		},
	})
	if (!user) {
		throw new Error("User not found")
	}
	// create group date
	const createdGroupDate = await prisma.groupDate.create({
		data: {
			title: groupDate.title,
			numSpots: groupDate.numSpots,
			description: groupDate.description,
			image: groupDate.image,
			minimumPrice: groupDate.minimumPrice,
			maximumPrice: groupDate.maximumPrice,
			tastemakerId: user.tastemaker?.id as string,
			addOns: {
				create: groupDate.addOns,
			},
			products: {
				create: groupDate.products,
			},
			stops: {
				create: groupDate.stops.map((stop) => {
					return {
						locationId: locations.find(
							(location) => location.name === stop.location.name,
						)?.id as string,
						description: stop.description,
						estimatedTime: stop.estimatedTime,
						order: stop.order,
					}
				}),
			},
		},
	})
	console.log("createdGroupDate", createdGroupDate)
}

main()
	.catch(console.error)
	.finally(() => {
		prisma.$disconnect()
		console.log("done")
	})

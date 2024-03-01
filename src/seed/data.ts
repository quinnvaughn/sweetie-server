import {
	Address,
	Country,
	DateStopOption,
	FreeDate,
	GroupDate,
	GroupDateAddOn,
	GroupDateOrderedStop,
	GroupDateProduct,
	Location,
	OrderedDateStop,
	Role,
	State,
	Tastemaker,
} from "@prisma/client"
// import { DateTime } from "luxon"
import { encryptPassword } from "../lib"

export const laCities = [
	"Los Angeles",
	"Santa Monica",
	"Irvine",
	"Beverly Hills",
	"Lucerne Valley",
	"Pasadena",
	"Newport Beach",
	"West Hollywood",
	"Culver City",
	"El Segundo",
	"Venice",
	"Torrance",
	"Costa Mesa",
	"Burbank",
	"Santa Ana",
	"Aliso Viejo",
	"Woodland Hills",
	"Long Beach",
	"Anaheim",
	"Westlake Village",
	"Glendale",
	"Manhattan Beach",
	"Marina Del Rey",
	"Sherman Oaks",
	"Encino",
	"Huntington Beach",
	"Orange",
	"Van Nuys",
	"Lake Forest",
	"San Clemente",
	"Chatsworth",
	"Riverside",
	"Valencia",
	"Calabasas",
	"Walnut",
	"Agoura Hills",
	"Redondo Beach",
	"Tustin",
	"Laguna Hills",
	"Thousand Oaks",
	"Temecula",
	"Fountain Valley",
	"Mission Viejo",
	"Malibu",
	"Studio City",
	"North Hollywood",
	"Laguna Beach",
	"Ventura",
	"Fullerton",
	"Hermosa Beach",
	"Murrieta",
	"Corona",
	"Pomona",
	"San Juan Capistrano",
	"Rancho Santa Margarita",
	"Rancho Cucamonga",
	"Monrovia",
	"Gardena",
	"Simi Valley",
	"Camarillo",
	"Oxnard",
	"Brea",
	"Garden Grove",
	"Palm Springs",
	"Whittier",
	"Monterey Park",
	"Cerritos",
	"Palm Desert",
	"City Of Industry",
	"San Bernardino",
	"Tarzana",
	"Buena Park",
	"Northridge",
	"Pacific Palisades",
	"La Canada Flintridge",
	"Canoga Park",
	"Ontario",
	"Diamond Bar",
	"West Covina",
	"Laguna Niguel",
	"Foothill Ranch",
	"Playa Vista",
	"La Mirada",
	"Santa Clarita",
	"Claremont",
	"Alhambra",
	"Lancaster",
	"Yorba Linda",
	"Redlands",
	"Westminster",
	"Toluca Lake",
	"Hawthorne",
	"Carson",
	"Ladera Ranch",
	"Newbury Park",
	"Rancho Palos Verdes",
	"Sylmar",
	"South Pasadena",
	"Inglewood",
	"Arcadia",
	"Azusa",
	"Glendora",
	"Moreno Valley",
	"Moorpark",
	"Cypress",
	"Dana Point",
	"El Monte",
	"Reseda",
	"Altadena",
	"Palmdale",
	"Santa Fe Springs",
	"Chino",
	"San Dimas",
	"Panorama City",
	"Rancho Dominguez",
	"Commerce",
	"Fontana",
	"Seal Beach",
	"Granada Hills",
	"Sun Valley",
	"Playa Del Rey",
	"Canyon Country",
	"Rosemead",
	"Universal City",
	"Century City",
	"Covina",
	"Upland",
	"Chino Hills",
	"Victorville",
	"Signal Hill",
	"Tujunga",
	"West Hills",
	"Artesia",
	"Placentia",
	"Palos Verdes Estates",
	"Lakewood",
	"San Fernando",
	"Norwalk",
	"Lomita",
	"South El Monte",
	"Compton",
	"Temple City",
	"Baldwin Park",
	"West Los Angeles",
	"Valley Village",
	"San Pedro",
	"Bellflower",
	"La Puente",
	"La Crescenta",
	"Huntington Park",
	"Montebello",
	"Rowland Heights",
	"Colton",
	"Wildomar",
	"Lake Elsinore",
	"Yucca Valley",
	"La Habra",
	"Sunland",
	"Mission Hills",
	"South Gate",
	"Downey",
	"Rolling Hills Estates",
	"Wilmington",
	"San Marino",
	"San Gabriel",
	"Lynwood",
	"Barstow",
	"Yucaipa",
	"Norco",
	"Newport Coast",
	"Cathedral City",
	"La Quinta",
	"Desert Hot Springs",
	"Rancho Mirage",
	"Ojai",
	"Pacoima",
	"North Hills",
	"Oak Park",
	"Stanton",
	"La Palma",
	"Maywood",
	"Duarte",
	"Paramount",
	"Pico Rivera",
	"Stevenson Ranch",
	"Menifee",
	"Hesperia",
	"Montclair",
	"Loma Linda",
	"Apple Valley",
	"Grand Terrace",
	"Beaumont",
	"Trabuco Canyon",
	"Laguna Woods",
	"Indio",
	"Hemet",
	"San Jacinto",
	"Santa Paula",
	"Acton",
	"Harbor City",
	"Joshua Tree",
	"Mountain Pass",
	"Villa Park",
	"Blythe",
	"Adelanto",
	"Bell Gardens",
	"Newhall",
	"Montrose",
	"Palos Verdes Peninsula",
	"Topanga",
	"Lawndale",
	"Highland",
	"Mira Loma",
	"Lake Arrowhead",
	"La Verne",
	"Sun City",
	"Hacienda Heights",
	"Rialto",
	"Los Alamitos",
	"Idyllwild",
	"Indian Wells",
	"Coachella",
	"Banning",
	"Midway City",
	"Sierra Madre",
	"Thermal",
	"Port Hueneme Cbc Base",
	"Sunset Beach",
	"Silverado",
	"Avalon",
	"Castaic",
	"East Los Angeles",
	"Bell",
	"Bloomington",
	"Bryn Mawr",
	"Helendale",
	"Baker",
	"Mentone",
	"Big Bear City",
	"Patton",
	"Guasti",
	"Big Bear Lake",
	"Perris",
	"Calimesa",
	"Hawaiian Gardens",
	"Capistrano Beach",
	"Twentynine Palms",
	"Thousand Palms",
	"Cabazon",
	"Fillmore",
	"Port Hueneme",
	"Ludlow",
	"Running Springs",
	"Lytle Creek",
	"North Long Beach",
	"Oro Grande",
	"Nuevo",
	"Landers",
	"Phelan",
	"Parker Dam",
	"Winnetka",
	"Rimforest",
	"Newberry Springs",
	"Verdugo City",
	"Pioneertown",
	"Crestline",
	"Blue Jay",
	"March Air Reserve Base",
	"Valyermo",
	"Morongo Valley",
	"Trona",
	"Charter Oak",
	"Somis",
	"Mount Wilson",
	"Point Mugu Nawc",
	"Forest Falls",
	"Littlerock",
	"Anza",
	"Mecca",
	"Winchester",
	"Amboy",
	"Crest Park",
	"Wrightwood",
	"Piru",
	"Atwood",
	"Cedar Glen",
	"El Toro",
	"Fort Irwin",
	"Angelus Oaks",
	"Skyforest",
	"Vidal",
	"Cedarpines Park",
	"Rolling Hills",
	"Oak View",
	"Mountain Center",
	"Earp",
	"Hinkley",
	"Surfside",
	"Fawnskin",
	"Yermo",
	"Aguanga",
	"North Palm Springs",
	"Daggett",
	"Green Valley Lake",
	"Pearblossom",
	"Twin Peaks",
	"Sugarloaf",
	"Llano",
	"Nipton",
	"East Irvine",
	"Desert Center",
	"Lake Hughes",
	"Brandeis",
	"Homeland",
	"Needles",
] as const

export const state: Pick<State, "name" | "initials"> = {
	name: "California",
	initials: "CA",
}

export const roles: Pick<Role, "name">[] = [
	{
		name: "user",
	},
	{ name: "admin" },
]

export const country: Pick<Country, "name" | "initials"> = {
	name: "United States of America",
	initials: "USA",
}

const users = [
	{
		name: "John Doe",
		username: "johndoe",
		email: "johndoe@gmail.com",
		password: "password",
		role: "admin",
	},
	{
		name: "Jane Doe",
		username: "janedoe",
		email: "janedoe@gmail.com",
		password: "password",
		role: "user",
	},
] as const

export const freeDate: Pick<FreeDate, "title" | "description" | "thumbnail"> & {
	tags: string[]
} = {
	thumbnail:
		"https://exploremarinadelrey.com/wp-content/uploads/2022/05/3b59ee_931951180dad4a4b8883a3838fc1b71f_mv2.jpg",
	title: "Bikes and Brunch in the Marina",
	description:
		'Not into meeting people in a dark and smoky bar? That\'s okay! This date is especially for morning people, outdoorsy people...and fans of "Arrested Development".',
	tags: ["arrested development", "pop culture", "beach", "coastal", "active"],
}

export const orderedDateStops: Pick<
	OrderedDateStop,
	"estimatedTime" | "optional" | "order"
>[] = [
	{
		estimatedTime: 60,
		optional: false,
		order: 1,
	},
	{
		estimatedTime: 120,
		optional: false,
		order: 2,
	},
]

type DateStopOptions = Pick<
	DateStopOption,
	"title" | "content" | "optionOrder"
> & { order: number; locationId: number }

export const dateStopOptions: DateStopOptions[] = [
	{
		order: 1,
		title: "Fisherman's Village",
		locationId: 1,
		content:
			"Meet at Fisherman's Village near the lighthouse. (AD fans might be lucky enough to spot the Marina Hornblower from the pilot episode. Resist the urge to ask employees where the banana stand went.)",
		optionOrder: 1,
	},
	{
		order: 1,
		title: "Bike the Marina",
		locationId: 2,
		content:
			"Walk to Daniel's Bicycle Rentals, rent bikes, and explore the Marina on two wheels. Follow Fiji Way south and you'll have your pick of the Marvin Braude or Ballona Creek bike paths. (AD fans, please resist the urge to tow a pilfered office chair behind you - this isn't a closed set.)",
		optionOrder: 2,
	},
	{
		order: 2,
		title: "Brunch with a View",
		locationId: 3,
		content:
			"Whiskey Red does brunch on both Saturdays and Sundays (10-3), featuring seafood, brunch items (including a unique orange-cinnamon waffle with whipped maple cream), and even cocktails if you like your brunch boozy. (AD fans, pretend you're at Skip Church's Bistro. Do not order the Skip's Scramble - it's not real - but they do have omelets, and that's close enough.)\n\nThis is a popular waterfront restaurant; reservations are a good idea. Go easy on the booze; alcohol and the ocean are not the wisest combination.",
		optionOrder: 1,
	},
	{
		order: 2,
		title: "Out on the Water",
		locationId: 4,
		content:
			"Sure, you COULD charter a yacht in the Marina, but it's VERY expensive. Marina del Rey Boat Rentals offers paddleboard, kayak, jet ski, and smaller boat rentals that won't set you back four figures. (Relax, AD fans - the SEC doesn't really have boats.)\n\nFor safety's sake, be sure to rent something you know how to use.",
		optionOrder: 2,
	},
]

export const locations: (Pick<Location, "name" | "website"> & {
	coordinates: { lat: number; lng: number }
	id: number
})[] = [
	{
		id: 1,
		name: "Fisherman's Village",
		website: "https://exploremarinadelrey.com/fishermans-village/",
		coordinates: {
			lat: 33.9725636,
			lng: -118.4462452,
		},
	},
	{
		id: 2,
		name: "Daniel's Bicycle Rentals",
		website: "http://danielsbikerentals.com",
		coordinates: {
			lat: 33.9725019,
			lng: -118.4462698,
		},
	},
	{
		id: 3,
		name: "Whiskey Red's",
		website: "https://www.whiskeyreds.com",
		coordinates: {
			lat: 33.9712783,
			lng: -118.4461755,
		},
	},
	{
		id: 4,
		name: "Marina del Rey Boat Rentals",
		website: "https://marinadelreyboatrentals.com/rentals",
		coordinates: {
			lat: 33.973408,
			lng: -118.4466249,
		},
	},
]

export const addresses: (Pick<Address, "street" | "postalCode"> & {
	city: string
	id: number
})[] = [
	{
		id: 1,
		street: "13755 Fiji Way",
		city: "Marina Del Rey",
		postalCode: "90292",
	},
	{
		id: 2,
		street: "13737 Fiji Way",
		city: "Marina Del Rey",
		postalCode: "90292",
	},
	{
		id: 3,
		street: "13813 Fiji Way",
		city: "Marina Del Rey",
		postalCode: "90292",
	},
	{
		id: 4,
		street: "13717 Fiji Way",
		city: "Marina Del Rey",
		postalCode: "90292",
	},
]

export async function getUsers() {
	return await Promise.all(
		users.map(async (user) => ({
			...user,
			password: encryptPassword(user.password),
		})),
	)
}

type CustomOrderedStop = Omit<
	GroupDateOrderedStop,
	"groupDateId" | "id" | "createdAt" | "updatedAt" | "zenstack_guard"
>

type CustomGroupDateProduct = Omit<
	GroupDateProduct,
	"id" | "createdAt" | "updatedAt" | "zenstack_guard" | "groupDateId"
> & {}

type CustomLocation = {
	id: string
	lat: number
	lng: number
	name: string
	website: string
	images: string[]
	address: {
		street: string
		city: string
		postalCode: string
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
	locations: CustomLocation[]
}

export const groupDates: CustomGroupDate[] = [
	{
		image: "https://media.timeout.com/images/103384380/image.jpg",
		title: "Avra Appetites to Silver Screen Sensations to Sixty Sunset Soiree",
		description:
			"Indulge in a trifecta of sophistication starting at Avra Beverly Hills, where the tantalizing flavors of Mediterranean cuisine set the tone for a delectable evening. Move on to the Rodeo Screening Room for a cinematic rendezvous, where you'll be captivated by the magic of the silver screen. Conclude your night at Sixty Beverly Hills, savoring the skyline views and luxurious ambiance, making memories that shimmer under the starlit sky.",
		stops: [
			{
				estimatedTime: 120,
				order: 1,
				description:
					"On our first stop on the date, we immerse ourselves in the sophisticated Mediterranean cuisine and upscale ambiance of Avra in Beverly Hills, renowned for its fresh seafood and romantic setting.",
				locationId: "1",
			},
			{
				estimatedTime: 120,
				locationId: "2",
				description:
					"On our second stop on the date, we revel in the exclusivity and luxury of the Rodeo Screening Room in Beverly Hills, where we enjoy a private screening in a glamorous Hollywood setting, adding cinematic charm to our evening.",
				order: 2,
			},
			{
				estimatedTime: 120,
				locationId: "3",
				description:
					"On our third stop of the date, we ascend to the rooftop bar on Sixty in Beverly Hills, immersing ourselves in breathtaking views and trendy vibes, sipping cocktails under the starlit sky, enhancing the romance of our evening.",
				order: 3,
			},
		],
		startDate: new Date("2024-03-24T01:00:00.000Z"),
		lastSignupDate: new Date("2024-03-16T00:00:00.000Z"),
		numSpots: 15,
		minimumPrice: 80000,
		maximumPrice: 100000,
		userEmail: "johndoe@gmail.com",
		products: [
			{
				description: "Full course dinner with flowers deliverd at the end",
				image:
					"https://images.getbento.com/accounts/da2f1f700a084ca67e85889cbd06fdcf/media/images/747862022_avra_madison_menu_%C3%A2%C3%820762_-_uncropped.jpg?w=1200&fit=crop&auto=compress,format&h=600",
				name: "Dinner at Avra",
				order: 1,
			},
			{
				description: "Private screening of a classic romantic comedy",
				name: "Private Screening",
				order: 2,
				image: "https://www.studioscreenings.com/photosRodeo/1.jpg",
			},
		],
		addOns: [
			{
				description: "Champagne toast at the end of the evening",
				minimumPrice: 5000,
				maximumPrice: 10000,
				image:
					"https://midwestfragranceco.com/cdn/shop/products/MWFCWebsiteListingImage-26_1200x.png?v=1672169612",
				name: "Champagne Toast",
				order: 1,
			},
			{
				description: "Chaufered car service for the evening",
				minimumPrice: 100000,
				maximumPrice: 150000,
				image:
					"https://cf-images.us-east-1.prod.boltdns.net/v1/static/6057277741001/170c73ed-447f-4a93-9dd1-bb8a33479794/f908c49d-2483-4f10-991f-ccbdac738b3e/1280x720/match/image.jpg",
				name: "Chaufered Car Service",
				order: 2,
			},
		],
		locations: [
			{
				id: "1",
				name: "Avra",
				lat: 34.06793676058869,
				lng: -118.40015627459347,
				images: [
					"https://cdn.vox-cdn.com/thumbor/HFkhakwJbWYRKkq1m3aWQVUXN5Y=/0x0:2000x1335/1200x675/filters:focal(797x665:1117x985)/cdn.vox-cdn.com/uploads/chorus_image/image/59521309/avradiningroom.0.jpg",
					"https://images.otstatic.com/prod/26094068/0/huge.jpg",
				],
				website: "http://theavragroup.com/",
				address: {
					street: "233 N Beverly Dr",
					city: "Beverly Hills",
					postalCode: "90210",
				},
			},
			{
				id: "2",
				name: "Rodeo Screening Room",
				lat: 34.06590576421099,
				lng: -118.40096225925097,
				images: [
					"https://www.studioscreenings.com/photosRodeo/1.jpg",
					"https://static.giggster.com/images/location/08445827-7177-4261-a1a6-383a5b15ae5a/84e16c81-e19a-48c4-a961-92068d875119/full_hd_retina.jpeg",
				],
				website: "http://www.studioscreenings.com/",
				address: {
					street: "150 South Rodeo Drive",
					city: "Beverly Hills",
					postalCode: "90212",
				},
			},
			{
				id: "3",
				lat: 34.06692667478083,
				lng: -118.39612230342912,
				name: "Sixty Beverly Hills",
				images: [
					"https://cf.bstatic.com/xdata/images/hotel/max1024x768/366266694.jpg?k=409f31f313df7b13f9b08b87290272e8dd21b155a23aa9c4a8c180b8e5c73f42&o=&hp=1",
					"https://www.oyster.com/wp-content/uploads/sites/35/2019/05/pool-v9308799-1440-1024x683.jpg",
				],
				website: "https://www.sixtyhotels.com/sixtybeverlyhills/",
				address: {
					street: "9360 Wilshire Blvd",
					city: "Beverly Hills",
					postalCode: "90212",
				},
			},
		],
	},
]

// export const customDateStatuses = [
// 	"accepted",
// 	"declined",
// 	"expired",
// 	"cancelled",
// 	"requested",
// ] as const

// export const customDates: (Pick<
// 	CustomDate,
// 	| "beginsAt"
// 	| "cost"
// 	| "lastMessageSentAt"
// 	| "notes"
// 	| "priceRangeMax"
// 	| "priceRangeMin"
// 	| "numStops"
// 	| "respondedAt"
// > & {
// 	requestor: string
// 	tastemaker: string
// 	status: (typeof customDateStatuses)[number]
// 	tags: string[]
// })[] = [
// 	{
// 		beginsAt: DateTime.now().plus({ days: 1 }).toJSDate(),
// 		cost: 4500, // $45.00
// 		lastMessageSentAt: DateTime.now().toJSDate(),
// 		notes: "This is a note.",
// 		priceRangeMax: 5000, // $50.00
// 		priceRangeMin: 4000, // $40.00
// 		requestor: users[1]?.email as string,
// 		tastemaker: users[0]?.email as string,
// 		status: "accepted",
// 		numStops: 3,
// 		tags: ["arrested development", "active", "outdoors", "boating"],
// 		respondedAt: DateTime.now().toJSDate(),
// 	},
// ]

export const tastemakers: (Pick<
	Tastemaker,
	"isPartiallySetup" | "isSetup" | "maxNumStops" | "minNumStops" | "price"
> & {
	doesNotDo: {
		cities: (typeof laCities)[number][]
		tags: string[]
	}
	specializesIn: {
		cities: (typeof laCities)[number][]
		tags: string[]
	}
	user: (typeof users)[number]["email"]
})[] = [
	{
		doesNotDo: {
			cities: ["Los Angeles", "Santa Monica"],
			tags: ["active", "artsy"],
		},
		specializesIn: {
			cities: ["Agoura Hills", "Alhambra"],
			tags: ["lunches", "special events"],
		},
		isPartiallySetup: true,
		isSetup: true,
		maxNumStops: 5,
		minNumStops: 3,
		price: 1500, // $15.00,
		user: "johndoe@gmail.com",
	},
]

// export const customDateSuggestionStatuses = [
// 	"accepted",
// 	"suggested",
// 	"changes requested",
// ] as const

// export const customDateRefundStatuses = [
// 	"requested",
// 	"refunded",
// 	"denied",
// ] as const

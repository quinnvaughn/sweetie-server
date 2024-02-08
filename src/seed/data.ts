import {
	Address,
	Country,
	DateStopOption,
	FreeDate,
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

export const customDateStatuses = [
	"accepted",
	"declined",
	"expired",
	"cancelled",
	"requested",
] as const

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

export const customDateSuggestionStatuses = [
	"accepted",
	"suggested",
	"changes requested",
] as const

export const customDateRefundStatuses = [
	"requested",
	"refunded",
	"denied",
] as const

import SchemaBuilder from "@pothos/core"
import ErrorsPlugin from "@pothos/plugin-errors"
import {
	Address,
	CategorizedDateList,
	City,
	Coordinates,
	Country,
	// CustomDate,
	// CustomDateMessage,
	// CustomDateRefund,
	// CustomDateRefundStatus,
	// CustomDateStatus,
	// CustomDateSuggestion,
	// CustomDateSuggestionStatus,
	// CustomDateSuggestionStop,
	// CustomDateSuggestionStopRequestedChange,
	DateStop,
	DateStopDraft,
	DateSuggestion,
	DefaultGuest,
	Favorite,
	FreeDate,
	FreeDateDraft,
	FreeDateViews,
	Location,
	PlannedDate,
	Role,
	SpecialOffer,
	State,
	Tag,
	Tastemaker,
	TastemakerPreference,
	Travel,
	TravelMode,
	User,
	UserProfile,
} from "@prisma/client"
import { DateResolver, DateTimeResolver, JSONResolver } from "graphql-scalars"
import { Context } from "./context"

type Objects = {
	Coordinates: Coordinates
	User: User
	Role: Role
	Address: Address
	Location: Location
	FreeDate: FreeDate
	DateStop: DateStop
	DefaultGuest: DefaultGuest
	City: City
	State: State
	Country: Country
	PlannedDate: PlannedDate
	FreeDateDraft: FreeDateDraft
	CategorizedDateList: CategorizedDateList
	Favorite: Favorite
	DateStopDraft: DateStopDraft
	UserProfile: UserProfile
	DateSuggestion: DateSuggestion
	FreeDateViews: FreeDateViews
	// CustomDate: CustomDate
	// CustomDateStatus: CustomDateStatus
	Tastemaker: Tastemaker
	Tag: Tag
	Travel: Travel
	TravelMode: TravelMode
	TastemakerPreference: TastemakerPreference
	// CustomDateSuggestion: CustomDateSuggestion
	// CustomDateSuggestionStatus: CustomDateSuggestionStatus
	// CustomDateSuggestionStop: CustomDateSuggestionStop
	// CustomDateMessage: CustomDateMessage
	// CustomDateRefund: CustomDateRefund
	// CustomDateRefundStatus: CustomDateRefundStatus
	// CustomDateSuggestionStopRequestedChange: CustomDateSuggestionStopRequestedChange
	SpecialOffer: SpecialOffer
}

export type TypesWithDefaults = PothosSchemaTypes.ExtendDefaultTypes<{
	Context: Context
	Objects: Objects
	Scalars: {
		JSON: {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			Input: any
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			Output: any
		}
		Date: {
			Input: Date
			Output: Date
		}
		DateTime: {
			Input: Date
			Output: Date
		}
	}
}>

export const builder = new SchemaBuilder<TypesWithDefaults>({
	plugins: [ErrorsPlugin],
	errorOptions: {
		defaultTypes: [Error],
		directResult: true,
		defaultResultOptions: {
			name: ({ fieldName }) => `${fieldName}Result`,
		},
		defaultUnionOptions: {
			name: ({ fieldName }) => `${fieldName}Payload`,
		},
	},
})

builder.addScalarType("DateTime", DateTimeResolver, {})
builder.addScalarType("Date", DateResolver, {})
builder.addScalarType("JSON", JSONResolver, {})
builder.mutationType()
builder.queryType()
builder.subscriptionType()

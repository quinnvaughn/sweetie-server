import { Context } from "./context"
import SchemaBuilder from "@pothos/core"
import ErrorsPlugin from "@pothos/plugin-errors"
import {
	Address,
	City,
	Country,
	CustomDate,
	CustomDateMessage,
	CustomDateRefund,
	CustomDateRefundStatus,
	CustomDateStatus,
	CustomDateSuggestion,
	CustomDateSuggestionStatus,
	CustomDateSuggestionStop,
	CustomDateSuggestionStopRequestedChange,
	DateExperience,
	DateExperienceDraft,
	DateExperienceViews,
	DateStop,
	DateStopDraft,
	DateSuggestion,
	Location,
	PlannedDate,
	Role,
	State,
	Tag,
	Tastemaker,
	TastemakerPreference,
	TimeOfDay,
	User,
	UserProfile,
} from "@prisma/client"
import { DateResolver, DateTimeResolver } from "graphql-scalars"

type Objects = {
	User: User
	Role: Role
	Address: Address
	Location: Location
	DateExperience: DateExperience
	DateStop: DateStop
	City: City
	State: State
	Country: Country
	PlannedDate: PlannedDate
	TimeOfDay: TimeOfDay
	DateExperienceDraft: DateExperienceDraft
	DateStopDraft: DateStopDraft
	UserProfile: UserProfile
	DateSuggestion: DateSuggestion
	DateExperienceViews: DateExperienceViews
	CustomDate: CustomDate
	CustomDateStatus: CustomDateStatus
	Tastemaker: Tastemaker
	Tag: Tag
	TastemakerPreference: TastemakerPreference
	CustomDateSuggestion: CustomDateSuggestion
	CustomDateSuggestionStatus: CustomDateSuggestionStatus
	CustomDateSuggestionStop: CustomDateSuggestionStop
	CustomDateMessage: CustomDateMessage
	CustomDateRefund: CustomDateRefund
	CustomDateRefundStatus: CustomDateRefundStatus
	CustomDateSuggestionStopRequestedChange: CustomDateSuggestionStopRequestedChange
}

export type TypesWithDefaults = PothosSchemaTypes.ExtendDefaultTypes<{
	Context: Context
	Objects: Objects
	Scalars: {
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
builder.mutationType()
builder.queryType()
builder.subscriptionType()

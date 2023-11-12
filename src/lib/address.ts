import { Address, City, State } from ".prisma/client"

type AddressName = Pick<Address, "street" | "postalCode"> & {
	state: Pick<State, "initials">
} & {
	city: Pick<City, "name">
}

export function formatAddress(address: AddressName) {
	return `${address.street}, ${address.city.name}, ${address.state.initials}, ${address.postalCode}`
}

export type User = {
    _id: string,
    email: string,
    friendIds: { id: string, name: string }[]
}

export type NewUserRequest = Omit<User, '_id'> & { password: string }
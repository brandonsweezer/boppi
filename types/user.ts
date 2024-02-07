export type User = {
    _id: string,
    email: string,
    friendIds: string[]
}

export type NewUserRequest = Omit<User, '_id'> & { password: string }
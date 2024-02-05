export type User = {
    _id: string,
    email: string,
}

export type NewUserRequest = Omit<User, '_id'> & { password: string }
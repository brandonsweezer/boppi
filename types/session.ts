export type Session = {
    _id: string,
    title: string,
    views: number,
    users: string[]
    startTime: Date,
    endTime?: Date,
}

export type CreateSessionRequest = {
    title: string,
    user: string
}
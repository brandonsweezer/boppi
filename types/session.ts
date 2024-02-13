export type Session = {
    _id: string,
    title: string,
    views: number,
    hostId: string, // userId
    startTime: Date,
    endTime?: Date,
}

export type NewSessionRequest = {
    title: string,
    hostId: string
    startTime: Date
}
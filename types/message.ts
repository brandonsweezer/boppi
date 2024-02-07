export type Message = {
    _id: string,
    date: Date,
    fromId: string,
    toId: string,
    type: MessageType,
    seen: boolean,
    content: string,
}

export type NewMessageRequest = Omit<Message, '_id' | 'seen'>

export enum MessageType {
    FriendRequest,
    Invite,
    Chat,
}
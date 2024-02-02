import { User } from "@/types/user";

const jwt = require('jsonwebtoken');

export default function issueToken(user: User) {
    const token = jwt.sign(user,
        process.env.JWT_PRIVATE,
    {
        algorithm: 'HS256',
        expiresIn: 60 * 60 // 1hr
    })
    return token;
}
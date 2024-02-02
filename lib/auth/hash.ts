const crypto = require('crypto');

export default function hash(str: string): string {
    // sha256 because we never want to decrypt passwords.
    const hashAlgo = crypto.createHash('sha256', process.env.ENCRYPTION_KEY);
    hashAlgo.update(str);

    const hash = hashAlgo.digest('hex');
    return hash;
}
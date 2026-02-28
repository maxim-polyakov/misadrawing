const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Users = require('../db/schema.ts');
const db = require('../db/index.ts');
const { eq } = require('drizzle-orm');

/**
 * Формирует username из данных Google:
 * - Если есть given_name и family_name (2 слова) → "first_name last_name"
 * - Иначе → только given_name (или family_name если given_name пустой)
 */
function getUsernameFromGoogleProfile(profile) {
    const givenName = profile.name?.givenName?.trim() || '';
    const familyName = profile.name?.familyName?.trim() || '';
    if (givenName && familyName) {
        return `${givenName} ${familyName}`;
    }
    return givenName || familyName || 'User';
}

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || `${process.env.API_URL || 'http://localhost:5000'}/api/user/auth/google/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value;
                if (!email) {
                    return done(null, false, { message: 'Email не получен от Google' });
                }

                const existingUsers = await db.db
                    .select()
                    .from(Users.users)
                    .where(eq(Users.users.email, email));

                let user;
                if (existingUsers.length > 0) {
                    user = existingUsers[0];
                } else {
                    const username = getUsernameFromGoogleProfile(profile);
                    const [inserted] = await db.db
                        .insert(Users.users)
                        .values({
                            email,
                            username,
                            password: null,
                            role: 'USER',
                        })
                        .returning();
                    user = inserted;
                }
                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);

module.exports = passport;

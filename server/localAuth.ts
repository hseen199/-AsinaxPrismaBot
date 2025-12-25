import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

export function setupLocalAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  
  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Serialize/deserialize user
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || null);
    } catch (error) {
      done(error, null);
    }
  });

  // Setup Google OAuth if credentials are available
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const callbackURL = process.env.REPLIT_DEPLOYMENT 
      ? `https://${process.env.REPLIT_DEPLOYMENT_URL}/api/auth/google/callback`
      : `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/auth/google/callback`;

    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if user exists with this Google ID
            let user = await storage.getUserByGoogleId(profile.id);
            
            if (!user) {
              // Check if user exists with this email
              const email = profile.emails?.[0]?.value;
              if (email) {
                const existingUser = await storage.getUserByEmail(email);
                if (existingUser) {
                  // Link Google account to existing user - only update googleId and optionally profile image
                  // Keep all other user data intact (including password credentials)
                  const googleProfileImage = profile.photos?.[0]?.value;
                  user = await storage.linkGoogleToUser(
                    existingUser.id,
                    profile.id,
                    googleProfileImage || undefined
                  );
                }
              }
            }
            
            if (!user) {
              // Create new user - let database generate ID
              const email = profile.emails?.[0]?.value;
              user = await storage.createUserFromGoogle({
                email: email || null,
                firstName: profile.name?.givenName || profile.displayName?.split(' ')[0] || null,
                lastName: profile.name?.familyName || null,
                profileImageUrl: profile.photos?.[0]?.value || null,
                googleId: profile.id,
                role: "user",
              });
            }
            
            done(null, user);
          } catch (error) {
            done(error as Error, undefined);
          }
        }
      )
    );

    // Google OAuth routes
    app.get(
      "/api/auth/google",
      passport.authenticate("google", { scope: ["profile", "email"] })
    );

    app.get(
      "/api/auth/google/callback",
      passport.authenticate("google", { failureRedirect: "/login?error=google_auth_failed" }),
      (req: any, res) => {
        // Set session userId for consistency with email/password auth
        req.session.userId = req.user?.id;
        res.redirect("/");
      }
    );
  }
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const userId = (req as any).session?.userId || (req as any).user?.id;
  
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  (req as any).userId = userId;
  return next();
};

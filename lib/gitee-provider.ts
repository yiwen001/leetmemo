import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers/oauth"

export interface GiteeProfile extends Record<string, any> {
  id: number
  login: string
  name: string
  avatar_url: string
  email: string
  bio: string
  blog: string
  company: string
  location: string
  public_repos: number
  followers: number
  following: number
  created_at: string
  updated_at: string
}

export default function GiteeProvider<P extends GiteeProfile>(
  options: OAuthUserConfig<P>
): OAuthConfig<P> {
  return {
    id: "gitee",
    name: "Gitee",
    type: "oauth",
    authorization: {
      url: "https://gitee.com/oauth/authorize",
      params: {
        scope: "user_info",
        response_type: "code",
      },
    },
    token: "https://gitee.com/oauth/token",
    userinfo: {
      url: "https://gitee.com/api/v5/user",
      async request({ tokens, provider }) {
        const profile = await fetch(
          `https://gitee.com/api/v5/user?access_token=${tokens.access_token}`
        ).then(async (res) => await res.json())
        return profile
      },
    },
    profile(profile) {
      return {
        id: profile.id.toString(),
        name: profile.name || profile.login,
        email: profile.email,
        image: profile.avatar_url,
      }
    },
    style: {
      logo: "/gitee.svg",
      bg: "#C71D23",
      text: "#fff",
    },
    options,
  }
}
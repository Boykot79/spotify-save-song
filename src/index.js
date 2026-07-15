var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
var index_default = {
  async fetch(request, env) {
    const authHeader = request.headers.get("X-App-Token");
    if (authHeader !== env.APP_TOKEN) {
      return json({ error: "unauthorized" }, 401);
    }
    try {
      const accessToken = await refreshAccessToken(env);
      const current = await getCurrentlyPlaying(accessToken);
      if (!current) {
        return json({ error: "nothing_playing", message: "Nic nie leci" }, 200);
      }
      if (current.type !== "track") {
        return json({ error: "not_a_track", message: "Leci podcast, nie utw\xF3r" }, 200);
      }
      await saveToLibrary(accessToken, current.uri);
      return json({
        saved: true,
        title: current.title,
        artist: current.artist
      });
    } catch (e) {
      return json({ error: "server_error", message: e.message }, 500);
    }
  }
};
async function refreshAccessToken(env) {
  const auth = btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`);
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: `grant_type=refresh_token&refresh_token=${env.SPOTIFY_REFRESH_TOKEN}`
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}
__name(refreshAccessToken, "refreshAccessToken");
async function getCurrentlyPlaying(accessToken) {
  const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
    headers: { "Authorization": `Bearer ${accessToken}` }
  });
  if (res.status === 204) return null;
  if (!res.ok) throw new Error(`Currently playing failed: ${res.status}`);
  const data = await res.json();
  if (!data.item) return null;
  return {
    type: data.currently_playing_type,
    uri: data.item.uri,
    title: data.item.name,
    artist: data.item.artists?.map((a) => a.name).join(", ") || "Unknown"
  };
}
__name(getCurrentlyPlaying, "getCurrentlyPlaying");
async function saveToLibrary(accessToken, uri) {
  const url = `https://api.spotify.com/v1/me/library?uris=${encodeURIComponent(uri)}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${accessToken}`
    }
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Save failed: ${res.status} ${errText}`);
  }
}
__name(saveToLibrary, "saveToLibrary");
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
__name(json, "json");
export {
  index_default as default
};
//# sourceMappingURL=index.js.map

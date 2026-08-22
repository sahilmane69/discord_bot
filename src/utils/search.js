const URL_PATTERN =
  /^(https?:\/\/|www\.)/i;

const HOST_PATTERN =
  /(?:youtube\.com|youtu\.be|soundcloud\.com|spotify\.com|vimeo\.com|\.mp3|\.wav|\.ogg|\.flac|\.m4a)/i;

export function isDirectPlayQuery(query) {
  const trimmed = query.trim();
  return URL_PATTERN.test(trimmed) || HOST_PATTERN.test(trimmed);
}

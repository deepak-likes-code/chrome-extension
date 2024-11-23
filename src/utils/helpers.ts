export const normalizeUrl = (url: string): string => {
    try {
      let normalizedUrl = url
        .toLowerCase()
        .replace(/^(https?:\/\/)?(www\.)?/, "")
        .replace(/\/+$/, "");
  
      normalizedUrl = normalizedUrl.split("/")[0];
      return normalizedUrl;
    } catch (error) {
      console.error("Error normalizing URL:", error);
      return url;
    }
  };
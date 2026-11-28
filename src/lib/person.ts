import { absolute, site } from "./config";

export const person = {
  "@id": absolute("/#person"),
  "@type": "Person",
  name: site.author,
  url: absolute("/about/"),
};

export const personRef = { "@id": person["@id"] };

export const personProfile = {
  ...person,
  image: site.profile.avatar ? absolute(site.profile.avatar) : undefined,
  sameAs: site.profile.links
    .filter(({ name }) => name === "GitHub" || name === "Twitter/X")
    .map(({ url }) => url),
};

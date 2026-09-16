import { getLocales } from "expo-localization";
import { pickLocale, strings as dictionary } from "./i18n";
import type { Locale } from "./i18n";

export function currentLocale(): Locale {
  return pickLocale(getLocales().map((l) => l.languageTag));
}

export function strings(): ReturnType<typeof dictionary> {
  return dictionary(currentLocale());
}

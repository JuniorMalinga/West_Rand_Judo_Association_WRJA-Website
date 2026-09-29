import { adminCrud, createRemoteCollection } from "../lib/collections";

export const newsStore = createRemoteCollection("/api/news");
export const newsAdmin = adminCrud("/api/admin/news", newsStore);

export const DEFAULT_NEWS_IMAGE = "/uploads/public/default-news.jpg";

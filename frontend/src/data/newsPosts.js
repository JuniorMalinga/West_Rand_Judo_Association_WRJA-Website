import { adminCrud, createRemoteCollection } from "../lib/collections";

export const DEFAULT_NEWS_IMAGE = "/uploads/public/default-news.jpeg";

export const newsPosts = [
  {
    id: "news-1",
    slug: "club-season-kicks-off",
    title: "Club season kicks off",
    category: "Club news",
    excerpt: "A fresh season of training, community and development starts this month.",
    body: "The club is preparing for a new season of structured classes, athlete development and community events.",
    image: DEFAULT_NEWS_IMAGE,
    date: "2026-02-01",
    source: "",
    url: "",
  },
  {
    id: "news-2",
    slug: "school-programme-expands",
    title: "School programme expands",
    category: "Club news",
    excerpt: "More schools are joining the WRJA development pathway this year.",
    body: "Our coaching team is growing its outreach in schools across the region, giving more children early access to judo.",
    image: DEFAULT_NEWS_IMAGE,
    date: "2026-01-15",
    source: "",
    url: "",
  },
  {
    id: "news-3",
    slug: "member-training-weekend",
    title: "Member training weekend",
    category: "Results",
    excerpt: "Members came together for a technical development weekend focused on kata and movement.",
    body: "The weekend programme focused on mobility, technical detail and disciplined practice with a strong community atmosphere.",
    image: DEFAULT_NEWS_IMAGE,
    date: "2025-12-12",
    source: "",
    url: "",
  },
];

export const newsStore = createRemoteCollection("/api/news");
export const newsAdmin = adminCrud("/api/admin/news", newsStore);

export default newsPosts;

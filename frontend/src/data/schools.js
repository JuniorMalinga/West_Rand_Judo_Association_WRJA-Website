import { adminCrud, createRemoteCollection } from "../lib/collections";

export const DEFAULT_SCHOOL_IMAGE = "/src/assets/images/Logo/wrja-logo.png";

export const schools = [
  {
    id: "school-1",
    slug: "sa-schools-novice",
    name: "SA Schools Novice",
    type: "Schools competition",
    description: "A novice school pathway for younger athletes developing competitive confidence.",
    date: "2026-08-15",
    location: "Johannesburg",
    image: DEFAULT_SCHOOL_IMAGE,
    displayOrder: 1,
    registrationUrl: "",
    registrationType: "external",
    paymentRequired: false,
  },
  {
    id: "school-2",
    slug: "sa-schools-advanced",
    name: "SA Schools Advanced",
    type: "Schools competition",
    description: "An advanced school pathway for athletes ready for stronger competition demands.",
    date: "2026-09-20",
    location: "Pretoria",
    image: DEFAULT_SCHOOL_IMAGE,
    displayOrder: 2,
    registrationUrl: "",
    registrationType: "external",
    paymentRequired: false,
  },
];

export const schoolsStore = createRemoteCollection("/api/schools");
schoolsStore.setItems(schools);
export const schoolsAdmin = adminCrud("/api/admin/schools", schoolsStore);

export default schools;

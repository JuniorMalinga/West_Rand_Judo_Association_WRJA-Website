// Real instructor bios supplied by the client (WRJA_WEB_DETAILS.docx).
// Photos are still placeholders until real headshots are provided.
// Import images once provided. Add the new folder in
// src/assets/images/instructors and import them here.

import michelleDiamondImage from "../assets/images/Instructors/sensei-michelle.jpg";
import katjaBruwerImage from "../assets/images/Instructors/sensei-katja.jpg";

const instructors = [
  {
    slug: "katja-bruwer",
    name: "Sensei Katja Bruwer",
    role: "Director — KJK Judo Club",
    image: katjaBruwerImage,
    excerpt: "7th Dan, former SA national team captain, IJF-qualified coach.",

    // ADDED: Instructor skills for the Skills tab
    skills: [
      { label: "Judo Technique", percentage: 95 },
      { label: "Coaching & Mentorship", percentage: 92 },
      { label: "Competition Strategy", percentage: 90 },
    ],

    social: [
      {
        label: "Facebook",
        url: "https://www.facebook.com/share/g/19C3Qq9izs/",
      },
      {
        label: "Instagram",
        url: "https://www.instagram.com/judo_kjk",
      },
    ],

    bio: [
      "Sensei Katja Bruwer is one of South Africa's most respected judo coaches and administrators. With more than four decades of experience in the sport, she has dedicated her life to the development of judo at grassroots, provincial, national, and international levels.",

      "A former South African National Team athlete and captain, Sensei Katja has represented South Africa internationally and achieved numerous accolades throughout her competitive career. She is a qualified and registered Judo South Africa coach and holds International Judo Federation coaching qualifications. In 2024, she achieved the prestigious rank of 7th Dan, making her one of the highest-ranked female judoka in South Africa.",

      "As founder and director of KJK Judo Club, Sensei Katja has developed countless athletes who have gone on to achieve success at provincial, national, African, and Commonwealth levels.",
    ],
  },

  {
    slug: "michelle-diamond",
    name: "Sensei Michelle Diamond",
    role: "Founder & Director — Golden Score Judo",
    image: michelleDiamondImage,
    excerpt:
      "3rd Dan Black Belt, Sport Psychology graduate, founder of Golden Score Judo.",

    // ADDED: Instructor skills for the Skills tab
    skills: [
      { label: "Judo Technique", percentage: 90 },
      { label: "Coaching & Mentorship", percentage: 95 },
      { label: "Athlete Development", percentage: 93 },
    ],

    social: [
      {
        label: "Facebook",
        url: "https://www.facebook.com/share/1EZG7JfbEX/",
      },
      {
        label: "Instagram",
        url: "https://www.instagram.com/goldenscorejudo",
      },
    ],

    bio: [
      "Sensei Michelle Diamond is the founder, owner, and head coach of Golden Score Judo, one of the leading judo clubs on the West Rand. With many years of coaching and athlete development experience, she has dedicated her career to growing the sport of judo and creating opportunities for young athletes to excel both on and off the mat.",

      "A 3rd Dan Black Belt and holder of a degree in Sport Psychology, Sensei Michelle has built a strong reputation for producing competitive athletes while maintaining a focus on character development, discipline, respect, and personal growth.",

      "Under her leadership, Golden Score Judo has celebrated numerous achievements, including representation at Commonwealth Championships, South African National Events, African Championships, and other major competitions.",
    ],

    quote:
      "Success in judo is not measured only by medals, but by the character, discipline, and perseverance developed along the journey.",
  },
];

export default instructors;

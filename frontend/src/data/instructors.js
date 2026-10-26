import { createRemoteCollection } from "../lib/collections";
import senseiCarien from "../assets/images/Instructors/sensei-carien.jpeg";
import senseiJean from "../assets/images/Instructors/sensei-jean.jpeg";
import senseiJohan from "../assets/images/Instructors/sensei-johan.jpeg";
import senseiKatja from "../assets/images/Instructors/sensei-katja.jpg";
import senseiMichelle from "../assets/images/Instructors/sensei-michelle.jpg";
import senseiNeil from "../assets/images/Instructors/sensei-neil.jpeg";
import senseiReece from "../assets/images/Instructors/sensei-reece.jpeg";
import senseiShasha from "../assets/images/Instructors/sensei-shasha.jpeg";
import senseiShombo from "../assets/images/Instructors/sensei-shombo.jpeg";

export const instructors = [
  {
    id: "katja-bruwer",
    slug: "katja-bruwer",
    name: "Katja Bruwer",
    role: "7th Dan | IJF Level 2 Coach | Kata Judge",
    image: senseiKatja,
    imagePosition: "center",
    excerpt: "Katja coaches across age groups and specialises in both kumite and kata development.",
    bio: [
      "Katja Bruwer is a full-time coach at KJK Judo Club and holds the rank of 7th Dan.",
      "She is an IJF Level 2 Coach as well as an AJU and IJF Kata Judge, and she coaches judoka across all age groups with experience in both Kumite and Kata.",
      "Katja is also a qualified First Aider and is accredited through a Safeguarding Course, and she holds a BA Honours Degree in Industrial Psychology.",
    ],
    skills: [
      { label: "Technical coaching", percentage: 95 },
      { label: "Kata instruction", percentage: 92 },
      { label: "Athlete development", percentage: 90 },
    ],
    social: [
      { label: "Instagram", url: "https://instagram.com" },
      { label: "Facebook", url: "https://facebook.com" },
    ],
  },
  {
    id: "michelle-diamond",
    slug: "michelle-diamond",
    name: "Michelle Diamond",
    role: "Founder & Head Coach | 3rd Dan",
    image: senseiMichelle,
    imagePosition: "center top",
    excerpt: "Michelle leads the club's competitive pathway and develops athletes through discipline and confidence.",
    bio: [
      "Michelle Diamond is the founder, owner, and head coach of Golden Score Judo.",
      "She holds a 3rd Dan Black Belt and a degree in Sport Psychology, and she brings years of coaching and athlete development experience to the club.",
      "Her focus is on developing competitive athletes while also building character, discipline, respect, and personal growth.",
    ],
    skills: [
      { label: "Competition coaching", percentage: 96 },
      { label: "Character building", percentage: 94 },
      { label: "Youth development", percentage: 92 },
    ],
    social: [
      { label: "Instagram", url: "https://instagram.com" },
    ],
  },
  {
    id: "reece-hunter-erasmus",
    slug: "reece-hunter-erasmus",
    name: "Reece-Hunter Erasmus",
    role: "Coach | 3rd Dan | National Referee",
    image: senseiReece,
    imagePosition: "center",
    excerpt: "Reece focuses on progressive learning, beginner confidence, and advanced technical development.",
    bio: [
      "Reece-Hunter Erasmus is a full-time coach at KJK Judo Club and holds the rank of 3rd Dan.",
      "He is a JSA Level 2 Coach and JSA National C Referee, and he coaches judoka across all age groups with a passion for beginner development and advanced technical work.",
      "He also holds First Aid and Safeguarding accreditation.",
    ],
    skills: [
      { label: "Beginner coaching", percentage: 91 },
      { label: "Kumite coaching", percentage: 93 },
      { label: "Technical detail", percentage: 90 },
    ],
    social: [
      { label: "Instagram", url: "https://instagram.com" },
    ],
  },
  {
    id: "shasa-mercedez-erasmus",
    slug: "shasa-mercedez-erasmus",
    name: "Shasa-Mercedez Erasmus",
    role: "Coach | Provincial C Referee",
    image: senseiShasha,
    imagePosition: "center",
    excerpt: "Shasa works closely with youth judoka and supports development at school and club level.",
    bio: [
      "Shasa-Mercedez Erasmus is a full-time coach at KJK Judo Club.",
      "She is a Provincial C Referee and is currently completing the JSA Level 1 Coaching Course, while also holding First Aid and Safeguarding accreditation.",
      "She coaches young judoka at both schools and club level and helps develop the next generation of athletes.",
    ],
    skills: [
      { label: "Youth coaching", percentage: 92 },
      { label: "School programmes", percentage: 88 },
      { label: "Confidence building", percentage: 90 },
    ],
    social: [
      { label: "Instagram", url: "https://instagram.com" },
    ],
  },
  {
    id: "niel-bruwer",
    slug: "niel-bruwer",
    name: "Niel Bruwer",
    role: "Coach | 1st Dan | Nutrition & Conditioning",
    image: senseiNeil,
    imagePosition: "center top",
    excerpt: "Niel supports school and club programmes while blending technical training with wellness knowledge.",
    bio: [
      "Niel Bruwer is a part-time coach at KJK Judo Club and holds the rank of 1st Dan.",
      "He is currently completing the JSA Level 1 Coaching Course and is a Provincial C Referee.",
      "Niel is a qualified First Aider and is accredited through a Safeguarding Course, and he teaches at both schools and club level.",
    ],
    skills: [
      { label: "School coaching", percentage: 89 },
      { label: "Conditioning", percentage: 86 },
      { label: "Kata & kumite", percentage: 88 },
    ],
    social: [
      { label: "Facebook", url: "https://facebook.com" },
    ],
  },
  {
    id: "jean-kotze",
    slug: "jean-kotze",
    name: "Jean Kotze",
    role: "Assistant Coach | 1st Dan",
    image: senseiJean,
    imagePosition: "center",
    excerpt: "Jean supports club-level technical development and helps athletes grow with consistency.",
    bio: [
      "Jean Kotze is a part-time assistant coach at KJK Judo Club and holds the rank of 1st Dan.",
      "He is accredited through a Safeguarding Course and serves as a Local Technical Official.",
      "As an assistant coach, Jean supports the development of judoka at club level and brings enthusiasm to every training session.",
    ],
    skills: [
      { label: "Session support", percentage: 87 },
      { label: "Technical drills", percentage: 88 },
      { label: "Youth support", percentage: 90 },
    ],
    social: [
      { label: "Instagram", url: "https://instagram.com" },
    ],
  },
  {
    id: "carien-du-plessis",
    slug: "carien-du-plessis",
    name: "Carien du Plessis",
    role: "Head of Fitness & Conditioning | 1st Dan",
    image: senseiCarien,
    imagePosition: "center",
    excerpt: "Carien leads strength, mobility and conditioning work that supports athlete performance.",
    bio: [
      "Carien du Plessis is the Head of Fitness & Conditioning and has 14 years of judo experience.",
      "She began judo in 2012 at the age of eight and has competed at district, provincial, national, and international level.",
      "Carien holds a Sho Dan, or 1st Dan black belt, and focuses on fitness, conditioning, athlete development, commitment, perseverance, confidence, and self-belief.",
    ],
    skills: [
      { label: "Conditioning", percentage: 95 },
      { label: "Athlete performance", percentage: 93 },
      { label: "Strength & mobility", percentage: 91 },
    ],
    social: [
      { label: "Instagram", url: "https://instagram.com" },
      { label: "Facebook", url: "https://facebook.com" },
    ],
  },
  {
    id: "okende-shombo-djibril",
    slug: "okende-shombo-djibril",
    name: "Okende Shombo Djibril",
    role: "Coach PJ | Resilience & Technique Coach",
    image: senseiShombo,
    imagePosition: "center",
    excerpt: "Coach PJ brings resilience, technical focus and character-building to the mat.",
    bio: [
      "Okende Shombo Djibril, known as Coach PJ, began his judo journey at the age of eight in 2002 in Kinshasa, Democratic Republic of Congo.",
      "He returned to judo after meeting Sensei Michelle in 2020 and now focuses on helping athletes become stronger, more confident, and more successful than they thought possible.",
      "His favourite throw is Uchi Mata, and he values resilience, growth, and patient technical development.",
    ],
    skills: [
      { label: "Throw mechanics", percentage: 90 },
      { label: "Confidence building", percentage: 92 },
      { label: "Youth resilience", percentage: 91 },
    ],
    social: [
      { label: "Instagram", url: "https://instagram.com" },
    ],
  },
  {
    id: "johan-collins",
    slug: "johan-collins",
    name: "Johan Collins",
    role: "Coach | Uchi Mata Specialist",
    image: senseiJohan,
    imagePosition: "center",
    excerpt: "Johan helps young athletes build discipline, confidence and technical understanding.",
    bio: [
      "Johan Collins began his judo journey at the age of six and has 15 years of experience in the sport.",
      "His journey has been shaped by discipline, perseverance, friendship, competition, and personal growth.",
      "He values the principles of Seiryoku Zenyo and Jita Kyoei and believes judo teaches discipline, humility, resilience, self-control, respect, patience, community, and personal growth.",
    ],
    skills: [
      { label: "Movement quality", percentage: 88 },
      { label: "Uchi Mata", percentage: 94 },
      { label: "Character development", percentage: 92 },
    ],
    social: [
      { label: "Instagram", url: "https://instagram.com" },
    ],
  },
];

export const instructorsStore = createRemoteCollection("/api/instructors");
instructorsStore.setItems(instructors);

export default instructors;

// Real instructor bios supplied by the client.
// Photos are currently loaded from src/assets/images/Instructors.
// Social links are only included where they have been supplied.

import michelleDiamondImage from "../assets/images/Instructors/sensei-michelle.jpg";
import katjaBruwerImage from "../assets/images/Instructors/sensei-katja.jpg";
import ReeceHunterErasmusImage from "../assets/images/Instructors/sensei-reece.jpeg";
import ShasaMercedezErasmusImage from "../assets/images/Instructors/sensei-shasha.jpeg";
import NielBruwerImage from "../assets/images/Instructors/sensei-neil.jpeg";
import JeanKotzeImage from "../assets/images/Instructors/sensei-jean.jpeg";
import CarienduPlessisImage from "../assets/images/Instructors/sensei-carien.jpeg";
import ShomboOkendeImage from "../assets/images/Instructors/sensei-shombo.jpeg";
import JohanCollinsImage from "../assets/images/Instructors/sensei-johan.jpeg";

const instructors = [
  // 1. Founder
  {
    slug: "michelle-diamond",
    name: "Michelle Diamond",
    role: "Founder & Director — Golden Score Judo",
    image: michelleDiamondImage,
    excerpt:
      "3rd Dan Black Belt, Sport Psychology graduate, and founder of Golden Score Judo.",

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
      "Michelle Diamond is the founder, owner, and head coach of Golden Score Judo, one of the leading judo clubs on the West Rand. With many years of coaching and athlete development experience, she has dedicated her career to growing the sport of judo and creating opportunities for young athletes to excel both on and off the mat.",

      "A 3rd Dan Black Belt and holder of a degree in Sport Psychology, Michelle has built a strong reputation for producing competitive athletes while maintaining a focus on character development, discipline, respect, and personal growth.",

      "Under her leadership, Golden Score Judo has celebrated numerous achievements, including representation at Commonwealth Championships, South African National Events, African Championships, and other major competitions.",
    ],

    quote:
      "Success in judo is not measured only by medals, but by the character, discipline, and perseverance developed along the journey.",
  },

  // 2. Bruwer
  {
    slug: "katja-bruwer",
    name: "Katja Bruwer",
    role: "Full-Time Coach — KJK Judo Club",
    image: katjaBruwerImage,
    excerpt:
      "7th Dan, IJF Level 2 Coach, AJU & IJF Kata Judge, and experienced coach across all age groups.",

    skills: [
      { label: "Judo Technique", percentage: 97 },
      { label: "Coaching & Mentorship", percentage: 96 },
      { label: "Kata", percentage: 95 },
      { label: "Kumite", percentage: 95 },
      { label: "Competition & Refereeing", percentage: 94 },
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
      "Katja Bruwer is a full-time coach at KJK Judo Club and holds the rank of 7th Dan. She is an IJF Level 2 Coach as well as an AJU and IJF Kata Judge.",

      "She coaches judoka across all age groups, with experience in both Kumite and Kata. Katja is also a qualified First Aider and is accredited through a Safeguarding Course.",

      "Katja holds a BA Honours Degree in Industrial Psychology. Outside of judo, she has a strong interest in athletics, having represented Central Gauteng Athletics in Cross Country, as well as participating in road running.",
    ],

    quote:
      "Developing a judoka means developing the person as well as the athlete.",
  },

  // 3. Bruwer
  {
    slug: "niel-bruwer",
    name: "Niel Bruwer",
    role: "Part-Time Coach — KJK Judo Club",
    image: NielBruwerImage,
    imagePosition: "center top", // if a better image is provided remove this as this centres his face to the image provided!!!!
    excerpt:
      "1st Dan, Provincial C Referee, nutrition specialist, and coach at school and club level.",

    skills: [
      { label: "Judo Technique", percentage: 88 },
      { label: "Kumite", percentage: 90 },
      { label: "Kata", percentage: 88 },
      { label: "Youth Development", percentage: 87 },
      { label: "Nutrition", percentage: 95 },
    ],

    social: [],

    bio: [
      "Niel Bruwer is a part-time coach at KJK Judo Club and holds the rank of 1st Dan. He is currently completing the JSA Level 1 Coaching Course and is a Provincial C Referee.",

      "Niel is a qualified First Aider and is accredited through a Safeguarding Course. He teaches at both schools and club level and specialises in Kumite and Kata.",

      "Niel holds a BSc degree in Dietetics and a Master of Science in Nutrition. Outside of judo, he has an interest in Jujitsu.",
    ],
  },

  // 4. Erasmus
  {
    slug: "reece-hunter-erasmus",
    name: "Reece-Hunter Erasmus",
    role: "Full-Time Coach — KJK Judo Club",
    image: ReeceHunterErasmusImage,
    excerpt:
      "3rd Dan, JSA Level 2 Coach, National C Referee, and coach specialising in beginners and advanced Kumite and Kata.",

    skills: [
      { label: "Judo Technique", percentage: 92 },
      { label: "Beginner Development", percentage: 96 },
      { label: "Advanced Kumite", percentage: 93 },
      { label: "Kata", percentage: 90 },
      { label: "Competition Refereeing", percentage: 91 },
    ],

    social: [],

    bio: [
      "Reece-Hunter Erasmus is a full-time coach at KJK Judo Club and holds the rank of 3rd Dan. He is a JSA Level 2 Coach and a JSA National C Referee.",

      "Reece-Hunter coaches judoka across all age groups and specialises in developing beginners as well as advanced athletes in both Kumite and Kata. He is also a qualified First Aider and is accredited through a Safeguarding Course.",

      "He is currently studying towards a BCom Law degree. Outside of judo, Reece-Hunter has an interest in Jujitsu.",
    ],
  },

  // 5. Erasmus
  {
    slug: "shasa-mercedez-erasmus",
    name: "Shasa-Mercedez Erasmus",
    role: "Full-Time Coach — KJK Judo Club",
    image: ShasaMercedezErasmusImage,
    excerpt:
      "Provincial C Referee developing young judoka at school and club level.",

    skills: [
      { label: "Young Judoka Development", percentage: 90 },
      { label: "School-Level Coaching", percentage: 88 },
      { label: "Club Coaching", percentage: 88 },
      { label: "Judo Development", percentage: 85 },
    ],

    social: [],

    bio: [
      "Shasa-Mercedez Erasmus is a full-time coach at KJK Judo Club. She holds a First Aid qualification and is accredited through a Safeguarding Course.",

      "Shasa-Mercedez is a Provincial C Referee and is currently completing the JSA Level 1 Coaching Course.",

      "She currently coaches young judoka at both schools and club level, helping develop the next generation of athletes. Outside of judo, she has an interest in CrossFit.",
    ],
  },

  // 6. Djibril
  {
    slug: "okende-shombo-djibril",
    name: "Okende Shombo Djibril",
    role: "Coach PJ",
    image: ShomboOkendeImage,
    excerpt:
      "Coach PJ, whose judo journey began in Kinshasa and led him to coaching the next generation in South Africa.",

    skills: [
      { label: "Judo Technique", percentage: 90 },
      { label: "Athlete Development", percentage: 93 },
      { label: "Mental Resilience", percentage: 95 },
      { label: "Coaching & Mentorship", percentage: 94 },
      { label: "Personal Development", percentage: 95 },
    ],

    social: [],

    bio: [
      "Okende Shombo Djibril, known as Coach PJ, began his judo journey at the age of eight in 2002 in Township Mombele, Kinshasa, Democratic Republic of Congo. He was introduced to judo by his brother, Raoul Lodi, and his Sensei, Jossy Poison.",

      "After being forced to step away from judo at the age of 15 due to difficult circumstances in his community, Coach PJ returned to the sport after completing matric. During this period, he studied at the Institute of Gas and Oil in Kinshasa, where he earned a Bachelor's degree in Economics and Management of Oil and Gas.",

      "After moving to South Africa at the age of 23, Coach PJ initially joined a boxing club in Randgate, Randfontein. In 2020, he met Sensei Danni, who introduced him to Sensei Michelle. This connection became an important turning point in his return to judo and eventually led to his coaching journey.",

      "Coach PJ's favourite throw is Uchi Mata. For him, coaching is about helping people become stronger, more confident, and more successful than they thought possible. He sees the success of the people he coaches as part of his own journey.",

      "Coach PJ believes judo is more than a sport. It is a lifestyle that demands physical and mental focus while teaching discipline, awareness, resilience, and respect. He is also known for bringing humour and personality to his coaching.",
    ],

    quote:
      "Judo is a sport which is too demanding. It needs you to be focused physically and mentally.",
  },

  // 7. Kotze
  {
    slug: "jean-kotze",
    name: "Jean Kotze",
    role: "Part-Time Assistant Coach — KJK Judo Club",
    image: JeanKotzeImage,
    excerpt:
      "1st Dan, Safeguarding accredited assistant coach and Local Technical Official.",

    skills: [
      { label: "Judo Technique", percentage: 82 },
      { label: "Assistant Coaching", percentage: 86 },
      { label: "Athlete Support", percentage: 85 },
      { label: "Technical Officiating", percentage: 84 },
    ],

    social: [],

    bio: [
      "Jean Kotze is a part-time assistant coach at KJK Judo Club and holds the rank of 1st Dan.",

      "Jean is accredited through a Safeguarding Course and serves as a Local Technical Official. As an assistant coach, Jean supports the development of judoka at club level.",

      "Jean is currently a scholar and has an interest in the culinary arts, with plans to pursue studies at Chef School.",
    ],
  },

  // 8. du Plessis
  {
    slug: "carien-du-plessis",
    name: "Carien du Plessis",
    role: "Head of Fitness & Conditioning",
    image: CarienduPlessisImage,
    excerpt:
      "Sho Dan, competitive judoka, and Head of Fitness & Conditioning with 14 years of judo experience.",

    skills: [
      { label: "Fitness & Conditioning", percentage: 96 },
      { label: "Athlete Development", percentage: 94 },
      { label: "Judo Technique", percentage: 90 },
      { label: "Youth Development", percentage: 93 },
      { label: "Competition Preparation", percentage: 91 },
    ],

    social: [],

    bio: [
      "Coach Carien du Plessis is the Head of Fitness & Conditioning and has been involved in judo for 14 years. Her journey began in 2012 when she stepped onto the mat at just eight years old.",

      "Carien has competed and earned medals at district, provincial, national, and international competitions. Her international experience includes the 2023 Commonwealth Championships and the 2025 African Championships. She has also earned her Sho Dan, a 1st Dan black belt.",

      "As a coach, one of Carien's greatest rewards is watching young judoka grow in their own individual ways. Her approach to fitness and conditioning is shaped by her own journey of commitment, perseverance, confidence, and self-belief.",

      "Her favourite technique is Morote Seoi Nage, which she values for its combination of control, timing, and effectiveness. Outside of judo, Carien enjoys playing guitar and places a strong value on family.",
    ],

    quote:
      "Judo allowed me to figure out who I am, not only in class but as my own person in life in general.",
  },

  // 9. Collins
  {
    slug: "johan-collins",
    name: "Johan Collins",
    role: "Coach — Golden Score Judo",
    image: JohanCollinsImage,
    excerpt:
      "Coach with 15 years of judo experience, focused on developing judoka both on and off the mat.",

    skills: [
      { label: "Judo Technique", percentage: 90 },
      { label: "Youth Development", percentage: 94 },
      { label: "Coaching & Mentorship", percentage: 93 },
      { label: "Athlete Confidence", percentage: 92 },
      { label: "Personal Development", percentage: 95 },
    ],

    social: [],

    bio: [
      "Johan Collins began his judo journey at the age of six. What started as a childhood activity developed into a 15-year journey shaped by discipline, perseverance, friendship, competition, and personal growth.",

      "His favourite throw is Uchi-mata, which he appreciates for its elegance, timing, balance, and precision. As a coach, Johan particularly enjoys watching judoka grow not only in their judo ability, but also in confidence and character.",

      "Johan credits his Sensei, family, and friends for supporting him throughout his journey. Their belief in him helped him continue through difficult moments and shaped the person and judoka he is today.",

      "For Johan, judo extends far beyond throwing and grappling. He sees it as a way of developing discipline, humility, resilience, self-control, respect, patience, and community. He also values the principles of Seiryoku Zenyo and Jita Kyoei and believes their lessons can extend beyond the dojo into everyday life.",
    ],

    quote:
      "It does not matter how many times you fall down; it matters how many times you stand up.",
  },
];

export default instructors;
/**
 * Lightweight intent detection used by the offline engine (when Gemini is unavailable) and by tests.
 * Ordered by priority: safety first, then conversation mechanics, then WRJA topics.
 */
export type Intent =
  | 'crisis' | 'emergency' | 'safeguarding' | 'injection' | 'insult'
  | 'human' | 'identity' | 'capabilities'
  | 'greeting' | 'how-are-you' | 'goodbye' | 'thanks' | 'acknowledge'
  | 'contact' | 'cost' | 'join' | 'medical' | 'adult'
  | 'nearest-club' | 'schedule'
  | 'clubs' | 'coaches' | 'classes' | 'events'
  | 'more-detail'
  | 'none';

const normalize = (text: string) => text.toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();

const PATTERNS: Array<[Intent, RegExp]> = [
  ['crisis', /\b(?:kill myself|suicid\w*|end my life|want to die|wanna die|self[- ]?harm\w*|hurt myself|don'?t want to (?:live|be here)|no reason to live|better off dead)\b/],
  ['emergency', /\b(?:ambulance|unconscious|not breathing|can'?t breathe|bleeding (?:badly|heavily|a lot)|medical emergency|(?:it'?s|this is|there'?s) an emergency|someone (?:is )?(?:hurt|injured) (?:right )?now)\b/],
  ['safeguarding', /\b(?:abus(?:e|ed|es|ing|ive)|molest\w*|groom(?:ing|ed)|(?:coach|sensei|instructor|teacher)\b.{0,40}\b(?:hit|hurt|touched|shouted|screamed|bullied|threatened|inappropriate)|inappropriate(?:ly)? (?:touch\w*|behaviou?r|messages?|comments?)|(?:report|complain\w*|complaint)\b.{0,30}\b(?:coach|sensei|instructor|club|wrja)|child (?:is )?(?:in danger|unsafe)|unsafe at (?:the )?(?:club|class|dojo))\b/],
  ['injection', /\b(?:ignore|disregard|forget|override)\b.{0,25}\b(?:instructions?|rules|prompt|guidelines|programming)\b|\b(?:system|developer|hidden) (?:prompt|message|instructions?)\b|\breveal your (?:prompt|instructions|rules)\b|\bpretend (?:to be|you(?:'re| are))\b|\bact as (?:a |an |if)\b|\bjailbreak\b|\bdeveloper mode\b|\byou are now\b|\brepeat (?:everything|all) (?:above|before)\b/],
  ['insult', /\b(?:stupid|useless|idiot\w*|dumb|trash|rubbish|crap\w*|shit\w*|fuck\w*|bullshit|garbage|pathetic|worthless|moron\w*|hate you|you suck)\b/],
  ['human', /\b(?:(?:speak|talk|chat|connect(?: me)?) (?:to|with) (?:a |an |some ?one|somebody|real|actual|human|person|agent|staff|your team|the team|a coach|a sensei)|real (?:person|human)|human being|live (?:agent|chat|person)|(?:customer )?(?:service|support) (?:agent|team|person)|speak to (?:wrja|support|the office)|get hold of (?:someone|a person)|(?:someone|somebody|a person) (?:to )?(?:call|phone|contact|help) me|call me back|phone me)\b/],
  ['identity', /\b(?:who|what) are you\b|\byour name\b|\bare you (?:a |an )?(?:bot|robot|ai|human|real|person|chat ?bot|gemini|machine|automated)\b|\bam i (?:talking|speaking|chatting) (?:to|with) (?:a |an )?(?:bot|human|person|robot|real|machine)\b/],
  ['capabilities', /\bwhat can you (?:do|help|tell)\b|\bhow can you help\b|\bwhat do you (?:do|know|offer)\b|\bwhat (?:are you|is this) (?:for|good for)\b|^\s*(?:help|help me|menu|options)\s*[?!.]*\s*$/],
  ['greeting', /^\s*(?:(?:hello|hi|hey|hiya|howzit|heita|sawubona|dumela|molo|hallo|haai|hola|greetings|yo|sup|good (?:morning|afternoon|evening|day)|goeie (?:more|môre|dag|middag|naand|more))(?:\s+(?:there|again|everyone|all|team|wrja|assistant|bot))?)\s*[!,.?\s]*$/],
  ['how-are-you', /\bhow are (?:you|u)\b|\bhow'?s it going\b|\bhow do you do\b|\bhoe gaan dit\b|\bwhat'?s up\b/],
  ['goodbye', /\b(?:bye|goodbye|see (?:you|ya)|talk later|that'?s (?:all|it)|that is all|nothing else|no(?:pe)?,? (?:that'?s|i'?m) (?:it|all|good|fine|done)|i'?m (?:done|good|all set)|totsiens|cheers,? bye|have a (?:good|nice|great) (?:day|one|evening|weekend))\b/],
  ['thanks', /\b(?:thanks?|thank you|thx|ty|cheers|appreciate (?:it|that|the help)|baie dankie|dankie|ta)\b/],
  ['acknowledge', /^\s*(?:ok(?:ay)?|k|kk|cool|great|nice|awesome|sure|alright|all right|got it|i see|perfect|sounds good|good|lekker|fine|noted|right|yes|yep|yeah|ja|no|nope|nah)\s*[!.?,]*\s*$/],
  ['contact', /\b(?:phone|telephone|tel(?:ephone)? (?:no|number)|cell(?:phone)?(?: number)?|whatsapp|e-?mail|contact (?:details|number|info|information|you|wrja|the office)|office (?:hours|number|address)|how (?:do|can|could) i (?:contact|reach|get hold of|get in touch)|get in touch|reach (?:you|wrja|someone)|facebook|instagram|social media|website address)\b/],
  ['cost', /\b(?:cost|costs|price|prices|pricing|fees?|how much|expensive|afford\w*|pay(?:ing|ment)?|membership|monthly|per (?:month|term|session|class|year)|rates?|free|discount|sibling|bursary|subsid\w*|hoeveel|koste?|prys|betaal)\b/],
  ['join', /\b(?:join(?:ing)?|sign(?:ing)? ?up|enrol\w*|enroll\w*|register(?:ing)?(?! for the (?:tournament|event))|registration|book(?:ing)?(?: a)?(?: class| trial| lesson)?|trial|try (?:a (?:class|lesson)|out)|get(?:ting)? started|start(?:ing)? (?:judo|classes|training|lessons)|how (?:do|can) (?:i|we|my (?:child|son|daughter|kid)) (?:start|begin|get in)|where do (?:i|we) start|inskryf|aansluit)\b/],
  ['medical', /\b(?:asthma\w*|epilep\w*|adhd|autis\w*|disabilit\w*|special needs|wheelchair|medical|doctor|pregnan\w*|surgery|concussion|allerg\w*|diabet\w*|heart (?:condition|problem)|(?:bad|weak|broken|injured|sore|sprained) (?:back|knee|neck|shoulder|ankle|wrist|arm|leg)|insurance)\b/],
  ['adult', /\b(?:adults?|grown[- ]?ups?|(?:i'?m|i am|am i) (?:\d{2}|too old|an adult|in my \d0s)|too old|older|seniors?|elderly|over (?:\d{2}|forty|fifty|sixty)|for myself|for me\b|my (?:husband|wife|partner))\b/],
  ['nearest-club', /\b(?:closest|nearest|near(?:by)?(?: me)?|near me|close to (?:me|us|home)|in my area|which club (?:is|should)|club near|(?:i|we) (?:live|stay) (?:in|near|at))\b/],
  ['schedule', /\b(?:what time|which days?|class times?|training times?|train(?:ing)? (?:days?|schedule)|timetable|schedule|opening hours|when (?:do|does|are|is) (?:the |your |you |classes?|training|they|it)|how often (?:is|are|do|does)|how long (?:is|are) (?:a |the |each |every )?(?:class|lesson|session|training))\b/],
  ['clubs', /\b(?:where (?:do|does|are|can)(?: i| we| you| your| the| all)?(?: (?:clubs?|you|classes))? (?:train|located|find|meet)|which clubs|what clubs|list (?:all )?(?:the |your )?clubs|all club locations|club locations|(?:tell me|more|info|information|details) about (?:the |your |our )?clubs?|^\s*clubs?\s*[?!.]*\s*$|your clubs|where (?:is|are) (?:the |your )?(?:club|clubs|dojo|dojos)|addresses)\b/],
  ['coaches', /\b(?:who (?:are|is) (?:your |the |our )?(?:coach(?:es)?|instructors?|senseis?|teachers?)|list (?:all )?(?:your |the )?(?:coach(?:es)?|instructors?)|(?:tell me|more|info|information|details) about (?:your |the |our )?(?:judo )?(?:coach(?:es)?|instructors?|senseis?|team)|^\s*(?:coach(?:es)?|instructors?|senseis?|staff)\s*[?!.]*\s*$|who (?:teaches|coaches|runs|trains)\b|your (?:coach(?:es)?|instructors?|team))\b/],
  ['classes', /\b(?:(?:tell me|more|info|information|details) about (?:your |the |our )?(?:judo )?(?:classes|lessons|training|programmes?|programs?)|^\s*(?:classes|lessons|training|programmes?)\s*[?!.]*\s*$|what (?:do|does) (?:a |the |your )?(?:classes|lessons|training) (?:involve|include|look like)|what to expect|what happens (?:in|at) a (?:class|lesson))\b/],
  ['events', /\b(?:events?|competitions?|tournaments?|invitations?|seminars?|workshops?|camps?|clinics?|leagues?|festivals?|fundraisers?|open days?|demonstrations?|grading|gradings|belt (?:test|exam)s?|exams?|upcoming|calendar|this (?:weekend|month)|next (?:weekend|month)|what'?s (?:happening|on|coming up)|what is (?:happening|on|coming up))\b/],
  ['more-detail', /^\s*(?:(?:and )?what else|anything else|tell me more|more(?: details?| info)?|go on|continue|elaborate|and\??|why\??|how so\??|can you (?:elaborate|explain)(?: more)?|explain (?:more|further)|expand)\s*[?!.]*\s*$/],
];

/** Return every intent that matches, in priority order. */
export function detectIntents(message: string): Intent[] {
  const text = normalize(message);
  const found: Intent[] = [];
  for (const [intent, pattern] of PATTERNS) if (pattern.test(text)) found.push(intent);
  return found.length > 0 ? found : ['none'];
}

export function detectIntent(message: string): Intent {
  return detectIntents(message)[0];
}

const AFRIKAANS = /\b(?:hoeveel|waar|wanneer|kinders?|asseblief|dankie|klasse|hoe laat|ek wil|my seun|my dogter|goeie|baie|julle|hoekom|watter|kan ek|moet|oefen|ouderdom)\b/i;
export function looksAfrikaans(message: string): boolean {
  return AFRIKAANS.test(message);
}

package za.co.wrja.mobile

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

/**
 * Website-only sub-pages represented natively in the Android Events and FAQ
 * flows. They reuse the live Supabase calendar, event and payment screens
 * already used by the app, so no second network integration is introduced.
 */
@Composable
private fun WebsiteEventCategoryHeader(
    title: String,
    description: String,
    onBack: () -> Unit
) {
    TextButton(onClick = onBack, contentPadding = androidx.compose.foundation.layout.PaddingValues()) {
        Text(localized("← Back to Events hub", "← Terug na geleentheidsentrum", "← Buyela esikhungweni semicimbi"), color = WrjaGold, fontWeight = FontWeight.Bold)
    }
    Spacer(Modifier.height(10.dp))
    WrjaSectionHeading("${tr("events")} / $title", title, description)
    Spacer(Modifier.height(20.dp))
}

@Composable
fun WebsiteStandardEvents(onBack: () -> Unit) {
    WebsiteEventCategoryHeader(
        title = localized("Standard events", "Standaardgeleenthede", "Imicimbi ejwayelekile"),
        description = localized("Upcoming WRJA gradings, training camps and association events.", "Komende WRJA-graderings, oefenkampe en verenigingsgeleenthede.", "Ukukleliswa kwe-WRJA okuzayo, amakamu okuqeqesha nemicimbi yenhlangano."),
        onBack = onBack
    )
    SupabaseEvents()
}

@Composable
fun WebsiteEventsCalendar(onBack: () -> Unit) {
    WebsiteEventCategoryHeader(
        title = localized("Calendar", "Kalender", "Ikhalenda"),
        description = localized("Keep track of upcoming WRJA events and important dates.", "Hou tred met komende WRJA-geleenthede en belangrike datums.", "Landela imicimbi ezayo ye-WRJA nezinsuku ezibalulekile."),
        onBack = onBack
    )
    Text(localized("UPCOMING WRJA EVENTS", "KOMENDE WRJA-GELEENTHEDE", "IMICIMBI YE-WRJA EZAYO"), color = WrjaGold, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.ExtraBold)
    Spacer(Modifier.height(10.dp))
    SupabaseEvents()
    Spacer(Modifier.height(20.dp))
    Text(localized("COMPETITION DATES", "KOMPETISIEDATUMS", "IZINSUKU ZEMINCINTISWANO"), color = WrjaGold, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.ExtraBold)
    Spacer(Modifier.height(10.dp))
    CompetitionCalendar()
}

@Composable
fun WebsiteSchoolsEvents(
    onBack: () -> Unit,
    onRegistrationClick: () -> Unit
) {
    WebsiteEventCategoryHeader(
        title = localized("Schools", "Skole", "Izikole"),
        description = localized("School-focused competition opportunities for developing judoka across the West Rand and Gauteng.", "Skoolgerigte kompetisiegeleenthede vir ontwikkelende judoka oor die Wes-Rand en Gauteng.", "Amathuba emincintiswano egxile ezikoleni kuma-judoka asathuthuka e-West Rand naseGauteng."),
        onBack = onBack
    )
    val pathways = listOf(
        "SA Schools Novice" to "A welcoming competition pathway for developing school judoka. Speak to your coach about readiness, registration and the events available for your age group.",
        "SA Schools Advanced" to "A progression pathway for experienced school judoka who are ready to represent their school and club in higher-level events."
    )
    pathways.forEachIndexed { index, (title, copy) ->
        Card(
            onClick = onRegistrationClick,
            modifier = Modifier.fillMaxWidth().padding(bottom = 14.dp).wrjaReveal(index),
            colors = CardDefaults.cardColors(containerColor = WrjaCard),
            border = BorderStroke(1.dp, WrjaCardBorder),
            elevation = CardDefaults.cardElevation(defaultElevation = 7.dp, pressedElevation = 2.dp)
        ) {
            Column(Modifier.padding(18.dp)) {
                Text(localized("SCHOOL JUDO", "SKOOLJUDO", "I-JUDO YEZIKOLE"), color = WrjaGold, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.ExtraBold)
                Spacer(Modifier.height(5.dp))
                Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(8.dp))
                Text(copy, color = WrjaMuted, style = MaterialTheme.typography.bodyMedium)
                Spacer(Modifier.height(14.dp))
                Text(localized("VIEW REGISTRATION & PAYMENT  →", "BEKYK REGISTRASIE EN BETALING  →", "BONA UKUBHALISA NENKOKHELO  →"), color = WrjaGold, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.ExtraBold)
            }
        }
    }
}

@Composable
fun WebsiteStore(
    onBack: () -> Unit,
    onTracksuitClick: () -> Unit,
    onPosterEnquiryClick: () -> Unit
) {
    TextButton(onClick = onBack, contentPadding = androidx.compose.foundation.layout.PaddingValues()) {
        Text(localized("← Events hub", "← Geleentheidsentrum", "← Isikhungo semicimbi"), color = WrjaGold, fontWeight = FontWeight.Bold)
    }
    Spacer(Modifier.height(10.dp))
    WrjaContentCard(Modifier.fillMaxWidth().wrjaReveal()) {
        Box(
            Modifier.fillMaxWidth().height(158.dp).background(Color(0xFF101010)),
            contentAlignment = Alignment.Center
        ) {
            Image(
                painter = painterResource(R.drawable.wrja_logo),
                contentDescription = "West Rand Judo Association",
                modifier = Modifier.size(205.dp).padding(12.dp),
                contentScale = ContentScale.Fit
            )
        }
        Column(Modifier.padding(18.dp)) {
            Text(localized("WRJA MERCH / OFFICIAL COLLECTION", "WRJA-HANDELSWARE / AMPTELIKE VERSAMELING", "IZIMPAHLA ZE-WRJA / IQOQO ELISEMTHETHWENI"), color = WrjaGold, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.ExtraBold)
            Spacer(Modifier.height(7.dp))
            Text(localized("Represent the club.\nOn and off the mat.", "Verteenwoordig die klub.\nOp en van die mat af.", "Melela iklabhu.\nNgaphakathi nangaphandle komata."), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(8.dp))
            Text(localized("Official WRJA apparel and club prints for athletes, coaches, families and supporters.", "Amptelike WRJA-klere en klubdrukwerk vir atlete, afrigters, gesinne en ondersteuners.", "Izingubo ezisemthethweni ze-WRJA nokuphrintwa kweklabhu kwabasubathi, abaqeqeshi, imindeni nabasekeli."), color = WrjaMuted)
            Spacer(Modifier.height(14.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                StoreChip("Official WRJA")
                StoreChip("JSA collection")
                StoreChip("Made to order")
            }
        }
    }
    Spacer(Modifier.height(24.dp))
    Row(verticalAlignment = Alignment.Bottom) {
        Column(Modifier.weight(1f)) {
            Text(localized("THE WRJA COLLECTION", "DIE WRJA-VERSAMELING", "IQOQO LE-WRJA"), color = WrjaGold, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.ExtraBold)
            Spacer(Modifier.height(4.dp))
            Text(localized("Club essentials", "Klubbenodigdhede", "Okubalulekile kweklabhu"), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        }
        Text("02 PRODUCTS", color = WrjaMuted, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
    }
    Spacer(Modifier.height(16.dp))
    StoreProductCard(
        label = "WRJA & JSA",
        title = "Tracksuits",
        description = "Official WRJA and JSA tracksuits for athletes, coaches and supporters. Select your requirements through the WRJA ordering flow.",
        action = "SHOP TRACKSUITS",
        onClick = onTracksuitClick,
        revealIndex = 1
    )
    Spacer(Modifier.height(14.dp))
    StoreProductCard(
        label = "CLUB MATERIALS",
        title = "WRJA Posters",
        description = "Bring the WRJA spirit to your dojo, school or event space with official association posters.",
        action = "CONTACT WRJA",
        onClick = onPosterEnquiryClick,
        revealIndex = 2
    )
}

@Composable
private fun StoreChip(label: String) {
    Text(
        text = label,
        modifier = Modifier.background(Color(0xFF302707), MaterialTheme.shapes.extraSmall).padding(horizontal = 8.dp, vertical = 5.dp),
        color = WrjaGold,
        style = MaterialTheme.typography.labelSmall,
        fontWeight = FontWeight.Bold
    )
}

@Composable
private fun StoreProductCard(
    label: String,
    title: String,
    description: String,
    action: String,
    onClick: () -> Unit,
    revealIndex: Int
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().wrjaReveal(revealIndex),
        colors = CardDefaults.cardColors(containerColor = WrjaCard),
        border = BorderStroke(1.dp, WrjaCardBorder),
        elevation = CardDefaults.cardElevation(defaultElevation = 7.dp, pressedElevation = 2.dp)
    ) {
        Column(Modifier.padding(18.dp)) {
            Text(label, color = WrjaGold, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.ExtraBold)
            Spacer(Modifier.height(5.dp))
            Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(8.dp))
            Text(description, color = WrjaMuted, style = MaterialTheme.typography.bodyMedium)
            Spacer(Modifier.height(16.dp))
            Text(localized("ORDER BY ENQUIRY", "BESTEL PER NAVRAAG", "ODA NGOKUBUZA"), color = WrjaMuted, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(5.dp))
            Text("$action  →", color = WrjaGold, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.ExtraBold)
        }
    }
}

private data class WebsiteFaq(val question: String, val answer: String)

private val websiteFaqs = listOf(
    WebsiteFaq("What is Judo?", "Judo is a Japanese martial art and Olympic sport that focuses on throws, grappling, balance, movement and control. The word Judo means “the gentle way.”"),
    WebsiteFaq("At what age can children start Judo?", "Children can generally start from around 4 years old, depending on their maturity and ability to participate safely in a structured class."),
    WebsiteFaq("Does my child need to be strong or athletic to do Judo?", "Not at all! Judo helps children develop strength, coordination, balance, flexibility and fitness as they learn."),
    WebsiteFaq("Is Judo dangerous?", "Like any physical sport, there is some risk of injury, but Judo teaches children how to fall safely (ukemi) and how to control their movements and training partners. Qualified coaches should always supervise training."),
    WebsiteFaq("Will my child learn to fight?", "Judo is not about fighting or hurting people. Children learn discipline, control, respect, confidence and self-defence principles in a controlled environment."),
    WebsiteFaq("What does Judo teach children?", "Judo develops much more than physical skills. Children learn discipline, respect, confidence, focus and concentration, perseverance, balance and coordination, teamwork and self-control."),
    WebsiteFaq("Does my child have to compete?", "No. Competition is an option. Some children enjoy competing, while others participate simply for fitness, confidence, discipline and fun."),
    WebsiteFaq("What should my child wear to their first class?", "For a trial class, comfortable sports clothing is usually suitable. Once they continue with Judo, they will need a Judo gi (Judo uniform)."),
    WebsiteFaq("What is a Judo gi?", "A Judo gi is the traditional uniform worn during training and competition. It is designed to withstand gripping, throwing and grappling."),
    WebsiteFaq("Will Judo help my child with confidence?", "Yes! Children are encouraged to try new techniques, overcome challenges and learn from mistakes. This can help develop confidence and resilience both on and off the mat."),
    WebsiteFaq("What happens if my child is shy or nervous?", "That is completely normal! Our coaches work with children at their own pace and encourage them without forcing them into situations they are not ready for."),
    WebsiteFaq("Can Judo help with concentration?", "Yes. Judo requires children to listen to instructions, remember techniques, react to their partner and remain focused during activities."),
    WebsiteFaq("Can Judo help with self-defence?", "Judo teaches practical skills such as balance, body control, breakfalls, gripping and controlled throws. More importantly, children learn awareness, confidence and self-control."),
    WebsiteFaq("Is Judo only for boys?", "Absolutely not! Judo is for everyone. Boys and girls can train, learn and compete together within appropriate categories."),
    WebsiteFaq("What are the different Judo belt colours?", "Judo uses a belt-ranking system to recognise a judoka's progress. Beginners start at a lower rank and work their way through the grades as they develop their knowledge and skills."),
    WebsiteFaq("What does “Sensei” mean?", "Sensei is a Japanese term commonly used to address a teacher or instructor. In Judo, it is often used when referring respectfully to a coach or instructor."),
    WebsiteFaq("What does “Judoka” mean?", "A judoka is a person who practises Judo."),
    WebsiteFaq("Does Judo improve physical fitness?", "Definitely! Judo can improve cardiovascular fitness, strength, agility, flexibility, coordination and balance."),
    WebsiteFaq("Can Judo help children learn how to deal with losing?", "Yes. Judo teaches children that mistakes and setbacks are part of learning. They learn to keep trying, respect their opponent and improve rather than give up."),
    WebsiteFaq("Why should my child try Judo?", "Because Judo offers children a combination of sport, discipline, confidence, friendship and personal development, all while having fun and learning something new."),
    WebsiteFaq("Is Judo just another sport?", "No, it is so much more! Judo teaches children skills they can carry with them far beyond the mat. From learning how to fall and get back up, to showing respect, controlling emotions, working with others and persevering through challenges, Judo helps develop the whole child."),
    WebsiteFaq("My child is already at club level. How do they advance to the next level?", "If your child is already training at club level, their Judo journey continues through structured grading and development. As they attend classes, learn and demonstrate the required techniques, improve their knowledge and develop their Judo skills, they can work towards their next belt/grade. Progression is not based only on how long a child has been training. Coaches look at technical ability and knowledge, balance, movement and coordination, partner work and control, understanding of Judo principles, physical development and fitness, attitude, discipline and respect, effort, commitment and perseverance. When a judoka is ready, they can be recommended for the appropriate grading examination. For judokas who wish to progress further into competitive Judo, there are also opportunities to participate in club, provincial, national and international competitions, depending on their age, ability and competitive pathway."),
    WebsiteFaq("Is Judo a registered and recognised sport?", "Yes! Judo is a fully recognised Olympic sport with an established international, national and provincial governing structure. Judo in South Africa is governed nationally by Judo South Africa (JSA), which is affiliated with the International Judo Federation (IJF) and recognised within the South African sporting structure through SASCOC (South African Sports Confederation and Olympic Committee). At provincial and regional level, Judo is organised through recognised structures such as Judo South Africa (JSA), the International Judo Federation (IJF), SASCOC, the Gauteng Judo Federation (GJF), the West Rand Judo Association (WRJA), and the West Rand Sports Confederation (WRSC). This means that children who start Judo at club level can have a pathway that extends from their local dojo all the way to provincial, national and potentially international competition. Judo is also an Olympic sport, making it one of the world's most established martial arts and competitive sports. From their first class to the competition mat, every judoka has the opportunity to grow, learn and progress at their own pace.")
)

@Composable
private fun WebsiteFaq.localizedQuestion(): String = when (question) {
    "What is Judo?" -> localized(question, "Wat is Judo?", "Iyini i-Judo?")
    "At what age can children start Judo?" -> localized(question, "Op watter ouderdom kan kinders met Judo begin?", "Izingane zingaqala i-Judo zineminyaka emingaki?")
    "Does my child need to be strong or athletic to do Judo?" -> localized(question, "Moet my kind sterk of atleties wees om Judo te doen?", "Ingabe ingane yami kufanele iqine noma ibe ngumsubathi ukuze yenze i-Judo?")
    "Is Judo dangerous?" -> localized(question, "Is Judo gevaarlik?", "Ingabe i-Judo iyingozi?")
    "Will my child learn to fight?" -> localized(question, "Sal my kind leer baklei?", "Ingabe ingane yami izofunda ukulwa?")
    "What does Judo teach children?" -> localized(question, "Wat leer Judo vir kinders?", "I-Judo ifundisani izingane?")
    "Does my child have to compete?" -> localized(question, "Moet my kind meeding?", "Ingabe ingane yami kufanele incintisane?")
    "What should my child wear to their first class?" -> localized(question, "Wat moet my kind na hul eerste klas dra?", "Ingane yami kufanele igqokeni ekilasini layo lokuqala?")
    "What is a Judo gi?" -> localized(question, "Wat is 'n Judo-gi?", "Iyini i-Judo gi?")
    "Will Judo help my child with confidence?" -> localized(question, "Sal Judo my kind met selfvertroue help?", "Ingabe i-Judo izosiza ingane yami ngokuzethemba?")
    "What happens if my child is shy or nervous?" -> localized(question, "Wat gebeur as my kind skaam of senuweeagtig is?", "Kwenzekani uma ingane yami inamahloni noma ikhathazekile?")
    "Can Judo help with concentration?" -> localized(question, "Kan Judo met konsentrasie help?", "Ingabe i-Judo ingasiza ngokugxila?")
    "Can Judo help with self-defence?" -> localized(question, "Kan Judo met selfverdediging help?", "Ingabe i-Judo ingasiza ngokuzivikela?")
    "Is Judo only for boys?" -> localized(question, "Is Judo net vir seuns?", "Ingabe i-Judo ingeyabafana kuphela?")
    "What are the different Judo belt colours?" -> localized(question, "Wat is die verskillende Judo-gordelkleure?", "Yimiphi imibala yamabhande e-Judo ehlukene?")
    "What does “Sensei” mean?" -> localized(question, "Wat beteken “Sensei”?", "Kusho ukuthini “Sensei”? ")
    "What does “Judoka” mean?" -> localized(question, "Wat beteken “Judoka”?", "Kusho ukuthini “Judoka”? ")
    "Does Judo improve physical fitness?" -> localized(question, "Verbeter Judo fisieke fiksheid?", "Ingabe i-Judo ithuthukisa ukuqina komzimba?")
    "Can Judo help children learn how to deal with losing?" -> localized(question, "Kan Judo kinders help om verlies te hanteer?", "Ingabe i-Judo ingasiza izingane zifunde ukubhekana nokuhlulwa?")
    "Why should my child try Judo?" -> localized(question, "Hoekom moet my kind Judo probeer?", "Kungani ingane yami kufanele izame i-Judo?")
    "Is Judo just another sport?" -> localized(question, "Is Judo net nog 'n sport?", "Ingabe i-Judo ingomunye umdlalo nje?")
    "My child is already at club level. How do they advance to the next level?" -> localized(question, "My kind is reeds op klubvlak. Hoe vorder hulle na die volgende vlak?", "Ingane yami isisezingeni leklabhu. Iqhubekela kanjani ezingeni elilandelayo?")
    "Is Judo a registered and recognised sport?" -> localized(question, "Is Judo 'n geregistreerde en erkende sport?", "Ingabe i-Judo ingumdlalo obhalisiwe futhi owaziwayo?")
    else -> question
}

@Composable
private fun WebsiteFaq.localizedAnswer(): String = when (question) {
    "What is Judo?" -> localized(answer, "Judo is 'n Japannese gevegskuns en Olimpiese sport wat op werpe, grondwerk, balans, beweging en beheer fokus.", "I-Judo ubuciko bokulwa baseJapane nomdlalo wama-Olympic ogxile ekuphonseni, ekubambaneni, ekulinganiseleni nasekulawuleni.")
    "At what age can children start Judo?" -> localized(answer, "Kinders kan gewoonlik vanaf ongeveer vier jaar begin, afhangend van hul volwassenheid en vermoë om veilig deel te neem.", "Izingane zingaqala cishe eminyakeni emine, kuye ngokuvuthwa kwazo nokukwazi ukubamba iqhaza ngokuphepha.")
    "Does my child need to be strong or athletic to do Judo?" -> localized(answer, "Nee. Judo help kinders om krag, koördinasie, balans, buigsaamheid en fiksheid te ontwikkel.", "Cha. I-Judo isiza izingane zakhe amandla, ukuhambisana, ukulinganisela, ukuguquguquka nokuqina.")
    "Is Judo dangerous?" -> localized(answer, "Soos enige fisieke sport het Judo risiko's, maar veilige val, beheer en gekwalifiseerde toesig beperk dit.", "Njenganoma yimuphi umdlalo womzimba kunezingozi, kodwa i-Judo ifundisa ukuwa ngokuphepha, ukulawula nokuqeqeshwa ngaphansi kwabaqeqeshi abafanelekile.")
    "Will my child learn to fight?" -> localized(answer, "Judo gaan nie oor seermaak nie; dit leer dissipline, beheer, respek, selfvertroue en beginsels van selfverdediging.", "I-Judo ayimayelana nokulimaza; ifundisa isimilo, ukulawula, inhlonipho, ukuzethemba nezimiso zokuzivikela.")
    "What does Judo teach children?" -> localized(answer, "Benewens fisieke vaardighede leer kinders dissipline, respek, fokus, deursettingsvermoë, spanwerk en selfbeheer.", "Ngaphandle kwamakhono omzimba, izingane zifunda isimilo, inhlonipho, ukugxila, ukubekezela, ukusebenzisana nokuzilawula.")
    "Does my child have to compete?" -> localized(answer, "Nee. Kompetisie is opsioneel; baie kinders oefen vir fiksheid, selfvertroue, dissipline en pret.", "Cha. Ukuncintisana kuyazikhethela; izingane eziningi ziqeqesha ukuze ziqine, zizethembe, zibe nesimilo futhi zijabule.")
    "What should my child wear to their first class?" -> localized(answer, "Vir 'n proefsessie is gemaklike sportklere gewoonlik geskik; later sal 'n Judo-gi benodig word.", "Esifundweni sokuzama, izingubo zemidlalo ezikhululekile zivame ukufaneleka; kamuva kuzodingeka i-Judo gi.")
    "What is a Judo gi?" -> localized(answer, "'n Judo-gi is die tradisionele uniform vir opleiding en kompetisie, gemaak vir greep, werpe en grondwerk.", "I-Judo gi iyunifomu yendabuko yokuqeqesha nemincintiswano, eyenzelwe ukubanjwa, ukuphonswa nokubambana.")
    "Will Judo help my child with confidence?" -> localized(answer, "Ja. Nuwe tegnieke en uitdagings help kinders om selfvertroue en veerkragtigheid op en van die mat af te bou.", "Yebo. Amasu amasha nezinselelo zisiza izingane zakhe ukuzethemba nokubekezela ngaphakathi nangaphandle komata.")
    "What happens if my child is shy or nervous?" -> localized(answer, "Dit is normaal. Afrigters werk teen elke kind se eie tempo sonder om hulle in ongereed situasies te dwing.", "Lokho kujwayelekile. Abaqeqeshi basebenza ngesivinini sengane ngayinye ngaphandle kokuyiphoqa ezimeni engakazilungeli.")
    "Can Judo help with concentration?" -> localized(answer, "Ja. Judo vereis dat kinders luister, tegnieke onthou, op hul maat reageer en gefokus bly.", "Yebo. I-Judo idinga izingane zilalele, zikhumbule amasu, zisabele kumlingani futhi zihlale zigxile.")
    "Can Judo help with self-defence?" -> localized(answer, "Judo leer balans, liggaamsbeheer, veilige val, greep en beheerde werpe, saam met bewustheid en selfbeheer.", "I-Judo ifundisa ukulinganisela, ukulawula umzimba, ukuwa ngokuphepha, ukubamba nokuphonsa okulawulwayo, kanye nokuqaphela nokuzilawula.")
    "Is Judo only for boys?" -> localized(answer, "Nee. Judo is vir almal; seuns en meisies kan in toepaslike kategorieë saam oefen en meeding.", "Cha. I-Judo eyawo wonke umuntu; abafana namantombazane bangaqeqesha futhi bancintisane ndawonye ezigabeni ezifanele.")
    "What are the different Judo belt colours?" -> localized(answer, "Gordelgrade erken 'n judoka se vordering. Beginners beweeg deur grade soos hul kennis en vaardighede groei.", "Amabanga amabhande abonisa inqubekela phambili ye-judoka. Abaqalayo baqhubeka ngamabanga njengoba ulwazi namakhono abo ekhula.")
    "What does “Sensei” mean?" -> localized(answer, "Sensei is 'n Japannese term vir 'n onderwyser of instrukteur en word met respek vir 'n Judo-afrigter gebruik.", "I-Sensei yigama lesiJapane elisho uthisha noma umqeqeshi, elisetshenziswa ngenhlonipho kumqeqeshi we-Judo.")
    "What does “Judoka” mean?" -> localized(answer, "'n Judoka is 'n persoon wat Judo beoefen.", "I-judoka ngumuntu owenza i-Judo.")
    "Does Judo improve physical fitness?" -> localized(answer, "Ja. Judo kan kardiovaskulêre fiksheid, krag, ratsheid, buigsaamheid, koördinasie en balans verbeter.", "Yebo. I-Judo ingathuthukisa ukuqina kwenhliziyo, amandla, ukushesha, ukuguquguquka, ukuhambisana nokulinganisela.")
    "Can Judo help children learn how to deal with losing?" -> localized(answer, "Ja. Kinders leer dat foute en terugslae deel van leer is en dat respek en verbetering belangrik is.", "Yebo. Izingane zifunda ukuthi amaphutha nokuhlulwa kuyingxenye yokufunda, nokuthi inhlonipho nokuthuthuka kubalulekile.")
    "Why should my child try Judo?" -> localized(answer, "Judo bied sport, dissipline, selfvertroue, vriendskap en persoonlike ontwikkeling terwyl kinders pret het.", "I-Judo inikeza ezemidlalo, isimilo, ukuzethemba, ubungane nokukhula komuntu ngenkathi izingane zijabula.")
    "Is Judo just another sport?" -> localized(answer, "Judo leer lewensvaardighede soos respek, emosiebeheer, samewerking en deursettingsvermoë, ver buite die mat.", "I-Judo ifundisa amakhono empilo njengokuhlonipha, ukulawula imizwa, ukusebenzisana nokubekezela, ngale komata.")
    "My child is already at club level. How do they advance to the next level?" -> localized(answer, "Vordering volg gereelde klasse, vereiste tegnieke en graderings. Afrigters beoordeel vaardigheid, kennis, houding, toewyding en gereedheid.", "Inqubekela phambili ilandela amakilasi avamile, amasu adingekayo nokukleliswa. Abaqeqeshi bahlola ikhono, ulwazi, isimo sengqondo, ukuzibophezela nokulungela.")
    "Is Judo a registered and recognised sport?" -> localized(answer, "Ja. Judo is 'n erkende Olimpiese sport met internasionale, nasionale en provinsiale beheerstrukture, insluitend Judo South Africa.", "Yebo. I-Judo ngumdlalo wama-Olympic owaziwayo onezinhlaka zokuphatha zamazwe ngamazwe, zikazwelonke nezesifundazwe, okubandakanya i-Judo South Africa.")
    else -> answer
}

@Composable
fun WebsiteFaq(onContactClick: () -> Unit) {
    var expandedIndex by rememberSaveable { mutableStateOf<Int?>(null) }
    WrjaSectionHeading(
        localized("Frequently asked questions", "Gereelde vrae", "Imibuzo evame ukubuzwa"),
        localized("Everything you need to know before stepping on the mat.", "Alles wat jy moet weet voordat jy op die mat stap.", "Konke odinga ukukwazi ngaphambi kokungena emateni."),
        localized("Clear guidance for new judoka, parents and returning athletes.", "Duidelike leiding vir nuwe judoka, ouers en terugkerende atlete.", "Isiqondiso esicacile sama-judoka amasha, abazali nabasubathi ababuyayo.")
    )
    Spacer(Modifier.height(18.dp))
    websiteFaqs.forEachIndexed { index, item ->
        val expanded = expandedIndex == index
        Card(
            onClick = { expandedIndex = if (expanded) null else index },
            modifier = Modifier.fillMaxWidth().padding(bottom = 10.dp).wrjaReveal(index),
            colors = CardDefaults.cardColors(containerColor = WrjaCard),
            border = BorderStroke(1.dp, if (expanded) WrjaGold else WrjaCardBorder),
            elevation = CardDefaults.cardElevation(defaultElevation = 5.dp, pressedElevation = 2.dp)
        ) {
            Column(Modifier.padding(17.dp)) {
                Row(verticalAlignment = Alignment.Top) {
                    Text(
                        text = item.localizedQuestion(),
                        modifier = Modifier.weight(1f),
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(Modifier.width(12.dp))
                    Text(if (expanded) "−" else "+", color = WrjaGold, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                }
                AnimatedVisibility(
                    visible = expanded,
                    enter = expandVertically(),
                    exit = shrinkVertically()
                ) {
                    Column {
                        Spacer(Modifier.height(12.dp))
                        Text(item.localizedAnswer(), color = WrjaMuted, style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
        }
    }
    Spacer(Modifier.height(8.dp))
    WrjaContentCard(Modifier.fillMaxWidth().wrjaReveal(4)) {
        Column(Modifier.padding(18.dp)) {
            Text(localized("STILL HAVE A QUESTION?", "HET JY NOG 'N VRAAG?", "USENOMBHUZO?"), color = WrjaGold, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.ExtraBold)
            Spacer(Modifier.height(6.dp))
            Text(localized("Send WRJA a message and we’ll get back to you.", "Stuur vir WRJA 'n boodskap en ons sal na jou terugkeer.", "Thumela i-WRJA umlayezo futhi sizobuyela kuwe."), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(14.dp))
            Button(
                onClick = onContactClick,
                colors = ButtonDefaults.buttonColors(containerColor = WrjaGold, contentColor = Color(0xFF090909))
            ) {
                Text(localized("CONTACT US", "KONTAK ONS", "XHUMANA NATHI"), fontWeight = FontWeight.ExtraBold)
            }
        }
    }
}

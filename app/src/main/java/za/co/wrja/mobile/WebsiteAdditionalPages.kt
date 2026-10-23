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
        Text("← Back to Events hub", color = WrjaGold, fontWeight = FontWeight.Bold)
    }
    Spacer(Modifier.height(10.dp))
    WrjaSectionHeading("Events / $title", title, description)
    Spacer(Modifier.height(20.dp))
}

@Composable
fun WebsiteStandardEvents(onBack: () -> Unit) {
    WebsiteEventCategoryHeader(
        title = "Standard events",
        description = "Upcoming WRJA gradings, training camps and association events.",
        onBack = onBack
    )
    SupabaseEvents()
}

@Composable
fun WebsiteEventsCalendar(onBack: () -> Unit) {
    WebsiteEventCategoryHeader(
        title = "Calendar",
        description = "Keep track of upcoming WRJA events and important dates.",
        onBack = onBack
    )
    Text("UPCOMING WRJA EVENTS", color = WrjaGold, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.ExtraBold)
    Spacer(Modifier.height(10.dp))
    SupabaseEvents()
    Spacer(Modifier.height(20.dp))
    Text("COMPETITION DATES", color = WrjaGold, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.ExtraBold)
    Spacer(Modifier.height(10.dp))
    CompetitionCalendar()
}

@Composable
fun WebsiteSchoolsEvents(
    onBack: () -> Unit,
    onRegistrationClick: () -> Unit
) {
    WebsiteEventCategoryHeader(
        title = "Schools",
        description = "School-focused competition opportunities for developing judoka across the West Rand and Gauteng.",
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
                Text("SCHOOL JUDO", color = WrjaGold, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.ExtraBold)
                Spacer(Modifier.height(5.dp))
                Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(8.dp))
                Text(copy, color = WrjaMuted, style = MaterialTheme.typography.bodyMedium)
                Spacer(Modifier.height(14.dp))
                Text("VIEW REGISTRATION & PAYMENT  →", color = WrjaGold, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.ExtraBold)
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
        Text("← Events hub", color = WrjaGold, fontWeight = FontWeight.Bold)
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
            Text("WRJA MERCH / OFFICIAL COLLECTION", color = WrjaGold, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.ExtraBold)
            Spacer(Modifier.height(7.dp))
            Text("Represent the club.\nOn and off the mat.", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(8.dp))
            Text("Official WRJA apparel and club prints for athletes, coaches, families and supporters.", color = WrjaMuted)
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
            Text("THE WRJA COLLECTION", color = WrjaGold, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.ExtraBold)
            Spacer(Modifier.height(4.dp))
            Text("Club essentials", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
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
            Text("ORDER BY ENQUIRY", color = WrjaMuted, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
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
fun WebsiteFaq(onContactClick: () -> Unit) {
    var expandedIndex by rememberSaveable { mutableStateOf<Int?>(null) }
    WrjaSectionHeading(
        "Frequently asked questions",
        "Everything you need to know before stepping on the mat.",
        "Clear guidance for new judoka, parents and returning athletes."
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
                        text = item.question,
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
                        Text(item.answer, color = WrjaMuted, style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
        }
    }
    Spacer(Modifier.height(8.dp))
    WrjaContentCard(Modifier.fillMaxWidth().wrjaReveal(4)) {
        Column(Modifier.padding(18.dp)) {
            Text("STILL HAVE A QUESTION?", color = WrjaGold, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.ExtraBold)
            Spacer(Modifier.height(6.dp))
            Text("Send WRJA a message and we’ll get back to you.", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(14.dp))
            Button(
                onClick = onContactClick,
                colors = ButtonDefaults.buttonColors(containerColor = WrjaGold, contentColor = Color(0xFF090909))
            ) {
                Text("CONTACT US", fontWeight = FontWeight.ExtraBold)
            }
        }
    }
}

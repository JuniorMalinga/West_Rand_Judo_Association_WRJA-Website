# West Rand Judo Association (WRJA) Mobile Application

## PROG7314 – Programming 3B

### Group 1 – Part 2

The **West Rand Judo Association (WRJA) Mobile Application** is an Android application developed for the West Rand Judo Association. The application provides athletes, parents, guardians, and members with a centralised platform for accessing information about WRJA, viewing events and programmes, managing member information, making bookings, viewing news and galleries, and communicating with the association.

The application was developed using **Android Studio, Kotlin and Jetpack Compose**, with **Supabase** used for authentication and cloud-based data access.

---

## 1. Project Overview

The purpose of the WRJA mobile application is to support the digital transformation of the West Rand Judo Association by providing users with easy access to association and club information through a modern Android application.

The application provides a user-friendly interface that allows users to:

* View information about WRJA
* View judo programmes
* View upcoming events and competitions
* View news and achievements
* Browse the photo gallery
* View instructor and club information
* Contact WRJA clubs
* Book a training programme or trial
* Register and log in to the application
* Manage member profile information
* Support athlete and guardian accounts
* Change the application language
* Use the built-in WRJA chat assistant
* Access information in English, Afrikaans and isiZulu

---

## 2. Technologies Used

The following technologies and tools were used to develop the application:

| Technology            | Purpose                                  |
| --------------------- | ---------------------------------------- |
| Kotlin                | Primary programming language             |
| Android Studio        | Development environment                  |
| Jetpack Compose       | User interface development               |
| Material 3            | UI components and design                 |
| Supabase              | Authentication and cloud database access |
| Kotlin Coroutines     | Asynchronous operations                  |
| Android Biometric API | Biometric authentication support         |
| Coil                  | Image loading                            |
| JSON                  | Data exchange with Supabase              |
| REST API              | Communication with Supabase              |
| GitHub                | Source control and collaboration         |
| GitHub Actions        | Automated project workflow/testing       |

---

## 3. Application Architecture

The application follows a modular structure where different Kotlin files are responsible for different areas of functionality.

The main application package is:

```text
za.co.wrja.mobile
```

The main components include:

```text
app/
└── src/
    └── main/
        └── java/
            └── za/
                └── co/
                    └── wrja/
                        └── mobile/
                            ├── MainActivity.kt
                            ├── BookScreen.kt
                            ├── LanguageSupport.kt
                            ├── SupabaseAbout.kt
                            ├── SupabaseAuth.kt
                            ├── SupabaseAuthScreen.kt
                            ├── SupabaseContact.kt
                            ├── SupabaseEvents.kt
                            ├── SupabaseGallery.kt
                            ├── SupabaseMembers.kt
                            ├── SupabaseNews.kt
                            ├── SupabasePrograms.kt
                            ├── SupasbaseMemberProfile.kt
                            └── WebsiteReferenceContent.kt
```

The application uses Jetpack Compose for the user interface, while Supabase REST endpoints are used to retrieve and update cloud-based information.

---

# 4. Main Features

## 4.1 Home

The Home screen provides an introduction to the West Rand Judo Association.

It highlights the association's values:

* Discipline
* Respect
* Excellence

The home screen also provides access to the main sections of the application through the navigation drawer.

---

## 4.2 User Authentication

Users can register and log into the application.

Authentication is integrated with Supabase and provides a foundation for secure member-specific functionality.

The authentication functionality supports:

* User registration
* User login
* User logout
* Session-based access
* Member-specific profile information
* Athlete accounts
* Guardian accounts

The application also includes support for biometric authentication through Android's biometric APIs.

---

## 4.3 Member Profiles

Authenticated users can access the **My Profile** section.

The application retrieves member information from Supabase and displays relevant information based on the user's profile.

Athlete information can include:

* First name
* Last name
* Date of birth
* Member number
* Weight category
* Group category
* Active status

Guardian accounts can also be associated with children through the member relationship functionality.

Users can update supported profile information and save changes back to the database.

---

## 4.4 Judo Programmes

The application provides information about the available judo programmes.

Programmes include:

### Kids Judo

A programme designed to introduce children and young athletes to judo in a structured and supportive environment.

The programme focuses on:

* Balance
* Safe falling
* Basic judo techniques
* Discipline
* Confidence
* Respect

### Adult Judo

A programme designed for beginners through to competitive judoka.

Training can include:

* Standing techniques
* Groundwork
* Conditioning
* Judo fundamentals
* Competition preparation

### Women's Judo

A programme designed to provide a supportive environment for women to participate, train and develop in judo.

---

## 4.5 Events

The application contains an Events section for association activities.

Events can include:

* Competitions
* Club gradings
* Training activities
* Training camps
* Association events

The application includes a calendar-style interface for displaying event information.

Supabase integration is also used to retrieve event information.

---

## 4.6 News

The News section provides users with WRJA-related news and achievements.

Examples include:

* Competition results
* Athlete achievements
* African Cup results
* National competition results
* Club announcements

The application displays news articles with:

* Images
* Dates
* Categories
* Titles
* Descriptions

---

## 4.7 Gallery

The Gallery provides users with photographs related to WRJA activities.

Gallery content includes:

* Kids Judo
* Adult Judo
* Competitions
* Training sessions
* Athlete achievements

The application contains built-in gallery images while also supporting retrieval of gallery content from Supabase.

---

## 4.8 About WRJA

The About section provides information about the association, its instructors, facilitators and affiliated clubs.

Instructor information can include:

* Name
* Role
* Judo rank
* Qualifications
* Specialisations
* Biography

The application also provides information about WRJA-affiliated clubs.

---

## 4.9 Contact

The Contact section provides users with information for contacting WRJA and its affiliated clubs.

The application includes contact information for:

* Golden Score Judo Dojo
* KJK Judo
* West Rand Judo Association

Users can also access a contact form containing:

* Name
* Email address
* Message

---

## 4.10 Booking

The application includes a booking interface that allows users to enter information for a training session or trial.

The booking screen allows users to provide:

* Programme
* Full name
* Email address
* Phone number
* Preferred payment method
* Preferred date
* Preferred time
* Additional notes

Date and time selection is supported through Android date and time picker components.

---

## 4.11 Chat Assistant

The application includes a built-in WRJA Chat Assistant.

The assistant provides users with quick information about topics such as:

* Judo
* Judo uniforms
* Competitions
* Techniques
* Locations
* Coaches
* Parents and guardians
* Programmes
* Trial sessions
* Events
* Contact information
* Training schedules
* Fees
* Age groups
* Belts and grading
* Safety
* Membership

The chat assistant also supports suggested questions to help users quickly find information.

The current assistant uses locally defined responses and is structured so that a remote chat service can be integrated in the future.

---

# 5. Multilingual Support

The application supports three languages:

1. English
2. Afrikaans
3. isiZulu

Users can change the application language through the language settings.

The selected language is stored locally using Android SharedPreferences so that the user's language preference can be retained.

Examples of translated application sections include:

* Home
* My Profile
* About
* Events
* Programmes
* Book
* News
* Gallery
* Contact
* Chat Assistant
* Login
* Logout

---

# 6. Supabase Integration

Supabase is used as the application's cloud backend.

The application communicates with Supabase through REST API requests.

Supabase functionality includes:

* Authentication
* User profiles
* Athlete information
* Guardian information
* Events
* News
* Gallery
* Programmes
* Instructor information
* Club information
* Member data

The application uses HTTP requests and JSON responses to communicate with Supabase.

---

# 7. Database-Related Data

The application interacts with several data structures through Supabase.

These include:

```text
profiles
athletes
guardians
events
news
gallery
programs
instructors
clubs
```

The exact available records depend on the data configured in the Supabase project.

---

# 8. User Roles

The application supports different types of users.

### Athlete

Athletes can access their member information and relevant WRJA content.

### Guardian

Guardians can manage their account and access information associated with linked children.

### General User

Users who are not authenticated can access general WRJA information such as:

* About
* Programmes
* Events
* News
* Gallery
* Contact information

Authentication is required for member-specific functionality.

---

# 9. User Interface

The application was developed using **Jetpack Compose** and **Material 3**.

The design uses WRJA-inspired branding with:

* Dark charcoal
* Gold
* White
* Clean card-based layouts
* Navigation drawer
* Responsive Compose layouts
* Image-based content
* Animated page transitions

The navigation drawer provides access to:

```text
Home
My Profile
About
Events
Programs
Book
News
Gallery
Contact
Chat Assistant
Log Out
```

---

# 10. Project Requirements

To run the application, the following software is recommended:

* Android Studio
* Android SDK
* JDK 21
* Android device or Android Emulator
* Internet connection for Supabase functionality

The application has:

```text
compileSdk = 35
targetSdk = 35
minSdk = 24
Java = 21
Kotlin JVM Target = 21
```

---

# 11. How to Run the Application

## Step 1 – Clone or Download the Repository

Clone the project from GitHub or download the project ZIP file.

```bash
git clone <repository-url>
```

Alternatively, open the downloaded project directly in Android Studio.

---

## Step 2 – Open the Project

Open **Android Studio** and select:

```text
File → Open
```

Select the project directory:

```text
prog7314-gr1-2026-prog7314-part2-st10440180-main
```

Allow Android Studio to complete the Gradle synchronisation.

---

## Step 3 – Check the Android SDK

Ensure that Android SDK 35 is installed.

The project uses:

```text
compileSdk 35
targetSdk 35
```

---

## Step 4 – Select a Device

Select either:

* An Android Emulator
* A connected Android device

The device should run Android API level 24 or higher.

---

## Step 5 – Run the Application

Click the **Run ▶** button in Android Studio.

Android Studio will build and install the application on the selected device.

---

# 12. Supabase Configuration

The application connects to the WRJA Supabase project using the Supabase URL and public client key configured in the application.

The Supabase configuration is used for REST API requests and authentication.

For production deployment, sensitive configuration should be moved to secure environment configuration rather than being hard-coded into the source code.

---

# 13. Important Notes

Some application functionality is currently implemented as presentation/demo functionality while other functionality is connected to the Supabase backend.

For example:

* The Events calendar contains presentation content while backend event retrieval is also supported.
* Some contact and booking interfaces currently provide the user interface and data-entry functionality.
* The Chat Assistant currently uses locally defined responses.
* Gallery content can include built-in images as fallback content.
* Some administrative/content-management functionality would require a dedicated backend administration interface.

These areas provide a foundation for future development.

---

# 14. Error Handling

The application includes error handling for operations involving Supabase and network communication.

Examples include:

* Connection errors
* Authentication errors
* Missing user profiles
* Missing database records
* Access-denied responses
* Failed save operations

Users are provided with feedback when an operation cannot be completed.

---

# 15. Security Considerations

The application uses Supabase authentication for user identity and access to member functionality.

For production deployment, the following security practices should be maintained:

* Use Supabase Row Level Security (RLS)
* Apply appropriate database access policies
* Do not expose private API keys
* Use environment variables or secure configuration for secrets
* Validate user input
* Restrict member information to authorised users
* Protect administrative functionality
* Use HTTPS for network communication

---

# 16. Future Improvements

Potential future enhancements include:

* Full push notification support
* Complete online payment integration
* Advanced event registration
* Automated booking confirmations
* Administrative content management
* Real-time chat functionality
* Full gallery administration
* Improved offline support
* Expanded biometric authentication
* More detailed athlete grading history
* Competition registration
* Automated email notifications
* iOS application support
* Improved analytics and reporting

---

# 17. Testing

The application should be tested across the following areas:

### Authentication Testing

* Register a new account
* Log in with valid credentials
* Attempt login with invalid credentials
* Log out
* Test authenticated and unauthenticated access

### Profile Testing

* Load member profile
* Display athlete information
* Display guardian information
* Update profile information
* Save changes

### Navigation Testing

Test all navigation drawer options:

```text
Home
My Profile
About
Events
Programs
Book
News
Gallery
Contact
Chat Assistant
```

### Booking Testing

Test:

* Programme selection
* Date selection
* Time selection
* Contact information
* Payment method selection
* Validation

### Language Testing

Switch between:

```text
English
Afrikaans
isiZulu
```

and confirm that supported interface text changes accordingly.

---

# 18. Project Structure

```text
PROG7314 WRJA
│
├── .github
│   └── workflows
│       └── autograde.yaml
│
├── app
│   ├── build.gradle.kts
│   └── src
│       └── main
│           ├── AndroidManifest.xml
│           ├── java
│           │   └── za.co.wrja.mobile
│           │       ├── MainActivity.kt
│           │       ├── BookScreen.kt
│           │       ├── LanguageSupport.kt
│           │       ├── SupabaseAbout.kt
│           │       ├── SupabaseAuth.kt
│           │       ├── SupabaseAuthScreen.kt
│           │       ├── SupabaseContact.kt
│           │       ├── SupabaseEvents.kt
│           │       ├── SupabaseGallery.kt
│           │       ├── SupabaseMembers.kt
│           │       ├── SupabaseNews.kt
│           │       ├── SupabasePrograms.kt
│           │       ├── SupasbaseMemberProfile.kt
│           │       └── WebsiteReferenceContent.kt
│           │
│           └── res
│               └── drawable
│                   └── WRJA images and application assets
│
├── .gitignore
├── .classroom50.yaml
├── gradle files
└── README.md
```

---

# 19. Team Project

This project was developed as part of **PROG7314 – Programming 3B**.

### Project

**West Rand Judo Association Mobile Application**

### Module

**PROG7314 – Programming 3B**

### Group

**Group 1**

### Student Number

**ST10440180**

---

# 20. Conclusion

The WRJA Mobile Application provides a centralised digital platform for the West Rand Judo Association.

The application combines a modern Android interface with cloud-based functionality to provide users with access to association information, programmes, events, news, gallery content, member profiles, bookings, contact information and a chat assistant.

The project demonstrates the use of **Kotlin, Jetpack Compose, Material 3, Supabase, REST APIs, authentication, asynchronous programming and Android development practices** to create a functional mobile solution for a real-world organisation.

---

## Licence

This project was developed for academic purposes as part of the PROG7314 module.

© 2026 West Rand Judo Association Project – PROG7314 Group 1

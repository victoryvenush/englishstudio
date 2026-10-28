import type { Difficulty, PracticeItem, QuizQuestion, Topic } from "./types";

const p = (
  prompt: string,
  answer: string,
  wrong: [string, string, string],
  explanation: string,
  takeaway: string,
  type: PracticeItem["type"] = "multiple-choice",
): PracticeItem => ({
  prompt,
  answer,
  options: [answer, ...wrong],
  explanation,
  takeaway,
  type,
});

export const TOPICS: Topic[] = [
  {
    id: "relative-pronouns",
    number: 1,
    name: "Combining Sentences with Relative Pronouns",
    category: "Grammar",
    icon: "Combine",
    color: "indigo",
    summary: "Join ideas smoothly with who, which, that, whose and where.",
    lesson: [
      "A relative pronoun introduces a clause that describes a noun. It helps combine two related sentences without repeating the noun.",
      "Use who for people, which for things, whose to show possession, and where for places. That can refer to people or things in defining clauses.",
      "Do not add a second subject when the relative pronoun already performs that job. Keep the meaning of both original sentences.",
    ],
    keyRule: "Use a relative pronoun to connect a noun to information that describes it.",
    examples: [
      { before: "I met a girl. She won the science prize.", after: "I met a girl who won the science prize.", note: "Who replaces the repeated subject she." },
      { before: "This is the book. I borrowed it yesterday.", after: "This is the book that I borrowed yesterday.", note: "That links the object book to its describing clause." },
      { before: "We visited a village. My grandparents live there.", after: "We visited the village where my grandparents live.", note: "Where refers to a place." },
      { before: "The boy is my cousin. His bicycle was stolen.", after: "The boy whose bicycle was stolen is my cousin.", note: "Whose shows possession." },
    ],
    mistakes: [
      { before: "I know a player who he scored the goal.", after: "I know a player who scored the goal.", note: "Do not repeat the subject after who." },
      { before: "This is the school which I studied.", after: "This is the school where I studied.", note: "Use where for a place in which an action happens." },
    ],
    practice: [
      p("The woman ___ teaches us English is from Delhi.", "who", ["whose", "where", "which"], "The relative pronoun refers to a person acting as the subject.", "Use who for people." , "fill-blank"),
      p("Choose the sentence that combines: I found a pen. It belongs to Riya.", "I found a pen that belongs to Riya.", ["I found a pen who belongs to Riya.", "I found a pen where belongs to Riya.", "I found a pen, it belongs to Riya."], "That can refer to a thing and joins the two ideas.", "Use that or which for things.", "transformation"),
      p("Which pronoun shows that a bag belongs to a student?", "whose", ["who", "which", "where"], "Whose is the possessive relative pronoun.", "Whose signals ownership."),
      p("We went to the park ___ the festival was held.", "where", ["whose", "who", "which"], "The clause gives information about a place.", "Use where to describe a place.", "fill-blank"),
      p("Select the correct clause: the cake ___ I baked", "that I baked", ["who I baked", "where I baked", "whose I baked"], "The pronoun refers to the cake, a thing and the object of baked.", "Match the relative pronoun to its noun and role.", "matching"),
    ],
    flashcards: [
      { id: "rel-who", front: "Which relative pronoun usually refers to a person?", back: "Who" },
      { id: "rel-whose", front: "Which relative pronoun shows possession?", back: "Whose" },
      { id: "rel-where", front: "Which relative pronoun refers to a place?", back: "Where" },
    ],
  },
  {
    id: "active-passive",
    number: 2,
    name: "Active and Passive Voice",
    category: "Grammar",
    icon: "ArrowLeftRight",
    color: "violet",
    summary: "Shift focus from the doer to the action or its receiver.",
    lesson: [
      "In an active sentence, the subject performs the action. In a passive sentence, the receiver of the action becomes the subject.",
      "Form the passive with the correct tense of be plus the past participle. Keep the original tense and include a by-phrase only when the doer matters.",
      "Only verbs with an object can normally be changed into the passive. The object in the active sentence becomes the passive subject.",
    ],
    keyRule: "Passive voice = the correct form of be + past participle.",
    examples: [
      { before: "The chef prepares the meal.", after: "The meal is prepared by the chef.", note: "Present simple passive uses is + prepared." },
      { before: "They repaired the road last week.", after: "The road was repaired last week.", note: "Past simple passive uses was + repaired." },
      { before: "Maya will submit the form.", after: "The form will be submitted by Maya.", note: "Future passive uses will be + submitted." },
      { before: "The team has completed the task.", after: "The task has been completed by the team.", note: "Present perfect passive uses has been + completed." },
    ],
    mistakes: [
      { before: "The window was broke by the ball.", after: "The window was broken by the ball.", note: "Use the past participle, not the simple past form." },
      { before: "The letter is wrote every day.", after: "The letter is written every day.", note: "The passive needs be plus the past participle." },
    ],
    practice: [
      p("Choose the passive form: The nurse checks the patient.", "The patient is checked by the nurse.", ["The patient checked the nurse.", "The patient was checked by the nurse.", "The patient is checking the nurse."], "The present simple is retained with is + past participle.", "Keep the tense when changing voice.", "transformation"),
      p("The match ___ by our school yesterday.", "was won", ["is won", "has win", "won"], "Yesterday indicates past simple; passive form is was + won.", "Use was or were + past participle for past simple passive.", "fill-blank"),
      p("What is the past participle of write?", "written", ["wrote", "writing", "writes"], "Written is the past participle needed after a form of be.", "Check irregular participles carefully.", "word-form"),
      p("Choose the passive sentence: The guide showed us the museum.", "We were shown the museum by the guide.", ["The guide was shown us the museum.", "We show the museum to the guide.", "The museum showed us the guide."], "The object us becomes the subject and the verb uses were shown.", "Move the receiver of the action to subject position.", "transformation"),
      p("Which sentence can normally be made passive?", "The dog chased the ball.", ["The baby slept peacefully.", "The sun rises early.", "The children laughed loudly."], "Chased has a direct object, the ball.", "A passive transformation normally needs an object.", "multiple-choice"),
    ],
    flashcards: [
      { id: "voice-formula", front: "What is the basic passive voice formula?", back: "A form of be + past participle" },
      { id: "voice-object", front: "What usually becomes the subject in a passive sentence?", back: "The active sentence's object" },
      { id: "voice-doer", front: "Which preposition introduces the doer in a passive sentence?", back: "By" },
    ],
  },
  {
    id: "reported-speech",
    number: 3,
    name: "Direct and Indirect Speech",
    category: "Grammar",
    icon: "MessagesSquare",
    color: "coral",
    summary: "Report what someone said while adjusting tense, pronouns and time words.",
    lesson: [
      "Direct speech repeats a speaker's exact words inside quotation marks. Indirect, or reported, speech conveys the message without quoting it exactly.",
      "When the reporting verb is in the past, the tense often moves one step back: present simple to past simple and will to would. Pronouns and time expressions change to fit the new speaker and time.",
      "Reported questions use statement word order and no question mark inside the reported clause. Commands commonly use told or asked + object + to-infinitive.",
    ],
    keyRule: "Reported speech may shift tense, pronouns and time expressions to match the reporting situation.",
    examples: [
      { before: "Asha said, 'I am tired.'", after: "Asha said that she was tired.", note: "Am changes to was and I changes to she." },
      { before: "He said, 'I will call you tomorrow.'", after: "He said that he would call me the next day.", note: "Will changes to would and tomorrow to the next day." },
      { before: "Mina asked, 'Where do you live?'", after: "Mina asked me where I lived.", note: "Reported questions use statement word order." },
      { before: "Dad said, 'Close the window.'", after: "Dad told me to close the window.", note: "A reported command uses told + object + to-infinitive." },
    ],
    mistakes: [
      { before: "She asked me where did I live.", after: "She asked me where I lived.", note: "Do not keep question word order in a reported question." },
      { before: "Ravi said that he will come the next day.", after: "Ravi said that he would come the next day.", note: "After a past reporting verb, will commonly changes to would." },
    ],
    practice: [
      p("Change to reported speech: Nila said, 'I like this song.'", "Nila said that she liked that song.", ["Nila said that I like this song.", "Nila said she likes this song yesterday.", "Nila asked that she liked that song."], "The pronoun changes and present simple shifts to past simple.", "Match pronouns and tense to the reporter.", "transformation"),
      p("He said, 'I can swim.' He said that he ___ swim.", "could", ["can", "will", "would"], "Can usually changes to could after a past reporting verb.", "Modal verbs often shift back in reported speech.", "fill-blank"),
      p("Choose the correct reported question: 'Are you ready?'", "She asked if I was ready.", ["She asked was I ready.", "She asked that are you ready.", "She said if I am ready?"], "Yes/no questions use if or whether and statement word order.", "Reported questions do not invert subject and verb.", "transformation"),
      p("Report the command: 'Please sit down,' the teacher said to us.", "The teacher asked us to sit down.", ["The teacher asked that we sat down.", "The teacher told sit down us.", "The teacher said us sitting down."], "A polite command uses asked + object + to-infinitive.", "Use an object before the to-infinitive.", "transformation"),
      p("In reported speech, 'yesterday' commonly changes to ___.", "the previous day", ["tomorrow", "this day", "next week"], "The time word changes to reflect the later reporting time.", "Adjust time expressions when the context changes.", "matching"),
    ],
    flashcards: [
      { id: "speech-can", front: "What does can commonly become after a past reporting verb?", back: "Could" },
      { id: "speech-question", front: "What word order do reported questions use?", back: "Statement word order" },
      { id: "speech-command", front: "What structure commonly reports a command?", back: "Told or asked + object + to-infinitive" },
    ],
  },
  {
    id: "prepositions",
    number: 4,
    name: "Prepositions",
    category: "Grammar",
    icon: "MapPin",
    color: "mint",
    summary: "Show relationships of time, place, direction and connection.",
    lesson: [
      "Prepositions show how a noun or pronoun relates to another word. Common groups describe time, place, movement and other relationships.",
      "Use at for precise times and points, on for days and surfaces, and in for longer periods or enclosed spaces. These patterns are useful but fixed expressions can vary.",
      "A preposition is followed by a noun, pronoun or gerund. Learn common adjective-preposition and verb-preposition combinations as phrases.",
    ],
    keyRule: "Use at for a point, on for a day or surface, and in for a period or enclosed place.",
    examples: [
      { before: "The train leaves ___ 6:30.", after: "The train leaves at 6:30.", note: "At introduces a precise time." },
      { before: "Our final exam is ___ Monday.", after: "Our final exam is on Monday.", note: "On is used with days and dates." },
      { before: "The keys are ___ the drawer.", after: "The keys are in the drawer.", note: "In describes an enclosed space." },
      { before: "She is good ___ solving puzzles.", after: "She is good at solving puzzles.", note: "Good at is a common adjective-preposition phrase." },
    ],
    mistakes: [
      { before: "We arrived to the station at noon.", after: "We arrived at the station at noon.", note: "Arrive at is used for a specific place." },
      { before: "He is interested on astronomy.", after: "He is interested in astronomy.", note: "The fixed expression is interested in." },
    ],
    practice: [
      p("Our class begins ___ 8 o'clock.", "at", ["in", "on", "by"], "At is used for a precise clock time.", "Use at for specific times.", "fill-blank"),
      p("The library is closed ___ Sundays.", "on", ["at", "in", "by"], "On is used before days of the week.", "Use on with days and dates.", "fill-blank"),
      p("My grandparents live ___ a small village.", "in", ["at", "on", "by"], "In can describe being inside an area or place.", "Use in for towns, cities and enclosed spaces.", "fill-blank"),
      p("Choose the correct phrase.", "She is afraid of spiders.", ["She is afraid from spiders.", "She is afraid at spiders.", "She is afraid with spiders."], "Afraid of is the standard adjective-preposition combination.", "Learn prepositions as part of the full phrase.", "matching"),
      p("Which sentence uses a preposition correctly?", "They walked across the bridge.", ["They walked across to the bridge it.", "They walked in across bridge.", "They walked at the bridge across."], "Across expresses movement from one side to another.", "Choose a preposition that matches the relationship.", "multiple-choice"),
    ],
    flashcards: [
      { id: "prep-point", front: "Which preposition is commonly used for a precise time?", back: "At" },
      { id: "prep-day", front: "Which preposition is commonly used with days?", back: "On" },
      { id: "prep-period", front: "Which preposition is commonly used with months and years?", back: "In" },
    ],
  },
  {
    id: "editing-passages",
    number: 5,
    name: "Editing Passages and Error Correction",
    category: "Grammar",
    icon: "FilePenLine",
    color: "sky",
    summary: "Read for meaning, locate one error at a time and make the smallest correction.",
    lesson: [
      "Editing asks you to identify and correct errors while keeping the writer's meaning. Read the complete sentence before deciding what is wrong.",
      "Check agreement, tense, articles, pronouns, prepositions and word forms in a consistent order. Use nearby words and time clues to test a possible correction.",
      "Make the smallest grammatical change that fixes the error. Re-read the sentence after editing to make sure it is natural and coherent.",
    ],
    keyRule: "Read the whole sentence, identify the rule that is broken, then make the smallest accurate correction.",
    examples: [
      { before: "The list of names are on the desk.", after: "The list of names is on the desk.", note: "The head noun list is singular." },
      { before: "She have finished her work.", after: "She has finished her work.", note: "A singular third-person subject takes has." },
      { before: "We discussed about the plan.", after: "We discussed the plan.", note: "Discuss takes a direct object without about." },
      { before: "He is a honest student.", after: "He is an honest student.", note: "Use an before a vowel sound." },
    ],
    mistakes: [
      { before: "Each of the players have a uniform.", after: "Each of the players has a uniform.", note: "Each is singular and takes a singular verb." },
      { before: "She did not went to school.", after: "She did not go to school.", note: "After did not, use the base form of the verb." },
    ],
    practice: [
      p("Find the correction: The news are encouraging.", "The news is encouraging.", ["The news were encouragingly.", "A news is encouraging.", "The news be encouraging."], "News is grammatically singular in standard English.", "Check the true subject before choosing a verb.", "error-identification"),
      p("Choose the correctly edited sentence.", "Each student has a notebook.", ["Each student have a notebook.", "Each students has a notebook.", "Each student having a notebook."], "Each is singular, so the verb is has.", "Each and every normally take singular agreement.", "error-identification"),
      p("Correct the verb: They did not ___ the instructions.", "follow", ["followed", "following", "follows"], "The auxiliary did carries the past tense; the main verb stays in base form.", "Use the base form after did or did not.", "word-form"),
      p("Choose the best editing habit.", "Read the complete sentence before changing a word.", ["Correct the first word that looks unfamiliar.", "Change several words at once.", "Ignore time markers and context."], "Context helps distinguish a real error from a correct form.", "Use sentence meaning as well as grammar clues.", "multiple-choice"),
      p("The children ___ playing outside when it began to rain.", "were", ["was", "is", "has"], "Children is plural and the action was in progress in the past.", "Use agreement and time clues together.", "fill-blank"),
    ],
    flashcards: [
      { id: "edit-first", front: "What should you read before correcting a passage?", back: "The complete sentence" },
      { id: "edit-change", front: "How much should you change when editing?", back: "The smallest amount that fixes the error" },
      { id: "edit-check", front: "Name one useful editing check.", back: "Agreement, tense, articles, pronouns, prepositions or word forms" },
    ],
  },
  {
    id: "tenses-verb-forms",
    number: 6,
    name: "Tenses and Verb Forms",
    category: "Grammar",
    icon: "Clock3",
    color: "indigo",
    summary: "Connect verb forms to when an action happens and how it unfolds.",
    lesson: [
      "Tense locates an action in time. Aspect shows whether it is habitual, ongoing, completed or connected to another time.",
      "Time markers such as since, already, while, yesterday and next week offer clues, but the whole meaning of the sentence determines the correct form.",
      "After auxiliaries such as do, does, did, can and will, use the base form. Perfect tenses use have or has plus a past participle; continuous forms use be plus an -ing form.",
    ],
    keyRule: "Choose the verb form that agrees with the subject and the time or aspect expressed by the whole sentence.",
    examples: [
      { before: "She ___ (study) English every evening.", after: "She studies English every evening.", note: "A repeated present habit uses present simple; third-person singular adds -s." },
      { before: "They ___ (wait) for an hour.", after: "They have been waiting for an hour.", note: "Present perfect continuous connects an ongoing action to now." },
      { before: "I ___ (see) that film last Friday.", after: "I saw that film last Friday.", note: "A finished past time uses the past simple." },
      { before: "By June, we ___ (finish) the project.", after: "By June, we will have finished the project.", note: "Future perfect describes completion before a future point." },
    ],
    mistakes: [
      { before: "He did not knows the answer.", after: "He did not know the answer.", note: "Did is followed by the base verb." },
      { before: "I have saw that movie before.", after: "I have seen that movie before.", note: "Have is followed by the past participle." },
    ],
    practice: [
      p("By the time we arrived, the film ___ .", "had started", ["has start", "will start", "starting"], "The film started before another past event, so past perfect fits.", "Use past perfect for the earlier of two past events.", "fill-blank"),
      p("She usually ___ to school by bus.", "goes", ["go", "is go", "went"], "Usually signals a habit; a singular subject takes goes.", "Present simple describes routines.", "word-form"),
      p("They ___ dinner when the lights went out.", "were having", ["have", "had have", "will have"], "The action was in progress when another past event interrupted it.", "Past continuous shows an action in progress in the past.", "fill-blank"),
      p("Choose the correct form: I have ___ my homework.", "done", ["did", "do", "doing"], "Present perfect uses have plus the past participle done.", "Learn irregular past participles.", "word-form"),
      p("Which time phrase usually signals the present perfect?", "since Monday", ["last year", "at 6 yesterday", "two days ago"], "Since Monday connects a starting point in the past to now.", "Use the time phrase and sentence meaning together.", "matching"),
    ],
    flashcards: [
      { id: "tense-perfect", front: "What follows have or has in a perfect tense?", back: "A past participle" },
      { id: "tense-continuous", front: "What form follows be in a continuous tense?", back: "A verb ending in -ing" },
      { id: "tense-did", front: "What form follows did or did not?", back: "The base form of the verb" },
    ],
  },
  {
    id: "used-to-would",
    number: 7,
    name: "Repeated Past Actions: Used to and Would",
    category: "Grammar",
    icon: "Repeat2",
    color: "coral",
    summary: "Describe past routines and states that are different now.",
    lesson: [
      "Used to + base verb describes past habits and past states that are no longer true or no longer happen.",
      "Would + base verb can describe repeated past actions, especially when the past time is already clear. It is not normally used for past states such as being or owning.",
      "For questions and negatives, use did + use to in standard school grammar: Did you use to...? and did not use to....",
    ],
    keyRule: "Use used to for past habits and states; use would for repeated past actions, not states.",
    examples: [
      { before: "I live near the beach, but not now.", after: "I used to live near the beach.", note: "Used to can describe a past state." },
      { before: "Every summer, Grandad tells us stories.", after: "Every summer, Grandad would tell us stories.", note: "Would describes a repeated past action in a clear time frame." },
      { before: "She played chess after school when she was younger.", after: "She used to play chess after school.", note: "Used to describes a past routine." },
      { before: "Did you ___ visit your aunt every winter?", after: "Did you use to visit your aunt every winter?", note: "Use the base form use to after did." },
    ],
    mistakes: [
      { before: "When I was ten, I would be very shy.", after: "When I was ten, I used to be very shy.", note: "Use used to, not would, for a past state." },
      { before: "Did you used to cycle to school?", after: "Did you use to cycle to school?", note: "Did already carries the past tense." },
    ],
    practice: [
      p("Which form can describe a past state?", "used to", ["would", "will", "had"], "Used to can describe a state that is no longer true.", "Would is for repeated actions, not states.", "multiple-choice"),
      p("Every weekend, we ___ visit the old market.", "would", ["would to", "use", "are used"], "Would + base verb describes a repeated action in a clear past context.", "Use would for repeated past actions.", "fill-blank"),
      p("Choose the correct question.", "Did she use to play tennis?", ["Did she used to play tennis?", "Used she to play tennis?", "Did she use play tennis?"], "After did, use the base form use.", "Did + subject + use to + base verb.", "transformation"),
      p("I ___ have long hair, but I cut it last year.", "used to", ["would", "am used to", "will"], "Having long hair is a past state, so used to is the natural choice.", "Use used to for past conditions and states.", "fill-blank"),
      p("Which sentence uses would correctly?", "After dinner, we would play cards together.", ["I would own a red bicycle.", "She would be tall as a child.", "He would know the answer yesterday."], "Play is a repeated past action in a known context.", "Would needs a repeated action and clear past context.", "multiple-choice"),
    ],
    flashcards: [
      { id: "used-state", front: "Which form can describe a past state that changed?", back: "Used to" },
      { id: "would-action", front: "What kind of past activity can would describe?", back: "A repeated past action" },
      { id: "used-negative", front: "After did, do we write used to or use to?", back: "Use to" },
    ],
  },
  {
    id: "noun-modifiers",
    number: 8,
    name: "Noun Modifiers",
    category: "Grammar",
    icon: "TextCursorInput",
    color: "violet",
    summary: "Add precise detail before a noun with adjectives and modifier nouns.",
    lesson: [
      "A noun modifier gives information about another noun. Adjectives and other nouns can appear before the main noun: a wooden desk, a school library.",
      "In a noun phrase, identify the head noun first. The modifiers narrow or describe its meaning, but the head noun usually determines subject-verb agreement.",
      "Use hyphens in some compound modifiers before a noun when needed for clarity, such as a well-known writer. Do not pluralize a noun used as a modifier in most simple combinations.",
    ],
    keyRule: "Find the head noun; the words before it modify its meaning, while the head noun controls agreement.",
    examples: [
      { before: "a desk made of wood", after: "a wooden desk", note: "The adjective wooden modifies the head noun desk." },
      { before: "a library in the school", after: "a school library", note: "School is a noun modifier; library is the head noun." },
      { before: "a writer known by many people", after: "a well-known writer", note: "A compound modifier appears before the head noun." },
      { before: "a bag for travel", after: "a travel bag", note: "Travel modifies the head noun bag." },
    ],
    mistakes: [
      { before: "The sports equipments are new.", after: "The sports equipment is new.", note: "Equipment is uncountable; sport is a noun modifier." },
      { before: "The school libraries is open.", after: "The school library is open.", note: "Library is the singular head noun and controls the verb." },
    ],
    practice: [
      p("Identify the head noun in 'a bright classroom window'.", "window", ["bright", "classroom", "a"], "Window is the main object; bright and classroom modify it.", "The head noun is the central noun in a phrase.", "multiple-choice"),
      p("Choose the natural noun-modifier phrase.", "a school bus", ["a schools bus", "a bus school", "a school's bus"], "School modifies bus and normally remains singular.", "Nouns used as modifiers are usually singular.", "matching"),
      p("In 'The science books are heavy', which word controls the verb?", "books", ["science", "heavy", "the"], "Books is the head noun and is plural.", "Agreement follows the head noun, not a modifier.", "multiple-choice"),
      p("Change 'a table made of glass' into a noun phrase.", "a glass table", ["a table glass", "a glasses table", "a table of glass-made"], "Glass modifies the noun table.", "A modifier usually comes before the head noun.", "transformation"),
      p("Choose the correct sentence.", "The language lesson begins at nine.", ["The languages lesson begin at nine.", "The language lessons begins at nine.", "The lesson language begin at nine."], "Lesson is the singular head noun, so begins agrees with it.", "Identify the head noun before choosing agreement.", "error-identification"),
    ],
    flashcards: [
      { id: "noun-head", front: "Which noun usually controls subject-verb agreement in a noun phrase?", back: "The head noun" },
      { id: "noun-modifier", front: "What does a noun modifier do?", back: "It adds information to another noun" },
      { id: "noun-order", front: "Where does a simple noun modifier usually appear?", back: "Before the head noun" },
    ],
  },
  {
    id: "language-functions",
    number: 9,
    name: "Giving Advice and Language Functions",
    category: "Grammar",
    icon: "MessageCircleHeart",
    color: "mint",
    summary: "Choose clear, polite language for advice, requests, offers and suggestions.",
    lesson: [
      "Language functions are expressions chosen for a purpose, such as advising, requesting, suggesting, apologizing or offering help.",
      "Give advice with should, ought to, could or If I were you, I would. Had better sounds stronger and can suggest a likely consequence.",
      "Match directness to the situation. Could you...? and Would you mind...? are polite requests; Why don't we...? can introduce a friendly suggestion.",
    ],
    keyRule: "Choose a phrase that fits both the communicative purpose and the level of politeness.",
    examples: [
      { before: "You have a fever. My advice: rest.", after: "You should rest and drink plenty of water.", note: "Should gives ordinary advice." },
      { before: "Suggest going to the library together.", after: "Why don't we go to the library together?", note: "Why don't we...? makes a friendly suggestion." },
      { before: "Ask politely for someone to open the door.", after: "Could you please open the door?", note: "Could you...? forms a polite request." },
      { before: "Give strong advice to leave now.", after: "You had better leave now.", note: "Had better expresses strong advice or warning." },
    ],
    mistakes: [
      { before: "You should to see a doctor.", after: "You should see a doctor.", note: "Should is followed directly by the base verb." },
      { before: "Why don't we to take a break?", after: "Why don't we take a break?", note: "Use the base verb after Why don't we." },
    ],
    practice: [
      p("Your friend feels stressed before an exam. Choose gentle advice.", "You could take a short break and make a study plan.", ["You must be careless.", "You had better fail the exam.", "You should to stop studying."], "Could offers a considerate suggestion rather than a command.", "Use should or could for supportive advice.", "multiple-choice"),
      p("Complete the polite request: ___ you please help me?", "Could", ["Must", "Should", "Would to"], "Could you please...? is a polite request.", "Use a modal verb plus the base verb in a request.", "fill-blank"),
      p("Choose the correct suggestion.", "Why don't we practise together?", ["Why don't we to practise together?", "Why we don't practises together?", "Why not we practising together?"], "Why don't we is followed by the base form.", "Use Why don't we + base verb.", "transformation"),
      p("Which phrase gives the strongest advice?", "You had better leave now.", ["You could leave if you like.", "Perhaps you may leave later.", "Would you like to leave?"], "Had better is more forceful and may imply a consequence.", "Choose the strength of advice carefully.", "multiple-choice"),
      p("Choose the best response to 'I cannot find my notebook.'", "I can help you look for it.", ["You should have lost it.", "Why don't you to forget it?", "Could you open the window?"], "The response offers help, matching the situation.", "Listen for the purpose before choosing a function.", "matching"),
    ],
    flashcards: [
      { id: "func-advice", front: "Which modal commonly gives ordinary advice?", back: "Should" },
      { id: "func-suggest", front: "Complete a friendly suggestion: 'Why don't we ___?'", back: "Use the base form of a verb" },
      { id: "func-request", front: "Name one polite request opener.", back: "Could you please...?" },
    ],
  },
  {
    id: "synonyms",
    number: 10,
    name: "Synonyms",
    category: "Vocabulary",
    icon: "BookOpenCheck",
    color: "coral",
    summary: "Choose words with similar meanings that fit the sentence and tone.",
    lesson: [
      "Synonyms have the same or a very similar meaning, but two words are rarely interchangeable in every sentence.",
      "Use context, part of speech and tone to select the best synonym. For example, begin and commence are similar, but commence sounds more formal.",
      "When replacing a word, check that grammar and meaning remain natural. A dictionary example sentence can clarify differences in use.",
    ],
    keyRule: "A useful synonym must fit the meaning, grammar and tone of its sentence.",
    examples: [
      { before: "The room was very large.", after: "The room was very spacious.", note: "Spacious is a natural synonym for large in this context." },
      { before: "The child was happy about the result.", after: "The child was delighted about the result.", note: "Delighted is a stronger synonym for happy." },
      { before: "Please begin your work now.", after: "Please start your work now.", note: "Start and begin are close in meaning and register." },
      { before: "The instructions were easy to understand.", after: "The instructions were clear.", note: "Clear describes something easy to understand." },
    ],
    mistakes: [
      { before: "The soup was delicious, so it was very loud.", after: "The soup was delicious, so it was very tasty.", note: "Choose a synonym that matches the meaning and context." },
      { before: "She spoke softly, meaning she spoke loudly.", after: "She spoke softly, meaning she spoke quietly.", note: "Softly and quietly have similar meanings in this context." },
    ],
    practice: [
      p("Choose the closest synonym for 'rapid'.", "quick", ["quiet", "heavy", "careful"], "Rapid and quick both describe speed.", "Compare meaning and part of speech.", "matching"),
      p("The word 'ancient' is closest in meaning to ___.", "old", ["modern", "recent", "tiny"], "Ancient describes something very old.", "Use context to select a fitting synonym.", "multiple-choice"),
      p("Choose a synonym for 'assist'.", "help", ["hinder", "ignore", "delay"], "Assist means to help.", "A synonym shares a similar meaning.", "matching"),
      p("Which word best replaces 'silent' in 'The room was silent'?", "quiet", ["noisy", "crowded", "bright"], "Quiet preserves the meaning of silent.", "A replacement must keep the sentence's meaning.", "multiple-choice"),
      p("Choose a formal synonym for 'start'.", "commence", ["mess around", "stop", "forget"], "Commence is a formal synonym for start or begin.", "Tone and register matter when choosing synonyms.", "matching"),
    ],
    flashcards: [
      { id: "syn-rapid", front: "What is a synonym for rapid?", back: "Quick" },
      { id: "syn-assist", front: "What is a synonym for assist?", back: "Help" },
      { id: "syn-silent", front: "What is a synonym for silent?", back: "Quiet" },
    ],
  },
  {
    id: "antonyms",
    number: 11,
    name: "Antonyms",
    category: "Vocabulary",
    icon: "ArrowLeftRight",
    color: "sky",
    summary: "Recognize words with opposite meanings and use them accurately.",
    lesson: [
      "Antonyms have opposite meanings. Some opposites form clear pairs, while others depend on the context or scale being described.",
      "Prefixes such as un-, dis-, in- and im- can create opposites, but not every word accepts every prefix. Check that the resulting word is standard English.",
      "Confirm the word's part of speech and sentence context. The opposite of light may be heavy or dark depending on whether light describes weight or brightness.",
    ],
    keyRule: "Choose an opposite that contrasts with the intended meaning of the word in context.",
    examples: [
      { before: "The road was narrow.", after: "The road was wide.", note: "Wide is the opposite of narrow for a road." },
      { before: "The glass is empty.", after: "The glass is full.", note: "Full contrasts with empty." },
      { before: "The answer was correct.", after: "The answer was incorrect.", note: "The prefix in- creates an opposite here." },
      { before: "The room was bright.", after: "The room was dark.", note: "Dark is the context-appropriate opposite of bright." },
    ],
    mistakes: [
      { before: "The opposite of 'possible' is unpossible.", after: "The opposite of 'possible' is impossible.", note: "Use the conventional prefix im- with possible." },
      { before: "The room was dark, not heavy.", after: "The room was dark, not bright.", note: "Select the opposite sense that fits the context." },
    ],
    practice: [
      p("Choose the antonym of 'generous'.", "selfish", ["kind", "helpful", "giving"], "Selfish contrasts with generous.", "An antonym expresses an opposite meaning.", "matching"),
      p("The antonym of 'accept' is ___.", "reject", ["receive", "allow", "agree"], "Reject means to refuse or not accept.", "Check whether the word is a verb, noun or adjective.", "matching"),
      p("Choose the opposite of 'ancient'.", "modern", ["old", "historic", "antique"], "Modern contrasts with ancient in age or period.", "Use the contrast that fits the sentence.", "multiple-choice"),
      p("Which prefix forms the opposite of 'regular'?", "ir-", ["un-", "dis-", "mis-"], "Irregular is the standard spelling.", "Some negative prefixes depend on the first sound or spelling.", "word-form"),
      p("Choose the antonym of 'expand'.", "shrink", ["increase", "stretch", "extend"], "Shrink is the opposite action to expand.", "Use context to choose the opposite sense.", "matching"),
    ],
    flashcards: [
      { id: "ant-accept", front: "What is the antonym of accept?", back: "Reject" },
      { id: "ant-expand", front: "What is the antonym of expand?", back: "Shrink" },
      { id: "ant-generous", front: "What is the antonym of generous?", back: "Selfish" },
    ],
  },
  {
    id: "word-formation",
    number: 12,
    name: "Correct Word Forms and Word Formation",
    category: "Vocabulary",
    icon: "WholeWord",
    color: "mint",
    summary: "Build nouns, verbs, adjectives and adverbs from word families.",
    lesson: [
      "A word family includes related forms built from a shared root, such as decide, decision, decisive and decisively.",
      "Suffixes often signal a part of speech: -ness and -tion often form nouns, -ful and -able often form adjectives, and -ly often forms adverbs. These patterns have exceptions.",
      "Read the whole sentence to identify the grammatical job needed in the blank. Then check spelling changes and whether the form makes sense in context.",
    ],
    keyRule: "Use the sentence's grammar and meaning to choose the correct form from a word family.",
    examples: [
      { before: "Her ___ impressed the judges. (CONFIDENT)", after: "Her confidence impressed the judges.", note: "The subject position needs the noun confidence." },
      { before: "He answered the question ___. (ACCURATE)", after: "He answered the question accurately.", note: "The verb is modified by the adverb accurately." },
      { before: "The instructions are very ___. (USE)", after: "The instructions are very useful.", note: "After be and very, an adjective is needed." },
      { before: "We must ___ the results carefully. (ANALYSIS)", after: "We must analyse the results carefully.", note: "After must, use the base form of the verb analyse." },
    ],
    mistakes: [
      { before: "She spoke confident during the interview.", after: "She spoke confidently during the interview.", note: "An adverb modifies the verb spoke." },
      { before: "His kind made everyone feel welcome.", after: "His kindness made everyone feel welcome.", note: "The sentence needs the noun kindness." },
    ],
    practice: [
      p("Her ___ helped her lead the team. (CONFIDENT)", "confidence", ["confident", "confidently", "confide"], "A noun is needed as the subject of helped.", "Use sentence position to identify the part of speech.", "word-form"),
      p("He completed the task ___. (CAREFUL)", "carefully", ["careful", "carefulness", "care"], "An adverb modifies the verb completed.", "Many adverbs end in -ly, but check spelling and context.", "word-form"),
      p("This is a very ___ solution. (PRACTICE)", "practical", ["practically", "practice", "practise"], "An adjective is needed before the noun solution.", "After very, an adjective often describes a noun.", "word-form"),
      p("We need to ___ the problem. (SOLUTION)", "solve", ["solving", "solved", "solution"], "Need to is followed by the base form of a verb.", "Use grammar clues around the gap.", "word-form"),
      p("Choose the noun form of 'educate'.", "education", ["educational", "educate", "educationally"], "Education is the noun form.", "Suffixes can signal a word's part of speech.", "word-form"),
    ],
    flashcards: [
      { id: "word-noun", front: "What part of speech often ends in -ness?", back: "A noun" },
      { id: "word-adverb", front: "What part of speech does -ly often help form?", back: "An adverb" },
      { id: "word-adj", front: "What part of speech can -ful help form?", back: "An adjective" },
    ],
  },
  {
    id: "prefixes-suffixes",
    number: 13,
    name: "Prefixes, Suffixes and Incomplete Spellings",
    category: "Vocabulary",
    icon: "Puzzle",
    color: "indigo",
    summary: "Use word parts and context clues to complete and understand words.",
    lesson: [
      "A prefix is added before a base word; a suffix is added after it. A prefix may change meaning, while a suffix often changes meaning or part of speech.",
      "Common prefixes include re- (again), mis- (wrongly), pre- (before), un- (not) and dis- (opposite or removal). Common suffixes include -ful, -less, -ment and -able.",
      "When completing an incomplete word, use the sentence meaning, grammatical role and spelling pattern. Adding an affix may change the base spelling.",
    ],
    keyRule: "Use the meaning and grammatical role of the whole sentence to choose a correct base word and affix.",
    examples: [
      { before: "Please ___read the instructions. (read again)", after: "Please reread the instructions.", note: "The prefix re- means again." },
      { before: "The glass is ___breakable. (not)", after: "The glass is unbreakable.", note: "Un- creates the opposite meaning." },
      { before: "Her reply was help___.", after: "Her reply was helpful.", note: "The suffix -ful means full of or providing." },
      { before: "He made a care___ choice.", after: "He made a careless choice.", note: "The suffix -less means without." },
    ],
    mistakes: [
      { before: "She had an unhappyless day.", after: "She had an unhappy day.", note: "Do not add incompatible negative suffixes." },
      { before: "The answer was discorrect.", after: "The answer was incorrect.", note: "Choose a conventional prefix for the base word." },
    ],
    practice: [
      p("What does the prefix re- mean in 'rewrite'?", "again", ["before", "not", "wrongly"], "Rewrite means write again.", "A prefix can change a base word's meaning.", "matching"),
      p("Complete the word: The path was hope___ after the rain stopped.", "hopeful", ["hopeless", "hopeing", "unhope"], "Hopeful means full of hope and fits the positive context.", "Use meaning and suffix patterns together.", "word-form"),
      p("Which prefix means 'not' in 'unfair'?", "un-", ["re-", "pre-", "mis-"], "Un- gives unfair the opposite meaning of fair.", "Prefixes appear before the base word.", "multiple-choice"),
      p("Choose the correctly completed word: 'without care' means ___.", "careless", ["careful", "re-care", "carement"], "The suffix -less means without.", "Suffixes are added after the base word.", "word-form"),
      p("What does pre- mean in 'preview'?", "before", ["again", "not", "after"], "A preview is a view before the full event or release.", "Learn common prefixes as meaning units.", "matching"),
    ],
    flashcards: [
      { id: "affix-prefix", front: "Where is a prefix added?", back: "Before a base word" },
      { id: "affix-suffix", front: "Where is a suffix added?", back: "After a base word" },
      { id: "affix-less", front: "What does the suffix -less usually mean?", back: "Without" },
    ],
  },
  {
    id: "spelling-correction",
    number: 14,
    name: "Spelling Correction",
    category: "Vocabulary",
    icon: "SpellCheck2",
    color: "violet",
    summary: "Spot common spelling patterns, tricky endings and irregular forms.",
    lesson: [
      "English spelling includes regular patterns and historical exceptions. Learn common letter patterns, but check unfamiliar words rather than relying on sound alone.",
      "Watch for doubled consonants, silent letters, ie/ei patterns, and changes when adding suffixes. A word family can reveal a spelling pattern.",
      "Proofread in a focused pass: read slowly, look for likely error patterns and use a dictionary when uncertain. Spellcheck tools may miss correctly spelled words used incorrectly.",
    ],
    keyRule: "Check the complete word and its word family; do not rely on sound alone for English spelling.",
    examples: [
      { before: "We recieved your message.", after: "We received your message.", note: "Receive follows the common c-e-i pattern." },
      { before: "The class is preparing for an exam.", after: "The class is preparing for an exam.", note: "Preparing drops the final silent e before adding -ing." },
      { before: "She wrote a beautifull poem.", after: "She wrote a beautiful poem.", note: "Beautiful has one final l." },
      { before: "The seperate rooms were quiet.", after: "The separate rooms were quiet.", note: "Separate is spelled with -a- in the middle." },
    ],
    mistakes: [
      { before: "I definately agree with you.", after: "I definitely agree with you.", note: "Definitely contains finite, not the sound 'definately'." },
      { before: "The enviroment needs our care.", after: "The environment needs our care.", note: "Environment includes the n after iro." },
    ],
    practice: [
      p("Choose the correctly spelled word.", "necessary", ["neccessary", "necesary", "necessery"], "Necessary has one c and two s letters.", "Learn the letter pattern in commonly misspelled words.", "multiple-choice"),
      p("Which spelling is correct?", "accommodation", ["accomodation", "acommodation", "accommadation"], "Accommodation has double c and double m.", "Check doubled consonants in word families.", "multiple-choice"),
      p("Complete the sentence: She ___ the invitation yesterday.", "received", ["recieved", "receved", "reciveed"], "Received follows the spelling of receive.", "Remember the common receive/received spelling.", "word-form"),
      p("Choose the correct spelling.", "separate", ["seperate", "separete", "separrate"], "Separate is spelled with an a in the middle.", "Read the whole word, not only its sound.", "multiple-choice"),
      p("Which word is spelled correctly?", "environment", ["enviroment", "envirnoment", "enviornment"], "Environment includes the n before ment.", "Proofread common letter sequences carefully.", "multiple-choice"),
    ],
    flashcards: [
      { id: "spell-necessary", front: "How many c letters are in necessary?", back: "One c" },
      { id: "spell-accommodation", front: "Which two letter pairs are doubled in accommodation?", back: "cc and mm" },
      { id: "spell-separate", front: "Which vowel appears in the middle of separate?", back: "a" },
    ],
  },
  {
    id: "dictionary-skills",
    number: 15,
    name: "Dictionary Skills and Word Lookup",
    category: "Vocabulary",
    icon: "BookMarked",
    color: "sky",
    summary: "Use guide words, parts of speech, pronunciation and examples to look up words.",
    lesson: [
      "A dictionary entry may show spelling, pronunciation, part of speech, definitions, example sentences, word forms and usage labels.",
      "Use guide words at the top of a printed page to check whether a word falls alphabetically on that page. Compare letters from left to right.",
      "If a word has several meanings, choose the definition that fits the sentence. Check whether the entry labels a word as formal, informal, technical or regional.",
    ],
    keyRule: "Look beyond the first definition: use part of speech, examples and usage labels to find the meaning that fits.",
    examples: [
      { before: "A dictionary marks 'run' as a verb and noun.", after: "Run can have more than one part of speech and meaning.", note: "Check the word's grammatical role in your sentence." },
      { before: "Guide words: maple - market. Look up 'marble'.", after: "Marble belongs on this page alphabetically.", note: "Marble falls alphabetically after maple and before market." },
      { before: "The entry labels a word 'informal'.", after: "The word is mainly used in casual speech or writing.", note: "Usage labels explain register and context." },
      { before: "A dictionary gives pronunciation symbols beside a headword.", after: "The symbols show how the word is pronounced.", note: "Pronunciation symbols guide spoken form." },
    ],
    mistakes: [
      { before: "I chose the first meaning of 'light' without reading the sentence.", after: "I chose the dictionary meaning of 'light' that fits the sentence.", note: "A word may have several meanings; context selects the correct one." },
      { before: "I ignored the label 'informal' in my formal essay.", after: "I checked the usage label before using the word in my essay.", note: "Usage labels help you choose words appropriate to the situation." },
    ],
    practice: [
      p("What do guide words at the top of a dictionary page show?", "The first and last headwords on that page", ["The definition of every word", "The part of speech only", "A list of irregular verbs"], "Guide words show the alphabetical range on a page.", "Use guide words to find a word quickly.", "multiple-choice"),
      p("A dictionary labels a word 'adj.'. What does this mean?", "It is an adjective.", ["It is an adverb.", "It is a conjunction.", "It is a past participle only."], "Adj. is a common abbreviation for adjective.", "Check the part-of-speech label before using a word.", "matching"),
      p("If a word has three definitions, what helps you choose the right one?", "The surrounding sentence context", ["The longest definition", "The first definition every time", "The word's first letter only"], "Context tells you which sense is intended.", "Use an example sentence to confirm the meaning.", "multiple-choice"),
      p("What does a pronunciation guide help you identify?", "How a word is spoken", ["How many meanings it has", "Whether it is formal", "Its alphabetical location only"], "Pronunciation symbols represent sounds.", "Use pronunciation guides to check spoken forms.", "multiple-choice"),
      p("Which entry detail helps you decide whether a word suits a formal essay?", "A usage label", ["The page number", "The number of letters", "The guide word only"], "Labels such as informal or formal describe register.", "Check labels and examples for appropriate use.", "matching"),
    ],
    flashcards: [
      { id: "dict-guide", front: "What do guide words show in a printed dictionary?", back: "The first and last headwords on that page" },
      { id: "dict-pos", front: "What does 'n.' commonly stand for in a dictionary?", back: "Noun" },
      { id: "dict-label", front: "What does a usage label such as 'informal' tell you?", back: "The context or register where a word is used" },
    ],
  },
  {
    id: "phrasal-verbs-idioms",
    number: 16,
    name: "Phrasal Verbs and Idioms",
    category: "Vocabulary",
    icon: "Puzzle",
    color: "coral",
    summary: "Understand multi-word expressions from their meaning and context.",
    lesson: [
      "A phrasal verb combines a verb with a particle such as up, out or off. Its meaning may be literal or different from the meanings of its separate parts.",
      "Some phrasal verbs are separable: turn the light off or turn off the light. With a pronoun object, the pronoun usually goes between the verb and particle: turn it off.",
      "An idiom is an expression whose overall meaning is not always predictable from the individual words. Learn it as a complete phrase and use context clues.",
    ],
    keyRule: "Learn the complete expression and check its meaning and word order in context.",
    examples: [
      { before: "Please extinguish the lamp.", after: "Please turn off the lamp.", note: "Turn off is a phrasal verb meaning extinguish." },
      { before: "She discovered the truth.", after: "She found out the truth.", note: "Find out means discover or learn." },
      { before: "He postponed the meeting.", after: "He put off the meeting.", note: "Put off means postpone." },
      { before: "Do not reveal the surprise.", after: "Do not let the cat out of the bag.", note: "Let the cat out of the bag is an idiom meaning reveal a secret." },
    ],
    mistakes: [
      { before: "Please turn off it.", after: "Please turn it off.", note: "A pronoun object normally sits between a separable verb and particle." },
      { before: "She put the meeting off it.", after: "She put the meeting off.", note: "Do not add an object pronoun after an already stated noun object." },
    ],
    practice: [
      p("What does 'find out' mean?", "Discover or learn", ["Hide", "Postpone", "Extinguish"], "Find out means to discover or learn information.", "Learn phrasal verbs as whole units.", "matching"),
      p("Choose the natural sentence with a pronoun.", "Please turn it off.", ["Please turn off it.", "Please it turn off.", "Please off turn it."], "The pronoun object goes between the verb and particle.", "Place pronoun objects inside separable phrasal verbs.", "transformation"),
      p("'Put off the trip' means ___.", "postpone the trip", ["cancel the trip forever", "start the trip", "enjoy the trip"], "Put off means delay or postpone.", "Use the sentence context to confirm a phrasal verb's meaning.", "matching"),
      p("What does the idiom 'break the ice' mean?", "Make people feel more comfortable at the start", ["Break a frozen object", "End a friendship", "Make a room colder"], "The idiom means ease tension or begin a friendly conversation.", "Idioms have meanings beyond their literal words.", "multiple-choice"),
      p("Which expression means 'reveal a secret'?", "Let the cat out of the bag", ["Put off", "Turn in", "Look after"], "Let the cat out of the bag is an idiom for revealing a secret.", "Learn idioms with their full meanings.", "matching"),
    ],
    flashcards: [
      { id: "phrase-findout", front: "Is 'find out' a phrasal verb or an idiom?", back: "A phrasal verb" },
      { id: "phrase-putoff", front: "What does 'put off' mean?", back: "Postpone" },
      { id: "phrase-ice", front: "Is 'break the ice' literal or idiomatic?", back: "Idiomatic; it describes easing first-meeting tension" },
    ],
  },
  {
    id: "word-meanings",
    number: 17,
    name: "Matching Words with Their Meanings",
    category: "Vocabulary",
    icon: "ListChecks",
    color: "mint",
    summary: "Use definition clues, part of speech and context to match vocabulary precisely.",
    lesson: [
      "To match a word with its meaning, first identify the part of speech and the main idea in the definition.",
      "Look for clues such as a synonym, an example, a contrast or a familiar word part. Then reread the sentence with the chosen meaning to check that it fits.",
      "Several words may seem related, so compare the details in each definition. Notice differences in strength, purpose, tone and context.",
    ],
    keyRule: "Match the full meaning and grammatical role, then confirm the choice in its sentence.",
    examples: [
      { before: "A person who is cautious", after: "A person who takes care to avoid danger or mistakes", note: "The definition includes the central idea of care and risk." },
      { before: "A device that measures temperature", after: "A thermometer", note: "The tool's purpose identifies the matching word." },
      { before: "To make something better", after: "Improve", note: "Improve is a verb meaning make or become better." },
      { before: "A short account of the main points", after: "A summary", note: "A summary presents the main ideas briefly." },
    ],
    mistakes: [
      { before: "I matched 'rapid' with 'a person who moves quickly'.", after: "I matched 'rapid' with 'happening very quickly'.", note: "Match the word's part of speech and definition." },
      { before: "I chose a word because it looked similar to the definition.", after: "I checked that the complete definition matched the word in context.", note: "Superficial resemblance is not enough; verify meaning and grammar." },
    ],
    practice: [
      p("Match 'thermometer' with its meaning.", "A device that measures temperature", ["A tool that measures distance", "A book of maps", "A container for water"], "A thermometer measures temperature.", "Focus on the key purpose in a definition.", "matching"),
      p("Which word means 'to make or become better'?", "improve", ["ignore", "remove", "predict"], "Improve means make or become better.", "Check whether the word's part of speech fits the definition.", "matching"),
      p("Choose the meaning of 'cautious'.", "Careful to avoid danger or mistakes", ["Eager to take risks", "Unable to hear", "Extremely noisy"], "Cautious describes careful attention to possible danger.", "Use all key details in a definition.", "multiple-choice"),
      p("A 'summary' is ___.", "a short account of the main points", ["a list of unrelated details", "a prediction about the future", "a detailed argument against an idea"], "A summary briefly presents the main points.", "Match a word to its defining features.", "matching"),
      p("Which word means 'happening or moving very quickly'?", "rapid", ["cautious", "ancient", "silent"], "Rapid means fast or quick.", "Use context clues and known synonyms.", "matching"),
    ],
    flashcards: [
      { id: "meaning-thermometer", front: "What does a thermometer measure?", back: "Temperature" },
      { id: "meaning-improve", front: "What does improve mean?", back: "To make or become better" },
      { id: "meaning-summary", front: "What is a summary?", back: "A short account of the main points" },
    ],
  },
];

export const TOPIC_BY_ID = Object.fromEntries(TOPICS.map((topic) => [topic.id, topic])) as Record<string, Topic>;

export function normalizeFingerprint(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeQuestion(
  topic: Topic,
  difficulty: Difficulty,
  prompt: string,
  answer: string,
  options: string[],
  explanation: string,
  takeaway: string,
  type: QuizQuestion["type"],
  index: number,
): QuizQuestion {
  const fingerprint = normalizeFingerprint(prompt);
  return {
    id: `offline-${topic.id}-${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 7)}`,
    topicId: topic.id,
    difficulty,
    type,
    prompt,
    options: options.length ? shuffle([...new Set(options)]) : [],
    correctAnswer: answer,
    explanation,
    takeaway,
    fingerprint,
  };
}

function closeDistractors(topic: Topic, correct: string, index: number): string[] {
  const source = [
    ...topic.practice.map((item) => item.answer),
    ...topic.examples.map((item) => item.after),
    ...topic.mistakes.map((item) => item.before),
    ...topic.flashcards.map((item) => item.back),
  ].filter((value) => normalizeFingerprint(value) !== normalizeFingerprint(correct));
  const unique = [...new Set(source)];
  const start = index % Math.max(unique.length, 1);
  const picked = [...unique.slice(start), ...unique.slice(0, start)].slice(0, 3);
  while (picked.length < 3) picked.push("This choice does not match the sentence.");
  return picked;
}

export function buildOfflineQuiz(topic: Topic, difficulty: Difficulty): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  let index = 0;

  for (const item of topic.practice.slice(0, 5)) {
    questions.push(
      makeQuestion(topic, difficulty, item.prompt, item.answer, item.options, item.explanation, item.takeaway, item.type, index++),
    );
  }

  for (const [exampleIndex, example] of topic.examples.slice(0, 4).entries()) {
    const prompt = `Choose the best revision: ${example.before}`;
    questions.push(
      makeQuestion(
        topic,
        difficulty,
        prompt,
        example.after,
        [example.after, ...closeDistractors(topic, example.after, exampleIndex)],
        example.note,
        topic.keyRule,
        exampleIndex % 2 === 0 ? "transformation" : "fill-blank",
        index++,
      ),
    );
  }

  for (const [mistakeIndex, mistake] of topic.mistakes.entries()) {
    const prompt = `Correct the error: ${mistake.before}`;
    questions.push(
      makeQuestion(
        topic,
        difficulty,
        prompt,
        mistake.after,
        [mistake.after, ...closeDistractors(topic, mistake.after, mistakeIndex + 2)],
        mistake.note,
        topic.keyRule,
        "error-identification",
        index++,
      ),
    );
  }

  for (const [cardIndex, card] of topic.flashcards.entries()) {
    questions.push(
      makeQuestion(
        topic,
        difficulty,
        card.front,
        card.back,
        [card.back, ...closeDistractors(topic, card.back, cardIndex + 4)],
        `The key idea is: ${card.back}.`,
        topic.keyRule,
        "matching",
        index++,
      ),
    );
  }

  questions.push(
    makeQuestion(
      topic,
      difficulty,
      `Which statement best summarizes the key rule for ${topic.name}?`,
      topic.keyRule,
      [topic.keyRule, ...closeDistractors(topic, topic.keyRule, 1)],
      topic.keyRule,
      topic.keyRule,
      "multiple-choice",
      index,
    ),
  );

  if (questions.length !== 15) throw new Error("The offline practice set is incomplete.");
  return questions;
}
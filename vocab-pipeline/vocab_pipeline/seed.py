from __future__ import annotations

import json
from pathlib import Path


CEFR_PACKS = {
    "A1": "a1_core",
    "A2": "a2_core",
    "B1": "b1_core",
    "B2": "b2_core",
}


def _write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def _level_for_index(index: int, total: int) -> str:
    quarter = total // 4
    if index < quarter:
      return "A1"
    if index < quarter * 2:
      return "A2"
    if index < quarter * 3:
      return "B1"
    return "B2"


def _priority_for_level(level: str) -> int:
    return {
        "A1": 5,
        "A2": 4,
        "B1": 3,
        "B2": 3,
    }[level]


def _base_word_entries() -> list[dict[str, object]]:
    nouns = [
        ("dag", "day"), ("vecka", "week"), ("månad", "month"), ("år", "year"),
        ("morgon", "morning"), ("kväll", "evening"), ("tid", "time"), ("stund", "moment"),
        ("vän", "friend"), ("familj", "family"), ("barn", "child"), ("person", "person"),
        ("stad", "city"), ("gata", "street"), ("plats", "place"), ("hem", "home"),
        ("hus", "house"), ("rum", "room"), ("bord", "table"), ("stol", "chair"),
        ("bok", "book"), ("ord", "word"), ("fråga", "question"), ("svar", "answer"),
        ("jobb", "job"), ("arbete", "work"), ("möte", "meeting"), ("plan", "plan"),
        ("problem", "problem"), ("lösning", "solution"), ("idé", "idea"), ("situation", "situation"),
        ("pengar", "money"), ("pris", "price"), ("tidning", "newspaper"), ("nyhet", "news"),
        ("bil", "car"), ("buss", "bus"), ("tåg", "train"), ("resa", "trip"),
        ("mat", "food"), ("vatten", "water"), ("kaffe", "coffee"), ("te", "tea"),
        ("frukost", "breakfast"), ("lunch", "lunch"), ("middag", "dinner"), ("köp", "purchase"),
        ("telefon", "phone"), ("dator", "computer"), ("brev", "letter"), ("meddelande", "message"),
        ("språk", "language"), ("lektion", "lesson"), ("skola", "school"), ("klass", "class"),
        ("musik", "music"), ("film", "movie"), ("bokning", "booking"), ("besök", "visit"),
        ("affär", "store"), ("butik", "shop"), ("kontor", "office"), ("chef", "manager"),
        ("kollega", "colleague"), ("kund", "customer"), ("lärare", "teacher"), ("student", "student"),
        ("elev", "pupil"), ("prov", "test"), ("kurs", "course"), ("uppgift", "task"),
        ("mål", "goal"), ("resultat", "result"), ("val", "choice"), ("beslut", "decision"),
        ("regel", "rule"), ("ändring", "change"), ("hjälp", "help"), ("stöd", "support"),
        ("samtal", "conversation"), ("diskussion", "discussion"), ("möjlighet", "possibility"), ("behov", "need"),
        ("skillnad", "difference"), ("del", "part"), ("början", "beginning"), ("slut", "end"),
        ("väg", "road"), ("hållplats", "stop"), ("biljett", "ticket"), ("station", "station"),
        ("flyg", "flight"), ("cykel", "bicycle"), ("väska", "bag"), ("jacka", "jacket"),
        ("skor", "shoes"), ("nyckel", "key"), ("dörr", "door"), ("fönster", "window"),
        ("kök", "kitchen"), ("badrum", "bathroom"), ("säng", "bed"), ("soffa", "sofa"),
        ("golv", "floor"), ("vägg", "wall"), ("lampa", "lamp"), ("träd", "tree"),
        ("väder", "weather"), ("sol", "sun"), ("regn", "rain"), ("snö", "snow"),
        ("vind", "wind"), ("värme", "heat"), ("kyla", "cold"), ("kropp", "body"),
        ("hand", "hand"), ("huvud", "head"), ("hjärta", "heart"), ("hälsa", "health"),
        ("sjukdom", "illness"), ("medicin", "medicine"), ("sjukhus", "hospital"), ("marknad", "market"),
        ("bank", "bank"), ("konto", "account"), ("kort", "card"), ("räkning", "bill"),
        ("rabatt", "discount"), ("beställning", "order"), ("server", "server"), ("skärm", "screen"),
        ("program", "program"), ("lösenord", "password"), ("internet", "internet"), ("nätverk", "network"),
        ("bild", "image"), ("foto", "photo"), ("text", "text"), ("rubrik", "headline"),
        ("land", "country"), ("område", "area"), ("granne", "neighbor"), ("grupp", "group"),
        ("lag", "team"), ("förening", "association"), ("kultur", "culture"), ("natur", "nature"),
        ("framtid", "future"), ("historia", "history"), ("nivå", "level"), ("metod", "method"),
    ]
    verbs = [
        ("vara", "be"), ("ha", "have"), ("göra", "do"), ("säga", "say"),
        ("komma", "come"), ("gå", "go"), ("se", "see"), ("ta", "take"),
        ("ge", "give"), ("få", "get"), ("vilja", "want"), ("behöva", "need"),
        ("försöka", "try"), ("börja", "start"), ("sluta", "stop"), ("hitta", "find"),
        ("fråga", "ask"), ("svara", "answer"), ("lära", "learn"), ("förstå", "understand"),
        ("glömma", "forget"), ("minnas", "remember"), ("köpa", "buy"), ("betala", "pay"),
        ("äta", "eat"), ("dricka", "drink"), ("sova", "sleep"), ("vakna", "wake up"),
        ("öppna", "open"), ("stänga", "close"), ("skicka", "send"), ("läsa", "read"),
        ("skriva", "write"), ("prata", "talk"), ("lyssna", "listen"), ("vänta", "wait"),
        ("hjälpa", "help"), ("använda", "use"), ("arbeta", "work"), ("resa", "travel"),
        ("möta", "meet"), ("tänka", "think"), ("känna", "feel"), ("förklara", "explain"),
        ("ändra", "change"), ("jämföra", "compare"), ("fortsätta", "continue"), ("förbättra", "improve"),
        ("bo", "live"), ("stanna", "stay"), ("välja", "choose"), ("bestämma", "decide"),
        ("planera", "plan"), ("ordna", "arrange"), ("kontrollera", "check"), ("anmäla", "register"),
        ("besöka", "visit"), ("anlända", "arrive"), ("lämna", "leave"), ("söka", "search"),
        ("visa", "show"), ("dela", "share"), ("berätta", "tell"), ("försvara", "defend"),
        ("utveckla", "develop"), ("minska", "reduce"), ("öka", "increase"), ("lösa", "solve"),
        ("acceptera", "accept"), ("föreslå", "suggest"), ("upprepa", "repeat"), ("öva", "practice"),
        ("ringa", "call"), ("maila", "email"), ("spara", "save"), ("starta", "launch"),
        ("logga in", "log in"), ("beställa", "order"), ("leverera", "deliver"), ("låna", "borrow"),
        ("hyra", "rent"), ("packa", "pack"), ("byta", "switch"), ("förbereda", "prepare"),
        ("samarbeta", "cooperate"), ("delta", "participate"), ("lyckas", "succeed"), ("misslyckas", "fail"),
        ("upptäcka", "discover"), ("påverka", "affect"), ("skapa", "create"), ("bygga", "build"),
        ("minna", "recall"), ("träna", "train"), ("vila", "rest"), ("promenera", "walk"),
        ("springa", "run"), ("köra", "drive"), ("cykla", "cycle"), ("flytta", "move"),
        ("diskutera", "discuss"), ("förhandla", "negotiate"), ("rekommendera", "recommend"), ("jämna", "smooth"),
    ]
    adjectives = [
        ("stor", "big"), ("liten", "small"), ("bra", "good"), ("dålig", "bad"),
        ("viktig", "important"), ("vanlig", "common"), ("enkel", "simple"), ("svår", "difficult"),
        ("snabb", "fast"), ("långsam", "slow"), ("ny", "new"), ("gammal", "old"),
        ("trött", "tired"), ("redo", "ready"), ("glad", "happy"), ("ledsen", "sad"),
        ("säker", "safe"), ("osäker", "uncertain"), ("tydlig", "clear"), ("oklar", "unclear"),
        ("billig", "cheap"), ("dyr", "expensive"), ("öppen", "open"), ("stängd", "closed"),
        ("möjlig", "possible"), ("omöjlig", "impossible"), ("intressant", "interesting"), ("viktigast", "most important"),
        ("nödvändig", "necessary"), ("praktisk", "practical"), ("vänlig", "kind"), ("artig", "polite"),
        ("bekväm", "comfortable"), ("stressad", "stressed"), ("lugn", "calm"), ("säkerställd", "confirmed"),
        ("lokal", "local"), ("global", "global"), ("privat", "private"), ("offentlig", "public"),
        ("digital", "digital"), ("analog", "analog"), ("stabil", "stable"), ("flexibel", "flexible"),
        ("positiv", "positive"), ("negativ", "negative"), ("direkt", "direct"), ("indirekt", "indirect"),
        ("aktiv", "active"), ("passiv", "passive"), ("ren", "clean"), ("smutsig", "dirty"),
        ("tom", "empty"), ("full", "full"), ("fri", "free"), ("upptagen", "busy"),
        ("ansvarig", "responsible"), ("redo", "prepared"), ("enig", "in agreement"), ("överens", "agreed"),
        ("modern", "modern"), ("klassisk", "classic"), ("centralt", "central"), ("regional", "regional"),
        ("gemensam", "shared"), ("olik", "different"), ("lik", "similar"), ("normal", "normal"),
    ]
    adverbs = [
        ("idag", "today"), ("imorgon", "tomorrow"), ("igår", "yesterday"), ("nu", "now"),
        ("senare", "later"), ("tidigt", "early"), ("sent", "late"), ("alltid", "always"),
        ("ofta", "often"), ("ibland", "sometimes"), ("sällan", "rarely"), ("snart", "soon"),
        ("redan", "already"), ("fortfarande", "still"), ("kanske", "maybe"), ("verkligen", "really"),
        ("dessutom", "in addition"), ("däremot", "however"), ("förmodligen", "probably"), ("särskilt", "especially"),
        ("nästan", "almost"), ("ganska", "quite"), ("direkt", "directly"), ("noga", "carefully"),
        ("tillsammans", "together"), ("ensam", "alone"), ("hemma", "at home"), ("borta", "away"),
        ("utomhus", "outdoors"), ("inomhus", "indoors"), ("framåt", "forward"), ("bakåt", "backward"),
        ("uppåt", "upward"), ("nedåt", "downward"), ("överallt", "everywhere"), ("någonstans", "somewhere"),
        ("ingenstans", "nowhere"), ("vanligtvis", "usually"), ("faktiskt", "actually"), ("tyvärr", "unfortunately"),
    ]
    pronouns = [
        ("jag", "I"), ("du", "you"), ("han", "he"), ("hon", "she"), ("vi", "we"),
        ("ni", "you all"), ("de", "they"), ("den", "it"), ("det", "it"), ("man", "one"),
        ("någon", "someone"), ("ingen", "no one"), ("något", "something"), ("allt", "everything"),
    ]
    prepositions = [
        ("på", "on"), ("i", "in"), ("under", "under"), ("över", "over"), ("bakom", "behind"),
        ("framför", "in front of"), ("mellan", "between"), ("bredvid", "beside"), ("utan", "without"), ("med", "with"),
        ("för", "for"), ("mot", "toward"), ("från", "from"), ("till", "to"),
    ]
    conjunctions = [
        ("och", "and"), ("men", "but"), ("eller", "or"), ("för", "because"), ("så", "so"),
        ("om", "if"), ("att", "that"), ("eftersom", "since"), ("medan", "while"), ("fast", "although"),
    ]
    interjections = [
        ("hej", "hi"), ("tack", "thanks"), ("oj", "oops"), ("jaha", "I see"), ("visst", "sure"), ("absolut", "absolutely"),
    ]
    phrases = [
        ("det beror på", "it depends"), ("jag håller med", "I agree"), ("det låter bra", "that sounds good"),
        ("jag vet inte", "I do not know"), ("ingen fara", "no problem"), ("i förväg", "in advance"),
        ("till exempel", "for example"), ("med andra ord", "in other words"), ("i så fall", "in that case"),
        ("så fort som möjligt", "as soon as possible"), ("det spelar ingen roll", "it does not matter"),
        ("jag är inte säker", "I am not sure"), ("vad tycker du", "what do you think"), ("det verkar som", "it seems like"),
        ("med tiden", "with time"), ("på riktigt", "for real"), ("för det mesta", "for the most part"), ("i stället", "instead"),
    ]

    entries: list[dict[str, object]] = []
    for swedish, english in nouns:
        entries.append({"lemma": swedish, "english": english, "partOfSpeech": "noun", "tag": "daily_life"})
    for swedish, english in verbs:
        entries.append({"lemma": swedish, "english": english, "partOfSpeech": "verb", "tag": "common"})
    for swedish, english in adjectives:
        entries.append({"lemma": swedish, "english": english, "partOfSpeech": "adjective", "tag": "description"})
    for swedish, english in adverbs:
        entries.append({"lemma": swedish, "english": english, "partOfSpeech": "adverb", "tag": "time"})
    for swedish, english in pronouns:
        entries.append({"lemma": swedish, "english": english, "partOfSpeech": "pronoun", "tag": "common"})
    for swedish, english in prepositions:
        entries.append({"lemma": swedish, "english": english, "partOfSpeech": "preposition", "tag": "common"})
    for swedish, english in conjunctions:
        entries.append({"lemma": swedish, "english": english, "partOfSpeech": "conjunction", "tag": "common"})
    for swedish, english in interjections:
        entries.append({"lemma": swedish, "english": english, "partOfSpeech": "interjection", "tag": "conversation"})
    for swedish, english in phrases:
        entries.append({"lemma": swedish, "english": english, "partOfSpeech": "phrase", "tag": "conversation"})
    return entries


def _generate_compound_nouns() -> list[dict[str, object]]:
    modifiers = [
        ("arbets", "work"),
        ("skol", "school"),
        ("studie", "study"),
        ("språk", "language"),
        ("familje", "family"),
        ("barn", "child"),
        ("vän", "friend"),
        ("hem", "home"),
        ("stads", "city"),
        ("vardags", "everyday"),
        ("fritids", "leisure"),
        ("sommar", "summer"),
        ("vinter", "winter"),
        ("morgon", "morning"),
        ("kvälls", "evening"),
        ("vecko", "week"),
        ("månads", "month"),
        ("års", "year"),
        ("bok", "book"),
        ("kaffe", "coffee"),
        ("lunch", "lunch"),
        ("middags", "dinner"),
        ("frukost", "breakfast"),
        ("telefon", "phone"),
        ("data", "data"),
        ("rese", "travel"),
        ("tåg", "train"),
        ("buss", "bus"),
        ("bil", "car"),
        ("mötes", "meeting"),
        ("nyhets", "news"),
        ("kultur", "culture"),
        ("hälso", "health"),
        ("musik", "music"),
        ("film", "film"),
    ]
    heads = [
        ("dag", "day"), ("tid", "time"), ("plan", "plan"), ("plats", "place"), ("bok", "book"),
        ("språk", "language"), ("kurs", "course"), ("nivå", "level"), ("fråga", "question"), ("svar", "answer"),
        ("arbete", "work"), ("resa", "trip"), ("biljett", "ticket"), ("grupp", "group"), ("rum", "room"),
        ("bokning", "booking"), ("möte", "meeting"), ("nyhet", "news item"), ("vana", "habit"), ("rutin", "routine"),
        ("liv", "life"), ("familj", "family"), ("vän", "friend"), ("barn", "child"), ("stad", "city"),
        ("gata", "street"), ("hem", "home"), ("mat", "food"), ("kaffe", "coffee"), ("lunch", "lunch"),
        ("middag", "dinner"), ("telefon", "phone"), ("dator", "computer"), ("meddelande", "message"), ("brev", "letter"),
        ("skola", "school"), ("klass", "class"), ("lektion", "lesson"), ("problem", "problem"), ("lösning", "solution"),
        ("idé", "idea"), ("situation", "situation"), ("väg", "road"), ("center", "center"), ("affär", "store"),
        ("butik", "shop"), ("tjänst", "service"), ("stöd", "support"), ("vård", "care"), ("hjälp", "help"),
        ("pris", "price"), ("film", "film"), ("musik", "music"), ("besök", "visit"), ("samtal", "conversation"),
        ("nyckel", "key"), ("bord", "table"), ("stol", "chair"), ("väder", "weather"), ("bild", "image"),
    ]

    entries: list[dict[str, object]] = []
    for modifier_sv, modifier_en in modifiers:
        for head_sv, head_en in heads:
            entries.append(
                {
                    "lemma": f"{modifier_sv}{head_sv}",
                    "english": f"{modifier_en} {head_en}",
                    "partOfSpeech": "noun",
                    "tag": "common",
                }
            )

    return entries


def _generate_phrase_entries() -> list[dict[str, object]]:
    pronouns = [
        ("jag", "I"), ("du", "you"), ("vi", "we"), ("de", "they"),
    ]
    modals = [
        ("vill", "want to"), ("kan", "can"), ("måste", "must"), ("brukar", "usually"),
        ("ska", "will"), ("får", "may"),
    ]
    verbs = [
        ("börja", "start"), ("fortsätta", "continue"), ("förstå", "understand"), ("lära", "learn"),
        ("fråga", "ask"), ("svara", "answer"), ("förklara", "explain"), ("jämföra", "compare"),
        ("använda", "use"), ("ändra", "change"), ("försöka", "try"), ("hitta", "find"),
    ]
    objects = [
        ("svenska ord", "Swedish words"), ("det här uttrycket", "this expression"),
        ("nästa steg", "the next step"), ("den här planen", "this plan"),
        ("en bättre lösning", "a better solution"), ("mer information", "more information"),
        ("rätt svar", "the right answer"), ("ett annat exempel", "another example"),
        ("ett nytt sätt", "a new way"), ("den viktigaste delen", "the most important part"),
    ]
    time_phrases = [
        ("idag", "today"), ("imorgon", "tomorrow"), ("senare", "later"),
        ("just nu", "right now"), ("den här veckan", "this week"), ("så snart som möjligt", "as soon as possible"),
    ]
    question_starts = [
        ("kan du", "can you"), ("kan vi", "can we"), ("vet du", "do you know"),
        ("tror du", "do you think"), ("är det", "is it"), ("finns det", "is there"),
    ]
    adjective_targets = [
        ("viktigt", "important"), ("möjligt", "possible"), ("rimligt", "reasonable"),
        ("tydligt", "clear"), ("svårt", "difficult"), ("enkelt", "simple"),
    ]

    entries: list[dict[str, object]] = []

    for pronoun_sv, pronoun_en in pronouns:
        for modal_sv, modal_en in modals[:4]:
            for verb_sv, verb_en in verbs[:8]:
                for object_sv, object_en in objects[:8]:
                    phrase_sv = f"{pronoun_sv} {modal_sv} {verb_sv} {object_sv}"
                    phrase_en = f"{pronoun_en} {modal_en} {verb_en} {object_en}"
                    entries.append(
                        {
                            "lemma": phrase_sv,
                            "english": phrase_en,
                            "partOfSpeech": "phrase",
                            "tag": "conversation",
                        }
                    )

    for question_sv, question_en in question_starts:
        for verb_sv, verb_en in verbs[:6]:
            for time_sv, time_en in time_phrases[:4]:
                phrase_sv = f"{question_sv} {verb_sv} det {time_sv}"
                phrase_en = f"{question_en} {verb_en} it {time_en}"
                entries.append(
                    {
                        "lemma": phrase_sv,
                        "english": phrase_en,
                        "partOfSpeech": "phrase",
                        "tag": "conversation",
                    }
                )

    for pronoun_sv, pronoun_en in pronouns:
        for adjective_sv, adjective_en in adjective_targets:
            for time_sv, time_en in time_phrases[:4]:
                phrase_sv = f"{pronoun_sv} är {adjective_sv} {time_sv}"
                phrase_en = f"{pronoun_en} am {adjective_en} {time_en}" if pronoun_en == "I" else f"{pronoun_en} are {adjective_en} {time_en}"
                entries.append(
                    {
                        "lemma": phrase_sv,
                        "english": phrase_en,
                        "partOfSpeech": "phrase",
                        "tag": "conversation",
                    }
                )

    return entries


def _build_seed_entries() -> list[dict[str, object]]:
    entries = _base_word_entries() + _generate_compound_nouns() + _generate_phrase_entries()

    unique: list[dict[str, object]] = []
    seen: set[str] = set()
    for entry in entries:
        lemma = str(entry["lemma"])
        part_of_speech = str(entry["partOfSpeech"])
        key = f"{lemma}|{part_of_speech}"
        if key in seen:
            continue
        seen.add(key)
        unique.append(entry)

    total = len(unique)
    seeded_entries: list[dict[str, object]] = []
    for index, entry in enumerate(unique):
        level = _level_for_index(index, total)
        swedish = str(entry["lemma"])
        english = str(entry["english"])
        pos = str(entry["partOfSpeech"])
        tag = str(entry["tag"])
        source_id = f"seed-{index + 1:05d}"
        seeded_entries.append(
            {
                "id": source_id,
                "sourceId": source_id,
                "lemma": swedish,
                "swedish": swedish,
                "english": [english],
                "partOfSpeech": pos,
                "frequencyRank": index + 1,
                "cefrLevel": level,
                "packIds": [CEFR_PACKS[level]],
                "tags": [tag, "common"] if tag != "common" else ["common"],
                "priority": _priority_for_level(level),
                # Seed-only examples were misleading placeholders; leave examples empty unless
                # a real source provides one.
                "exampleSv": None,
                "exampleEn": None,
                "notes": "",
                "isPhrase": pos == "phrase",
            }
        )

    return seeded_entries


def generate_seed_files(backbone_output: Path, dictionary_output: Path) -> int:
    entries = _build_seed_entries()
    backbone_entries: list[dict[str, object]] = []
    dictionary_entries: list[dict[str, object]] = []

    for entry in entries:
        backbone_entries.append(
            {
                "id": entry["id"],
                "sourceId": entry["sourceId"],
                "lemma": entry["lemma"],
                "swedish": entry["swedish"],
                "english": entry["english"],
                "partOfSpeech": entry["partOfSpeech"],
                "frequencyRank": entry["frequencyRank"],
                "cefrLevel": entry["cefrLevel"],
                "packIds": entry["packIds"],
                "tags": entry["tags"],
                "priority": entry["priority"],
                "exampleSv": entry["exampleSv"],
                "exampleEn": entry["exampleEn"],
                "notes": entry["notes"],
                "isPhrase": entry["isPhrase"],
            }
        )
        dictionary_entries.append(
            {
                "id": f"dict-{entry['id']}",
                "sourceId": f"dict-{entry['sourceId']}",
                "lemma": entry["lemma"],
                "swedish": entry["swedish"],
                "english": entry["english"],
                "partOfSpeech": entry["partOfSpeech"],
                "frequencyRank": None,
                "cefrLevel": entry["cefrLevel"],
                "packIds": entry["packIds"],
                "tags": entry["tags"],
                "priority": entry["priority"],
                "exampleSv": entry["exampleSv"],
                "exampleEn": entry["exampleEn"],
                "phonetic": None,
                "audioUrl": None,
                "notes": "seed dictionary enrichment",
                "isPhrase": entry["isPhrase"],
            }
        )

    _write_json(backbone_output, backbone_entries)
    _write_json(dictionary_output, dictionary_entries)
    return len(entries)

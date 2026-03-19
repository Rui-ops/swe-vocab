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
    ]
    adverbs = [
        ("idag", "today"), ("imorgon", "tomorrow"), ("igår", "yesterday"), ("nu", "now"),
        ("senare", "later"), ("tidigt", "early"), ("sent", "late"), ("alltid", "always"),
        ("ofta", "often"), ("ibland", "sometimes"), ("sällan", "rarely"), ("snart", "soon"),
        ("redan", "already"), ("fortfarande", "still"), ("kanske", "maybe"), ("verkligen", "really"),
        ("dessutom", "in addition"), ("däremot", "however"), ("förmodligen", "probably"), ("särskilt", "especially"),
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
    for swedish, english in phrases:
        entries.append({"lemma": swedish, "english": english, "partOfSpeech": "phrase", "tag": "conversation"})
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
        for modal_sv, modal_en in modals:
            for verb_sv, verb_en in verbs:
                for object_sv, object_en in objects:
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
        for verb_sv, verb_en in verbs:
            for time_sv, time_en in time_phrases:
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
            for time_sv, time_en in time_phrases:
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
    entries = _base_word_entries() + _generate_phrase_entries()

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
                "exampleSv": f"{swedish.capitalize()} används ofta i vardaglig svenska.",
                "exampleEn": f"{english.capitalize()} is often used in everyday Swedish.",
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

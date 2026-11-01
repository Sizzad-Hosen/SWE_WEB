import type { Activity } from "../features/learning/data/curriculum";

type UnknownRecord = Record<string, unknown>;

/**
 * Minimal database activity shape used by this mapper.
 * It is kept here so this legacy utility does not depend on a missing service type.
 */
export type LessonActivity = {
  id: string;
  activity_type: string;
  title_bn: string;
  instruction_bn?: string | null;
  payload?: UnknownRecord | null;
};

function asRecord(value: unknown): UnknownRecord {
  return typeof value === "object" && value !== null
    ? (value as UnknownRecord)
    : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function asEmojiWordItems(
  value: unknown,
): Array<{ emoji: string; word: string }> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const record = asRecord(item);
    const word = asString(record.word);

    if (!word) {
      return [];
    }

    return [
      {
        emoji: asString(record.emoji, "📘"),
        word,
      },
    ];
  });
}

/**
 * Converts published Supabase lesson rows to the local curriculum activity format.
 */
export function mapSupabaseActivities(
  activities: LessonActivity[],
): Activity[] {
  return activities.map((item): Activity => {
    const payload = asRecord(item.payload);
    const instruction = item.instruction_bn ?? "";

    switch (item.activity_type) {
      case "story_snippet":
        return {
          id: item.id,
          type: "snippet",
          title: item.title_bn,
          imageEmoji: asString(payload.imageEmoji, "📖"),
          lines: asStringArray(payload.lines),
        };

      case "audio_lesson":
        return {
          id: item.id,
          type: "voice",
          prompt: instruction,
          word: asString(payload.text),
          emoji: asString(payload.emoji, "🎧"),
        };

      case "flashcard":
        return {
          id: item.id,
          type: "flashcard",
          prompt: instruction,
          cards: asEmojiWordItems(payload.cards),
        };

      case "matching":
        return {
          id: item.id,
          type: "matching",
          prompt: instruction,
          pairs: asEmojiWordItems(payload.pairs),
        };

      case "multiple_choice":
        return {
          id: item.id,
          type: "choice",
          prompt: instruction || item.title_bn,
          options: asStringArray(payload.options),
          answer: asNumber(payload.answer, 0),
          hint: asString(payload.hint),
        };

      default:
        return {
          id: item.id,
          type: "intro",
          title: item.title_bn,
          body: instruction,
        };
    }
  });
}
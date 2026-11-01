export type PublicationStatus =
  | 'draft'
  | 'published'
  | 'archived';


// =====================================
// Activity Types
// =====================================

export type SupabaseActivityType =
  | 'story_snippet'
  | 'image_lesson'
  | 'audio_lesson'
  | 'video_lesson'
  | 'flashcard'
  | 'matching'
  | 'multiple_choice'
  | 'tap'
  | 'snippet'
  | 'letter'
  | 'word_build'
  | 'picture_choice'
  | 'drag_game';


export type LessonActivityType = SupabaseActivityType;



// =====================================
// Base Payload
// =====================================

type BasePayload = {

  schema_version:number;

  reward_xp?:number;

};




// =====================================
// Existing Payloads
// =====================================


export type StorySnippetPayload =
BasePayload & {

  kind:'guided_story';

  slides:Array<{

    id:string;

    emoji?:string;

    text_bn:string;

    speech_bn?:string;

    image_url?:string;

  }>;

};



export type ImageLessonPayload =
BasePayload & {

  asset_key?:string;

  image_url?:string;

  page_start?:number;

  page_end?:number;

  allow_zoom?:boolean;

  source_label?:string;


  hotspots?:Array<{

    id:string;

    x:number;

    y:number;

    label_bn:string;

    speech_bn?:string;

  }>;

};



export type AudioLessonPayload =
BasePayload & {

  mode:
  | 'listen'
  | 'listen_repeat';


  audio_source:
  | 'device_tts'
  | 'remote_url';


  locale?:string;


  items:Array<{

    id:string;

    text_bn:string;

    audio_url?:string;

    image_url?:string;

    emoji?:string;

  }>;

};



export type VideoLessonPayload =
BasePayload & {

  video_url:string;

  poster_url?:string;

  captions_bn?:string;

  autoplay?:boolean;

};



export type FlashcardPayload =
BasePayload & {

  audio_source?:
  | 'device_tts'
  | 'remote_url';


  locale?:string;


  cards:Array<{

    id:string;

    word_bn:string;

    emoji?:string;

    image_url?:string;

    audio_url?:string;

    speech_bn?:string;

  }>;

};



export type MatchingPayload =
BasePayload & {

  shuffle?:boolean;


  pairs:Array<{

    id:string;

    word_bn:string;

    emoji?:string;

    image_url?:string;

    audio_url?:string;

  }>;

};



export type MultipleChoicePayload =
BasePayload & {

  question_source:
  'quiz_questions';


  shuffle_questions?:boolean;


  pass_score_percent?:number;

};




// =====================================
// New Beginner Learning Payloads
// =====================================


export type SnippetPayload =
BasePayload & {

  imageEmoji?:string;


  lines:string[];

};



export type TapPayload =
BasePayload & {

  prompt:string;


  items:Array<{

    id:string;

    emoji?:string;

    label_bn:string;

    description_bn?:string;

  }>;

};




export type LetterPayload =
BasePayload & {


  letter:string;


  sound?:string;


  examples?:Array<{

    emoji?:string;

    word_bn:string;

    image_url?:string;

    audio_url?:string;

  }>;

};




export type WordBuildPayload =
BasePayload & {

  letters:string[];

  answer:string;

};





export type PictureChoicePayload =
BasePayload & {


  question:string;


  options:Array<{

    emoji?:string;

    label_bn:string;

    image_url?:string;

  }>;


  answer:number;

};





export type DragGamePayload =
BasePayload & {


  prompt:string;


  items:Array<{

    emoji?:string;

    label_bn?:string;

    target:string;

  }>;

};




// =====================================
// Payload Mapping
// =====================================


export type ActivityPayloadMap = {


  story_snippet:
  StorySnippetPayload;


  image_lesson:
  ImageLessonPayload;


  audio_lesson:
  AudioLessonPayload;


  video_lesson:
  VideoLessonPayload;


  flashcard:
  FlashcardPayload;


  matching:
  MatchingPayload;


  multiple_choice:
  MultipleChoicePayload;



  tap:
  TapPayload;


  snippet:
  SnippetPayload;


  letter:
  LetterPayload;


  word_build:
  WordBuildPayload;


  picture_choice:
  PictureChoicePayload;


  drag_game:
  DragGamePayload;


};





// =====================================
// Lesson Activity
// =====================================


type LessonActivityBase = {

  id:string;


  chapter_id:string;


  order_index:number;


  title_bn:string | null;


  title_en:string | null;


  instruction_bn:string | null;


  instruction_en:string | null;


  status:PublicationStatus;

};





export type SupabaseLessonActivity = {

  [Type in LessonActivityType]:

  LessonActivityBase & {

    activity_type:Type;


    payload:
    ActivityPayloadMap[Type];

  };

}[LessonActivityType];





// =====================================
// Quiz
// =====================================


export type SupabaseQuizOption = {

  id:string;

  question_id:string;

  option_order:number;

  label_bn:string | null;

  label_en:string | null;

  image_url:string | null;

  is_correct:boolean;

};





export type SupabaseQuizQuestion = {


  id:string;


  chapter_id:string;


  activity_id:string | null;


  order_index:number;


  question_bn:string;


  question_en:string | null;


  explanation_bn:string | null;


  explanation_en:string | null;


  image_url:string | null;


  status:PublicationStatus;


  quiz_options:
  SupabaseQuizOption[];

};





// =====================================
// Chapter
// =====================================


export type SupabaseCurriculumChapter = {


  id:string;


  class_level:number;


  subject_id:string;


  chapter_number:number;


  title_bn:string;


  title_en:string | null;


  summary_bn:string | null;


  summary_en:string | null;


  cover_url:string | null;


  status:PublicationStatus;


  lesson_activities:
  SupabaseLessonActivity[];


  quiz_questions:
  SupabaseQuizQuestion[];

};
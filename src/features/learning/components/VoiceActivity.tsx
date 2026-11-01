import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "../../../web/dom";
import * as Speech from "../../../web/speech";

import MimiCharacter from "./MimiCharacter";
import MimiBubble from "../components/MimiBubble";

type Props = {
  activity: {
    payload: {
      prompt: string;
      word: string;
      emoji: string;
    };
  };
  onComplete: () => void;
};

export default function VoiceActivity({
  activity,
  onComplete,
}: Props) {
  const data = activity.payload;

  const [recording, setRecording] = useState(false);

  const startRecording = () => {
    setRecording(true);

    Speech.stop();
    Speech.speak(data.prompt, {
      language: "bn-BD",
      rate: 0.75,
    });

    setTimeout(() => {
      setRecording(false);
      onComplete();
    }, 2500);
  };

  return (
    <View style={styles.container}>
      <MimiCharacter emotion="happy" size={180} />

      <MimiBubble text={data.prompt} />

      <Text style={styles.emoji}>{data.emoji}</Text>

      <Text style={styles.word}>{data.word}</Text>

      <Pressable
        style={styles.button}
        onPress={startRecording}
      >
        <Text style={styles.buttonText}>
          {recording ? "🎙️ শুনছি..." : "🎤 বলো"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 20,
  },

  emoji: {
    fontSize: 70,
    marginTop: 20,
  },

  word: {
    fontSize: 34,
    fontWeight: "900",
    marginVertical: 20,
  },

  button: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 25,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 20,
  },
});

import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "../../../web/dom";
type Props = {
  activity: {
    payload: {
      title: string;
      text: string;
      audio?: string;
    };
  };
};

export default function AudioStoryActivity({ activity }: Props) {
  const data = activity.payload;
  const [playing, setPlaying] = useState(false);


  function playAudio() {
    // পরে এখানে expo-audio যুক্ত হবে
    setPlaying(true);

    setTimeout(() => {
      setPlaying(false);
    }, 2000);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🔊</Text>

      <Text style={styles.title}>{data.title}</Text>

      <Text style={styles.text}>{data.text}</Text>

      <TouchableOpacity style={styles.button} onPress={playAudio}>
        <Text style={styles.buttonText}>
          {playing ? "শুনছি..." : "শুনুন 🔊"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,

    alignItems: "center",
  },

  emoji: {
    fontSize: 60,
  },

  title: {
    fontSize: 26,

    fontWeight: "700",

    marginVertical: 15,
  },

  text: {
    fontSize: 22,

    textAlign: "center",

    lineHeight: 35,
  },

  button: {
    backgroundColor: "#FFD166",

    paddingHorizontal: 30,

    paddingVertical: 15,

    borderRadius: 20,

    marginTop: 25,
  },

  buttonText: {
    fontSize: 20,

    fontWeight: "700",
  },
});

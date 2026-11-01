import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "../../../web/dom";

import { colors, shadows } from "../../../theme/theme";
import type { Activity } from "../data/curriculum";

type ImageActivity = {
  title?: string;
  instruction?: string;
  data: {
    image?: string;
    description?: string;
    sourceLabel?: string;
  };
};
type Props = {
  activity: ImageActivity;
  completed: boolean;
  onComplete: () => void;
};

export function ImageLessonActivity({
  activity,
  completed,
  onComplete,
}: Props) {
  const { title, instruction, data } = activity;
  const [loading, setLoading] = useState(Boolean(data.image));
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <View>
      <Text style={styles.title}>{title}</Text>
      {activity.instruction ? (
        <Text style={styles.instruction}>{instruction}</Text>
      ) : null}

      <View style={styles.imageCard}>
        {data.image && !imageFailed ? (
          <>
            {loading ? (
              <ActivityIndicator
                style={styles.loader}
                size="large"
                color={colors.blue}
              />
            ) : null}
            <Image
              source={{ uri: data.image }}
              style={styles.image}
              resizeMode="contain"
              onLoadEnd={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setImageFailed(true);
              }}
            />
          </>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderIcon}>🖼️</Text>
            <Text style={styles.placeholderText}>
              ছবিটি এখন দেখানো যাচ্ছে না। আবার পরে চেষ্টা করো।
            </Text>
          </View>
        )}
      </View>
      {data.sourceLabel ? (
        <Text style={styles.source}>{data.sourceLabel}</Text>
      ) : null}

      <Pressable
        style={[styles.completeButton, completed && styles.completedButton]}
        onPress={onComplete}
      >
        <Text style={styles.completeText}>
          {completed ? "✓ দেখা হয়েছে" : "ছবিটি দেখা শেষ"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 23,
    fontWeight: "900",
    color: colors.ink,
    textAlign: "center",
  },
  instruction: {
    marginTop: 7,
    marginBottom: 12,
    color: colors.muted,
    textAlign: "center",
    fontWeight: "700",
    lineHeight: 20,
  },
  imageCard: {
    minHeight: 260,
    marginTop: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFF",
    overflow: "hidden",
    ...shadows.card,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    width: "100%",
    height: 320,
    backgroundColor: "#FFF",
  },
  placeholder: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  placeholderIcon: { fontSize: 52 },
  placeholderText: {
    marginTop: 8,
    color: colors.muted,
    fontWeight: "700",
    textAlign: "center",
  },
  source: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  completeButton: {
    marginTop: 18,
    alignSelf: "center",
    borderRadius: 16,
    paddingHorizontal: 22,
    paddingVertical: 12,
    backgroundColor: colors.orange,
  },
  completedButton: {
    backgroundColor: colors.green,
  },
  completeText: {
    color: "#FFF",
    fontWeight: "900",
  },
});

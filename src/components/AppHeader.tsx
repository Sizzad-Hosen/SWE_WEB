import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "../web/dom";
import { colors, shadows } from "../theme/theme";

type Props = {
  title?: string;
  onParentPress?: () => void;
};

export function AppHeader({ title = "NCTB KidsApp", onParentPress }: Props) {
  return (
    <View style={styles.header}>
      <Image
        source={'/images/tiger.png'}
        style={styles.avatar}
      />
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity
        style={styles.lock}
        onPress={onParentPress}
        accessibilityLabel="Parent area"
      >
        <Text style={styles.lockText}>🔒</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 48,
    borderRadius: 22,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    ...shadows.card,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFE7B7",
  },
  title: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "900",
    color: "#9A5700",
  },
  lock: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  lockText: { fontSize: 18 },
});

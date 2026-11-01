import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "../web/dom";

type RouteName =
  | "Subjects"
  | "Progress"
  | "Donation"
  | "Settings";

type ActiveRouteName =
  | RouteName
  | "Leaderboard";

type Props = {
  navigation: any;
  active: ActiveRouteName;
};

const items: Array<{
  route: RouteName;
  icon: string;
  label: string;
}> = [
  {
    route: "Subjects",
    icon: "📚",
    label: "Books",
  },
  {
    route: "Progress",
    icon: "📊",
    label: "Progress",
  },
  {
    route: "Donation",
    icon: "❤️",
    label: "Support",
  },
  {
    route: "Settings",
    icon: "⚙️",
    label: "Settings",
  },
];

export function BottomNav({
  navigation,
  active,
}: Props) {
  return (
    <View style={styles.bar}>
      {items.map((item) => {
        const selected =
          item.route === active;

        return (
          <Pressable
            key={item.route}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            onPress={() =>
              navigation.navigate(item.route)
            }
            style={({ pressed }) => [
              styles.item,
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.iconBubble,
                selected &&
                  styles.selectedBubble,
              ]}
            >
              <Text style={styles.icon}>
                {item.icon}
              </Text>
            </View>

            <Text
              style={[
                styles.label,
                selected &&
                  styles.selectedLabel,
              ]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 5,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#E1DCE5",
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    shadowColor: "#776E79",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 11,
    elevation: 6,
  },

  item: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
  },

  pressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.88,
  },

  iconBubble: {
    minWidth: 42,
    height: 31,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },

  selectedBubble: {
    backgroundColor: "#EEE6FF",
  },

  icon: {
    fontSize: 17,
  },

  label: {
    maxWidth: "100%",
    marginTop: 3,
    fontSize: 8,
    fontWeight: "700",
    color: "#8A818D",
    textAlign: "center",
  },

  selectedLabel: {
    color: "#6545A8",
    fontWeight: "900",
  },
});

import React from "react";
import { createNativeStackNavigator } from "../web/navigation";

import type { RootStackParamList } from "./routes";
import SubjectSelectionScreen from "../features/learning/screens/SubjectSelectionScreen";
import ChapterPathScreen from "../features/learning/screens/ChapterPathScreen";
import LessonPlayerScreen from "../features/learning/screens/LessonPlayerScreen";
import ProgressScreen from "../features/progress/screens/ProgressScreen";
import DonationScreen from "../features/donation/screens/DonationScreen";
import SettingsScreen from "../features/settings/screens/SettingsScreen";
import AdultGateScreen from "../features/parent/screens/AdultGateScreen";
import ParentDashboardScreen from "../features/parent/screens/ParentDashboardScreen";
import LoginScreen from "../features/auth/screens/LoginScreen";
import RegisterScreen from "../features/auth/screens/RegisterScreen";
import ForgotPasswordScreen from "../features/auth/screens/ForgotPasswordScreen";
import AdminLoginScreen from "../features/admin/screens/AdminLoginScreen";
import AdminDashboardScreen from "../features/admin/screens/AdminDashboardScreen";
import AdminContentEditorScreen from "../features/admin/screens/AdminContentEditorScreen";
import AdminQuizEditorScreen from "../features/admin/screens/AdminQuizEditorScreen";

const Stack =
  createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Subjects"
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: {
          backgroundColor: "#F6F3F8",
        },
      }}
    >
      <Stack.Screen
        name="Subjects"
        component={SubjectSelectionScreen}
      />
      <Stack.Screen
        name="ChapterPath"
        component={ChapterPathScreen}
      />
      <Stack.Screen
        name="Lesson"
        component={LessonPlayerScreen}
      />
      <Stack.Screen
        name="Progress"
        component={ProgressScreen}
      />
      <Stack.Screen
        name="Donation"
        component={DonationScreen}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
      />

      <Stack.Screen
        name="AdultGate"
        component={AdultGateScreen}
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />

      <Stack.Screen
        name="Login"
        component={LoginScreen}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
      />
      <Stack.Screen
        name="ParentDashboard"
        component={ParentDashboardScreen}
      />

      <Stack.Screen
        name="AdminLogin"
        component={AdminLoginScreen}
      />
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
      />
      <Stack.Screen
        name="AdminContentEditor"
        component={AdminContentEditorScreen}
      />
      <Stack.Screen
        name="AdminQuizEditor"
        component={AdminQuizEditorScreen}
      />
    </Stack.Navigator>
  );
}

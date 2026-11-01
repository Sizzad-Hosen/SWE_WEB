import React from "react";
import { NavigationContainer } from "../web/navigation";
import { createNativeStackNavigator } from "../web/navigation";

import { useAuth } from "../contexts/AuthContext";
import ResetPasswordScreen from "../features/auth/screens/ResetPasswordScreen";
import ParentLinkedRecoveryScreen from "../features/student/screens/ParentLinkedRecoveryScreen";
import RecoveryBackupScreen from "../features/student/screens/RecoveryBackupScreen";
import StudentRecoveryScreen from "../features/student/screens/StudentRecoveryScreen";
import StudentSetupScreen from "../features/student/screens/StudentSetupScreen";
import { useStudentStore } from "../features/student/store/studentStore";
import AppNavigator from "./AppNavigator";
import type { GateStackParamList } from "./gateRoutes";

export type { GateStackParamList } from "./gateRoutes";

const Stack = createNativeStackNavigator<GateStackParamList>();

export default function RootNavigator() {
  const student = useStudentStore((state) => state.student);
  const { recoveryUrl } = useAuth();

  const needsRecoveryBackup = Boolean(
    student?.recoveryCode &&
      !student.recoveryAcknowledged,
  );

  return (
    <NavigationContainer>
      {recoveryUrl ? (
        <Stack.Navigator
          key="password-recovery"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen
            name="PasswordRecovery"
            component={ResetPasswordScreen}
          />
        </Stack.Navigator>
      ) : !student ? (
        <Stack.Navigator
          key="student-entry"
          initialRouteName="StudentSetup"
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen
            name="StudentSetup"
            component={StudentSetupScreen}
          />

          <Stack.Screen
            name="ParentLinkedRecovery"
            component={ParentLinkedRecoveryScreen}
            options={{
              presentation: "modal",
              animation: "slide_from_bottom",
            }}
          />

          <Stack.Screen
            name="StudentRecovery"
            component={StudentRecoveryScreen}
            options={{
              presentation: "modal",
              animation: "slide_from_bottom",
            }}
          />
        </Stack.Navigator>
      ) : needsRecoveryBackup ? (
        <Stack.Navigator
          key="recovery-backup"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen
            name="RecoveryBackup"
            component={RecoveryBackupScreen}
          />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator
          key="main-app"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen
            name="MainApp"
            component={AppNavigator}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

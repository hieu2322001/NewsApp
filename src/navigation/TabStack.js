import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import firestore from '@react-native-firebase/firestore';

import {
  BookmarkView,
  DetailView,
  HomeView,
  SettingsView,
  Mentions,
} from '../views';
import TabBar from '../components/TabBar';
import {
  AuthContext,
  BookmarkProvider,
  NotificationContext,
  SettingsProvider,
  useTimer,
} from '../context';
import { AppState } from 'react-native';
import AuthStack from './AuthStack';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeView}
        options={() => {
          return { headerShown: false };
        }}
      />
      <Stack.Screen
        name="Detail"
        component={DetailView}
        options={() => {
          return { headerShown: false };
        }}
      />
    </Stack.Navigator>
  );
}

export const TabNavigator = () => {
  const { timer } = useTimer();
  const { setIsAppBackground } = React.useContext(NotificationContext);
  const timeRef = firestore().collection('users');
  const dateObj = new Date();
  const day = dateObj.getDate();
  const dayId = dateObj.getDay();
  const sessionId = dateObj.getTime();

  const { user, isAuth } = React.useContext(AuthContext);

  useEffect(() => {
    timer.resume();
    (async () => {
      try {
        setTimeout(async () => {
          if (user) {
            const userDoc = (await timeRef.doc(user.uid).get()).data();
            if (userDoc.timeSpent.length === 7) {
              userDoc.timeSpent = [
                {
                  sessionId,
                  dateObj,
                  dayId,
                  day,
                  totalTime: [{ t: 0, sessionId }],
                },
              ];
              await timeRef.doc(user.uid).set(userDoc);
            } else {
              const ind = userDoc.timeSpent.findIndex((d) => d.dayId === dayId);
              if (ind === -1) {
                userDoc.timeSpent.push({
                  dateObj,
                  dayId,
                  day,
                  totalTime: [{ t: 0, sessionId }],
                });
              }
            }
            await timeRef.doc(user.uid).set(userDoc);
          }
        }, 1000);
      } catch (err) {
      }
    })();

    // AppState.addEventListener('change', handleAppStateChange);
    // return () => AppState.remove();
    const myListener = AppState.addEventListener('change', handleAppStateChange);
    return () => { myListener.remove() } 
    // if (AppState._eventHandlers.change.size === 0) {
    //   AppState.addEventListener('change', this.handleAppStateChange)
    //   return () => AppState.remove();
    // }
  }, [user]);

  const handleAppStateChange = (state) => {
    switch (state) {
      case 'active':
        timer.resume();
        setIsAppBackground(false);
        break;
      default:
        timer.pause();
        setIsAppBackground(true);
        (async () => {
          try {
            if (user) {
              const userDoc = (await timeRef.doc(user.uid).get()).data();

              const ind = userDoc.timeSpent.findIndex((d) => d.dayId === dayId);

              const tIndex = userDoc.timeSpent[ind].totalTime.findIndex(
                (f) => f.sessionId === sessionId,
              );

              if (tIndex > -1) {
                userDoc.timeSpent[ind].totalTime[tIndex].t = timer.totalTime;
              } else {
                userDoc.timeSpent[ind].totalTime.push({
                  t: timer.totalTime,
                  sessionId,
                });
              }
              await timeRef.doc(user.uid).set(userDoc);
            }
          } catch (err) {
          }
        })();
        break;
    }
  };

  return (
    <SettingsProvider>
      <BookmarkProvider>
        {!isAuth ? (
          <NavigationContainer>
            <Tab.Navigator
              tabBarOptions={{ keyboardHidesTabBar: true }}
              initialRouteName="Home"
              tabBar={(props) => <TabBar {...props} />}
            >
              <Tab.Screen name="Bookmark" component={BookmarkView} />
              <Tab.Screen name="Mentions" component={Mentions} />
              <Tab.Screen name="Home" component={HomeStack} />
              <Tab.Screen name="Settings" component={SettingsView} />
            </Tab.Navigator>
          </NavigationContainer>
        ) : (
          <AuthStack />
        )}
        <NavigationContainer />
      </BookmarkProvider>
    </SettingsProvider>
  );
};

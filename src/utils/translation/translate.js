import LocalizedStrings from 'react-native-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { english, chinese, turkish, vietnamese } from './languages';

let strings = new LocalizedStrings({
  en: english,
  tr: turkish,
  zh: chinese,
  vn: vietnamese,
});

export const firstLanguage = async () => {
  try {
    const value = await AsyncStorage.getItem('appLanguage');
    if (value) {
      strings.setLanguage(value);
    }
  } catch (err) {
  }
};

export { strings };

export const changeLanguage = (languageKey) => {
  try {
    strings.setLanguage(languageKey);
  } catch (err) {
  }
};

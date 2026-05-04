import { StyleSheet, Text } from 'react-native';

import AppCard from '../components/AppCard';
import Screen from '../components/Screen';
import ScreenHeader from '../components/ScreenHeader';

const FAQScreen = () => {
  return (
    <Screen>
      <ScreenHeader title="FAQ" />
      <AppCard>
        <Text style={styles.title}>FAQ</Text>
        <Text style={styles.body}>
          Add frequently asked questions here to help users quickly find answers.
        </Text>
      </AppCard>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
  },
});

export default FAQScreen;

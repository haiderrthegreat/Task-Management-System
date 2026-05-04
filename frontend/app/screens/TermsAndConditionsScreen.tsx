import { StyleSheet, Text } from 'react-native';

import AppCard from '../components/AppCard';
import Screen from '../components/Screen';
import ScreenHeader from '../components/ScreenHeader';

const TermsAndConditionsScreen = () => {
  return (
    <Screen>
      <ScreenHeader title="Terms & Conditions" />
      <AppCard>
        <Text style={styles.title}>Terms and Conditions</Text>
        <Text style={styles.body}>
          Your terms and conditions content goes here. Add clauses for acceptable use, liabilities, and account rules.
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

export default TermsAndConditionsScreen;

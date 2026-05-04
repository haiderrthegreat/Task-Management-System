import { StyleSheet, Text } from 'react-native';

import AppCard from '../components/AppCard';
import Screen from '../components/Screen';
import ScreenHeader from '../components/ScreenHeader';

const AboutUsScreen = () => {
  return (
    <Screen>
      <ScreenHeader title="About Us" />
      <AppCard>
        <Text style={styles.title}>About Us</Text>
        <Text style={styles.body}>
          Share information about your product, team mission, and contact details here.
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

export default AboutUsScreen;

import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenProps = PropsWithChildren<{
  style?: ViewStyle;
  disableTopInset?: boolean;
}>;

const Screen = ({ children, style, disableTopInset = false }: ScreenProps) => {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      style={styles.safe}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: 1,
            paddingBottom: 20,
          },
          style,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20, // ✅ good already
    flexGrow: 1,
  },
});

export default Screen;
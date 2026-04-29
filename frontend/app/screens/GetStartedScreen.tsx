import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList } from '../navigation/types';

const { height } = Dimensions.get('window');
const HERO_HEIGHT = Math.round(height * 0.62);

type GetStartedScreenNavigationProp = NativeStackNavigationProp<
	RootStackParamList,
	'GetStarted'
>;

const GetStartedScreen = () => {
	const navigation = useNavigation<GetStartedScreenNavigationProp>();
	const insets = useSafeAreaInsets();

	return (
		<SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
			<View style={[styles.heroArea, { paddingTop: insets.top + 20 }]}>
				<View style={styles.shapeOne} />
				<View style={styles.shapeTwo} />
				<Text style={styles.brand}>TaskFlow</Text>
				<Text style={styles.heroTitle}>Plan better.{"\n"}Ship faster.</Text>
			</View>

			<View style={styles.contentArea}>
				<Text style={styles.title}>
					Run projects with clarity, collaboration, and momentum.
				</Text>

				<Text style={styles.description}>
					Manage tasks, track workspace progress, and keep your team aligned.
				</Text>

				<TouchableOpacity
					style={styles.button}
					onPress={() => navigation.navigate('Login')}
				>
					<Text style={styles.buttonText}>Get Started</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: '#FFFFFF',
	},
	heroArea: {
		height: HERO_HEIGHT,
		width: '100%',
		backgroundColor: '#0F172A',
		paddingHorizontal: 24,
		justifyContent: 'center',
		overflow: 'hidden',
	},
	shapeOne: {
		position: 'absolute',
		width: 220,
		height: 220,
		borderRadius: 110,
		backgroundColor: '#0EA5E955',
		right: -40,
		top: -30,
	},
	shapeTwo: {
		position: 'absolute',
		width: 180,
		height: 180,
		borderRadius: 90,
		backgroundColor: '#14B8A655',
		left: -40,
		bottom: -30,
	},
	brand: {
		color: '#A5F3FC',
		fontSize: 16,
		fontWeight: '700',
		letterSpacing: 1.1,
		textTransform: 'uppercase',
	},
	heroTitle: {
		marginTop: 14,
		color: '#FFFFFF',
		fontSize: 26,
		lineHeight: 32,
		fontWeight: '800',
	},
	contentArea: {
		flex: 1,
		paddingTop: 28,
		paddingHorizontal: 30,
		paddingBottom: 22,
		backgroundColor: '#FFFFFF',
	},
	title: {
		color: '#0F172A',
		fontSize: 21,
		lineHeight: 30,
		fontWeight: '700',
		letterSpacing: 0.1,
	},
	description: {
		marginTop: 14,
		color: '#64748B',
		fontSize: 15,
		lineHeight: 22,
		fontWeight: '400',
	},
	button: {
		marginTop: 28,
		height: 52,
		borderRadius: 30,
		backgroundColor: '#0F766E',
		alignItems: 'center',
		justifyContent: 'center',
	},
	buttonText: {
		color: '#FFFFFF',
		fontSize: 15,
		fontWeight: '600',
		letterSpacing: 0.2,
	},
});

export default GetStartedScreen;

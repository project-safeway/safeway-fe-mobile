import { StyleSheet, View, Text } from "react-native";

export default function HomeScreen() {
    return (
        <View style={styles.container}>
            <Text>Olá mundo!</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
    }
})
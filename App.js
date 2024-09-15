import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Button } from 'react-native';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Camera } from 'expo-camera';

const Stack = createStackNavigator();

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Image source={require('./assets/app-logo.png')} style={styles.logo} />
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Report')}>
        <Text style={styles.buttonText}>Start Report</Text>
      </TouchableOpacity>
    </View>
  );
};

const ReportScreen = () => {
  const [image, setImage] = useState(null);
  const [audio, setAudio] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: audioStatus } = await Audio.requestPermissionsAsync();
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      setHasPermission(cameraStatus === 'granted' && audioStatus === 'granted' && locationStatus === 'granted');
    })();
  }, []);

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      const { recording } = await Audio.Recording.createAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      setAudio(recording);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = async () => {
    try {
      await audio.stopAndUnloadAsync();
      const uri = audio.getURI();
      setAudio(uri);
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const submitReport = async () => {
    const formData = new FormData();

    if (image) {
      const imageUri = image.uri;
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image';

      formData.append('image', {
        uri: imageUri,
        name: filename,
        type,
      });
    }

    // Hardcoded audio as string
    formData.append('audio', 'I am in a car crash');

    formData.append('healthData', 'Name: Nikhil Dhoka, Age: 24, Blood Type: B+, Heart Beat: 80bpm');;
    formData.append('location', '501 N Capitol Ave');
    formData.append('userPhone', '6462296260');

    try {
      const response = await axios.post('http://127.0.0.1:8000/emergency', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Report submitted successfully', response.data);
    } catch (error) {
      console.error('Error submitting report:', error);
    }
  };

  if (hasPermission === null) {
    return <View />;
  }

  if (hasPermission === false) {
    return <Text>No access to camera, microphone, or location.</Text>;
  }

  return (
    <View style={styles.container}>
      <Button title="Pick an Image" onPress={pickImage} />
      {image && <Image source={{ uri: image.uri }} style={{ width: 200, height: 200 }} />}
      
      <TouchableOpacity style={styles.button} onPress={audio ? stopRecording : startRecording}>
        <Text style={styles.buttonText}>{audio ? 'Stop Recording' : 'Start Recording'}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={submitReport}>
        <Text style={styles.buttonText}>Submit Report</Text>
      </TouchableOpacity>
    </View>
  );
};

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Report" component={ReportScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  button: {
    backgroundColor: 'black',
    padding: 15,
    borderRadius: 5,
    margin: 10,
  },
  buttonText: {
    fontSize: 18,
    color: 'white',
  },
});

export default App;
import { useEffect, useRef } from "react";
import { Animated, PanResponder, TouchableOpacity, View, StyleSheet, Image } from "react-native";

 const ZoomableImage = ({ uri, onClose }: { uri: string; onClose: () => void }) => {
    const scale = useRef(new Animated.Value(1)).current;
    const translateX = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;
  
    const lastScale = useRef(1);
    const lastTranslateX = useRef(0);
    const lastTranslateY = useRef(0);
  
    const pinchRef = useRef<any>(null);
    const panRef = useRef<any>(null);
  
    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
        },
        onPanResponderGrant: () => {
          translateX.setOffset(lastTranslateX.current);
          translateY.setOffset(lastTranslateY.current);
        },
        onPanResponderMove: (_, gestureState) => {
          if (lastScale.current > 1) {
            translateX.setValue(gestureState.dx);
            translateY.setValue(gestureState.dy);
          }
        },
        onPanResponderRelease: () => {
          lastTranslateX.current += translateX._value;
          lastTranslateY.current += translateY._value;
          translateX.setOffset(0);
          translateY.setOffset(0);
          translateX.setValue(0);
          translateY.setValue(0);
        },
      })
    ).current;
  
    const pinchResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          scale.setOffset(lastScale.current);
        },
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.numberActiveTouches === 2) {
            const dx = Math.abs(gestureState.dx);
            const dy = Math.abs(gestureState.dy);
            const distance = Math.sqrt(dx * dx + dy * dy);
            const scaleValue = (distance / 100) * lastScale.current;
            scale.setValue(Math.max(1, Math.min(scaleValue, 5))); // Zoom entre 1x y 5x
          }
        },
        onPanResponderRelease: () => {
          lastScale.current = scale._value;
          scale.setOffset(0);
          scale.setValue(lastScale.current);
  
          // Reset si el zoom es menor a 1
          if (lastScale.current < 1) {
            Animated.spring(scale, {
              toValue: 1,
              useNativeDriver: true,
            }).start();
            lastScale.current = 1;
          }
  
          // Reset posición si está muy lejos
          if (Math.abs(lastTranslateX.current) > 300 || Math.abs(lastTranslateY.current) > 300) {
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
            Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
            lastTranslateX.current = 0;
            lastTranslateY.current = 0;
          }
        },
      })
    ).current;
  
    // Reset al cerrar
    useEffect(() => {
      return () => {
        lastScale.current = 1;
        lastTranslateX.current = 0;
        lastTranslateY.current = 0;
      };
    }, [onClose]);
  
    return (
      <View style={styles.modalBackground}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[
            styles.zoomedImageContainer,
            {
              transform: [
                { scale },
                { translateX },
                { translateY },
              ],
            },
          ]}
          {...pinchResponder.panHandlers}
          {...panResponder.panHandlers}
        >
          <Image
            source={{ uri }}
            style={styles.zoomedImage}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    );

    
  };
  const styles = StyleSheet.create({
    zoomedImageContainer: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
      },
      zoomedImage: {
        width: "90%",
        height: "90%",
        maxWidth: 400,
        maxHeight: 600,
      },
      modalBackground: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.9)",
        justifyContent: "center",
        alignItems: "center",
      },
  })
  export default ZoomableImage;
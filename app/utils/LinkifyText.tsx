import React from "react";
import { Text, Linking, StyleSheet } from "react-native";

type Props = {
  description: string;
  styles: any
};

const LinkifyText: React.FC<Props> = ({ description, styles }) => {
  // Regex simple para detectar links (http, https)
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  // Divide el texto en partes (links y texto normal)
  const parts = description.split(urlRegex);

  return (
    <Text style={styles}>
      {parts.map((part, index) => {
        if (urlRegex.test(part)) {
          return (
            <Text
              key={index}
              style={styles.link}
              onPress={() => Linking.openURL(part)}
            >
              {part}
            </Text>
          );
        }
        return <Text key={index}>{part}</Text>;
      })}
    </Text>
  );
};

const styles = StyleSheet.create({
  link: {
    color: "#1e90ff",
    textDecorationLine: "underline",
  },
});

export default LinkifyText;

 

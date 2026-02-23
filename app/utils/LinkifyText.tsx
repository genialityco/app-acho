import React from "react";
import { Text, Linking, StyleSheet } from "react-native";

type Props = {
  description: string;
  styles: any
};

const linkStyles = StyleSheet.create({
  link: {
    color: "#1e90ff",
    textDecorationLine: "underline",
  },
});

const LinkifyText: React.FC<Props> = ({ description, styles }) => {
  // Regex para captar links en formato markdown [texto](url) o URLs directas
  const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)|https?:\/\/[^\s]+/g;

  // Divide el texto en partes
  let parts: any[] = [];
  let lastIndex = 0;
  let match;

  while ((match = markdownLinkRegex.exec(description)) !== null) {
    // Texto antes del link
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: description.slice(lastIndex, match.index)
      });
    }

    // Link capturado
    if (match[1] && match[2]) {
      // Formato markdown: [texto](url)
      parts.push({
        type: 'link',
        text: match[1],
        url: match[2]
      });
    } else {
      // URL directa
      parts.push({
        type: 'link',
        text: match[0],
        url: match[0]
      });
    }

    lastIndex = markdownLinkRegex.lastIndex;
  }

  // Texto restante
  if (lastIndex < description.length) {
    parts.push({
      type: 'text',
      content: description.slice(lastIndex)
    });
  }

  return (
    <Text style={styles}>
      {parts.map((part, index) => {
        if (part.type === 'link') {
          return (
            <Text
              key={index}
              style={linkStyles.link}
              onPress={() => Linking.openURL(part.url)}
            >
              {part.text}
            </Text>
          );
        }
        return <Text key={index}>{part.content}</Text>;
      })}
    </Text>
  );
};

export default LinkifyText;

 

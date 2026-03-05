import React from "react";
import { Text, Linking, StyleSheet } from "react-native";

type Props = {
  description: string;
  styles: any;
};

const linkStyles = StyleSheet.create({
  link: {
    color: "#3F5216",
    textDecorationLine: "underline",
  },
  bold: {
    fontWeight: "900",
    fontSize: 20,
  },
  italic: {
    fontStyle: "italic",
  },
  boldItalic: {
    fontWeight: "900",
    fontStyle: "italic",
    fontSize: 20,
  },
});

type Part = {
  type: "text" | "link" | "bold" | "italic" | "boldItalic";
  content?: string;
  text?: string;
  url?: string;
};

const LinkifyText: React.FC<Props> = ({ description, styles }) => {
  // Regex para captar: negrita+cursiva (***), negrita (**), cursiva (*),
  // links markdown [texto](url) y URLs directas
  const combinedRegex =
    /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)|\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*/g;

  let parts: Part[] = [];
  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(description)) !== null) {
    // Texto antes del match
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: description.slice(lastIndex, match.index),
      });
    }

    if (match[1] && match[2]) {
      // Link markdown: [texto](url)
      parts.push({ type: "link", text: match[1], url: match[2] });
    } else if (match[3]) {
      // Negrita + cursiva: ***texto***
      parts.push({ type: "boldItalic", content: match[3] });
    } else if (match[4]) {
      // Negrita: **texto**
      parts.push({ type: "bold", content: match[4] });
    } else if (match[5]) {
      // Cursiva: *texto*
      parts.push({ type: "italic", content: match[5] });
    }

    lastIndex = combinedRegex.lastIndex;
  }

  // Texto restante: puede contener URLs directas
  if (lastIndex < description.length) {
    const remaining = description.slice(lastIndex);
    const urlRegex = /https?:\/\/[^\s]+/g;
    let urlMatch;
    let urlLastIndex = 0;

    while ((urlMatch = urlRegex.exec(remaining)) !== null) {
      if (urlMatch.index > urlLastIndex) {
        parts.push({
          type: "text",
          content: remaining.slice(urlLastIndex, urlMatch.index),
        });
      }
      parts.push({ type: "link", text: urlMatch[0], url: urlMatch[0] });
      urlLastIndex = urlRegex.lastIndex;
    }

    if (urlLastIndex < remaining.length) {
      parts.push({ type: "text", content: remaining.slice(urlLastIndex) });
    }
  }

  return (
    <Text style={styles}>
      {parts.map((part, index) => {
        if (part.type === "link") {
          return (
            <Text
              key={index}
              style={linkStyles.link}
              onPress={() => Linking.openURL(part.url!)}
            >
              {part.text}
            </Text>
          );
        }
        if (part.type === "bold") {
          return (
            <Text key={index} style={linkStyles.bold}>
              {part.content}
            </Text>
          );
        }
        if (part.type === "italic") {
          return (
            <Text key={index} style={linkStyles.italic}>
              {part.content}
            </Text>
          );
        }
        if (part.type === "boldItalic") {
          return (
            <Text key={index} style={linkStyles.boldItalic}>
              {part.content}
            </Text>
          );
        }
        return <Text key={index}>{part.content}</Text>;
      })}
    </Text>
  );
};

export default LinkifyText;

 

import React from "react";
import { Image, Linking, StyleSheet, View } from "react-native";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card, Text } from "react-native-paper";

function ACHOInfoScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#A1CEDC" }}
      headerImage={
        <Image
          source={{
            uri: "https://ik.imagekit.io/6cx9tc1kx/Imagenes%20App%20Prueba/WhatsApp%20Image%202024-10-09%20at%204.21.51%20PM.jpeg?updatedAt=1728508944197",
          }}
          style={styles.headerImage}
        />
      }
    >
      {/* Contenido principal */}
      <View style={styles.container}>
        {/* Título principal */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineLarge" style={styles.centerText}>
              ¿Qué es la ACHO?
            </Text>
            <Text
              variant="labelSmall"
              style={[styles.centerText, styles.description]}
            >
              La Asociación Colombiana de Hematología y Oncología - ACHO, es una
              organización dedicada a la actualización académica de nuestros
              miembros.
            </Text>
            <Text variant="labelSmall" style={styles.centerText}>
              Estamos comprometidos con nuestros miembros en generar escenarios
              de actualización constantes y de investigación a la vanguardia de
              la tecnología para promover la participación y la información de
              calidad, en la prevención, diagnóstico, rehabilitación y
              tratamiento del cáncer y enfermedades hematológicas en Colombia,
              con el fin de aportar a la excelencia y la práctica médica basada
              en evidencia.
            </Text>
          </Card.Content>
        </Card>

        {/* Sección Historia */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.subtitle}>
              Nuestra Historia
            </Text>
            <Text variant="labelSmall" style={styles.centerText}>
              La Asociación Colombiana de Hematología y Oncología - ACHO, es la
              entidad gremial sin ánimo de lucro que cuenta con personería
              jurídica 2151 del 18/09/1984 que convoca y asocia a todos los
              Médicos Especialistas en Hematología y Oncología del país, con el
              fin de fomentar la actualización, promoviendo la mejora continua
              en las acciones de prevención, diagnóstico, rehabilitación y
              tratamiento. Cuenta con una política de calidad robusta que se
              orienta a apoyar las acciones de divulgación del conocimiento con
              la organización periódica de eventos académicos y de
              investigación. Garantizamos el cumplimiento de los requisitos
              legales, reglamentos y la mejora continua de nuestro talento
              humano en salud, colaboradores y proveedores de la ACHO.{" "}
              <Text
                style={styles.link}
                onPress={() =>
                  Linking.openURL(
                    "https://mauriciolema.webhost4life.com/ACHOCOL/page16/page11/page31/files/ACHOHistoria1.pdf"
                  )
                }
              >
                LEER AQUÍ
              </Text>{" "}
              Esbozo de la historia de la Hematología en Colombia.
            </Text>
          </Card.Content>
        </Card>

        {/* Contenedor de imágenes lado a lado */}
        <View style={styles.imageRow}>
          <Image
            source={{
              uri: "https://ik.imagekit.io/6cx9tc1kx/Imagenes%20App%20Prueba/WhatsApp%20Image%202024-10-09%20at%204.21.51%20PM.jpeg?updatedAt=1728508944197",
            }}
            style={styles.sideImage}
          />
          <Image
            source={{
              uri: "https://ik.imagekit.io/6cx9tc1kx/Imagenes%20App%20Prueba/DSC_3958.JPG?updatedAt=1728511216552",
            }}
            style={styles.sideImage}
          />
        </View>

        {/* Sección Propósito */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.subtitle}>
              Nuestro Propósito
            </Text>
            <Text variant="labelSmall" style={styles.centerText}>
              Junta directiva (2022 - 2026) Promover la calidad en la
              prevención, diagnóstico, rehabilitación y tratamiento del cáncer y
              enfermedades hematológicas en Colombia; además de la investigación
              en hematología y oncología. Estamos comprometidos con nuestros
              asociados en procurar un entorno adecuado para la excelencia del
              ejercicio profesional y el respeto de sus derechos.
            </Text>
          </Card.Content>
        </Card>

        {/* Junta directiva */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.subtitle}>
              Junta Directiva (2022 - 2026)
            </Text>
            <ThemedView style={styles.divider} />
            <View style={styles.presidentContainer}>
              <Image
                source={{
                  uri: "https://firebasestorage.googleapis.com/v0/b/global-auth-49737.appspot.com/o/PRESIDENTA.png?alt=media&token=74cbf7fb-a0c1-484c-b13c-be3b168168a3",
                }}
                style={styles.presidentImage}
              />
              <ThemedText style={styles.sectionTextBold}>PRESIDENTA</ThemedText>
              <ThemedText style={styles.sectionText}>
                Dra. Claudia Lucia Sossa Melo
              </ThemedText>
            </View>
            <View style={styles.presidentContainer}>
              <Image
                source={{
                  uri: "https://firebasestorage.googleapis.com/v0/b/global-auth-49737.appspot.com/o/FOTO_02.png?alt=media&token=b299adda-30c9-443e-a3c8-15b68a51bc35",
                }}
                style={styles.presidentImage}
              />
              <ThemedText style={styles.sectionTextBold}>
                VICEPRESIDENTE
              </ThemedText>
              <ThemedText style={styles.sectionText}>
                Dr. Dr. William Armando Mantilla Durán
              </ThemedText>
            </View>
            <View style={styles.presidentContainer}>
            <Image
                source={{
                  uri: "https://firebasestorage.googleapis.com/v0/b/global-auth-49737.appspot.com/o/FOTO_01.png?alt=media&token=78f93db9-f303-4913-9fc1-4fe8a41910af",
                }}
                style={styles.presidentImage}
              />
              <ThemedText style={styles.sectionTextBold}>SECRETARIO</ThemedText>
              <ThemedText style={styles.sectionText}>
                Dr. Jair Figueroa Emiliani
              </ThemedText>
            </View>
            <View style={styles.presidentContainer}>
              <Image
                source={{
                  uri: "https://firebasestorage.googleapis.com/v0/b/global-auth-49737.appspot.com/o/FOTO_03.png?alt=media&token=12f196b5-8ba7-4d31-a09c-ae7972d96617",
                }}
                style={styles.presidentImage}
              />
              <ThemedText style={styles.sectionTextBold}>TESORERO</ThemedText>
              <ThemedText style={styles.sectionText}>
                Dr. Kelman Hanael Ojeda Rodriguez
              </ThemedText>
            </View>
            <View style={styles.presidentContainer}>
              <ThemedText style={styles.sectionTextBold}>VOCALES</ThemedText>
              <ThemedText style={styles.sectionText}>
                Dr. Ricardo Elías Brugés Maya
              </ThemedText>
              <ThemedText style={styles.sectionText}>
                Dr. Jaime Alberto González Díaz
              </ThemedText>
              <ThemedText style={styles.sectionText}>
                Dra. Isabel Matilde Chinchia Arias
              </ThemedText>
              <ThemedText style={styles.sectionText}>
                Dr. Juan Alejandro Ospina Idárraga
              </ThemedText>
              <ThemedText style={styles.sectionText}>
                Dr. Diego Andrés Gómez Abreo
              </ThemedText>
            </View>
            <View style={styles.presidentContainer}>
              <ThemedText style={styles.sectionTextBold}>SUPLENTES</ThemedText>
              <ThemedText style={styles.sectionText}>
                Dr. Diego Mauricio González Ramírez
              </ThemedText>
              <ThemedText style={styles.sectionText}>
                Dr. Mario Ernesto Correa Correa
              </ThemedText>
              <ThemedText style={styles.sectionText}>
                Dra. Lina Maria Gaviria Jaramillo
              </ThemedText>
              <ThemedText style={styles.sectionText}>
                Dr. Kenny Mauricio Gálvez Cárdenas
              </ThemedText>
              <ThemedText style={styles.sectionText}>
                Dr. Álvaro Enrique Osorio Franco
              </ThemedText>
            </View>
          </Card.Content>
        </Card>
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centerText: {
    textAlign: "center",
    marginBottom: 5,
  },
  description: {
    marginTop: 10,
    marginBottom: 15,
    color: "#00AEEF",
  },
  card: {
    width: "100%",
    marginBottom: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 12,
    color: "#555",
    marginBottom: 8,
    textAlign: "center",
  },
  sectionTextBold: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginTop: 8,
    textAlign: "center",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    marginVertical: 8,
    width: "100%",
  },
  headerImage: {
    height: "100%",
    width: "100%",
    position: "absolute",
  },
  imageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    width: "100%",
  },
  sideImage: {
    width: "48%",
    height: 150,
    borderRadius: 10,
  },
  presidentContainer: {
    alignItems: "center",
  },
  presidentImage: {
    width: 80,
    height: 70,
    borderRadius: 25,
    marginBottom: 8,
  },
  link: {
    color: "blue",
    textDecorationLine: "underline",
  },
});

export default ACHOInfoScreen;

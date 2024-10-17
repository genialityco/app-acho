import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ContactSupportScreen() {
  // Funciones para abrir los enlaces
  const openWhatsApp = () => {
    const phoneNumber = '573001234567'; // Reemplaza con tu número de WhatsApp (código de país + número)
    const url = `whatsapp://send?phone=${phoneNumber}&text=Hola, necesito asistencia`;
    Linking.openURL(url).catch(() => {
      alert('Asegúrate de tener WhatsApp instalado.');
    });
  };

  const makePhoneCall = () => {
    const phoneNumber = 'tel:+573001234567'; // Reemplaza con tu número de teléfono
    Linking.openURL(phoneNumber);
  };

  const sendEmail = () => {
    const email = 'mailto:soporte@example.com'; // Reemplaza con tu correo electrónico de soporte
    Linking.openURL(email);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Contáctanos</Text>
      <Text style={styles.infoText}>Estamos aquí para ayudarte. Puedes contactarnos a través de las siguientes opciones:</Text>

      {/* Botón para WhatsApp */}
      <TouchableOpacity style={styles.contactButton} onPress={openWhatsApp}>
        <Ionicons name="logo-whatsapp" size={24} color="#fff" />
        <Text style={styles.buttonText}>Contactar por WhatsApp</Text>
      </TouchableOpacity>

      {/* Botón para llamada telefónica */}
      <TouchableOpacity style={styles.contactButton} onPress={makePhoneCall}>
        <Ionicons name="call-outline" size={24} color="#fff" />
        <Text style={styles.buttonText}>Llamar al Soporte</Text>
      </TouchableOpacity>

      {/* Botón para enviar correo */}
      <TouchableOpacity style={styles.contactButton} onPress={sendEmail}>
        <Ionicons name="mail-outline" size={24} color="#fff" />
        <Text style={styles.buttonText}>Enviar Correo Electrónico</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#7D7D7D',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    marginLeft: 10,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

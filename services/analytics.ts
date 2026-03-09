import analytics from '@react-native-firebase/analytics';
import { Platform } from 'react-native';

/**
 * Servicio centralizado para Analytics
 * - Mobile (Android/iOS): Usa @react-native-firebase/analytics (nativo)
 * - Web: Solo logs en consola (opcional: implementar firebase/analytics web)
 */
const Analytics = {
  // ==================== USUARIO ====================

  /**
   * Establece el ID del usuario para asociar eventos
   */
  setUserId: async (userId: string | null) => {
    try {
      if (Platform.OS === 'web') {
        console.log('[Analytics Web] User ID:', userId);
        return;
      }
      await analytics().setUserId(userId);
      console.log('[Analytics] User ID establecido:', userId);
    } catch (error) {
      console.error('[Analytics] Error setUserId:', error);
    }
  },

  /**
   * Establece propiedades del usuario
   */
  setUserProperties: async (properties: { [key: string]: string | null }) => {
    try {
      if (Platform.OS === 'web') {
        console.log('[Analytics Web] User properties:', properties);
        return;
      }
      await analytics().setUserProperties(properties);
      console.log('[Analytics] User properties establecidas:', properties);
    } catch (error) {
      console.error('[Analytics] Error setUserProperties:', error);
    }
  },

  // ==================== AUTENTICACIÓN ====================

  logSignUp: async (method: string = 'email') => {
    await Analytics.logEvent('sign_up', { method });
  },

  logLogin: async (method: string = 'email') => {
    await Analytics.logEvent('login', { method });
  },

  logLogout: async () => {
    await Analytics.logEvent('logout');
  },

  logPasswordReset: async () => {
    await Analytics.logEvent('password_reset');
  },

  // ==================== NAVEGACIÓN / PANTALLAS ====================

  /**
   * Registra visualización de pantalla
   */
  logScreenView: async (screenName: string, screenClass?: string) => {
    try {
      if (Platform.OS === 'web') {
        console.log(`[Analytics Web] screen_view: ${screenName}`);
        return;
      }

      await analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });
      
      console.log(`[Analytics] Screen view: ${screenName}`);
    } catch (error) {
      console.error('[Analytics] Error logScreenView:', error);
    }
  },

  logTabChange: async (tabName: string) => {
    await Analytics.logEvent('tab_change', { tab_name: tabName });
  },

  // ==================== EVENTOS PRINCIPALES ====================

  logViewEvent: async (eventId: string, eventName: string, eventType?: string) => {
    await Analytics.logEvent('view_event', {
      event_id: eventId,
      event_name: eventName,
      event_type: eventType || 'unknown',
    });
  },

  logViewSpeaker: async (speakerId: string, speakerName: string) => {
    await Analytics.logEvent('view_speaker', {
      speaker_id: speakerId,
      speaker_name: speakerName,
    });
  },

  logViewPoster: async (posterId: string, posterTitle: string) => {
    await Analytics.logEvent('view_poster', {
      poster_id: posterId,
      poster_title: posterTitle,
    });
  },

  logDownloadCertificate: async (certificateId: string, eventName: string) => {
    await Analytics.logEvent('download_certificate', {
      certificate_id: certificateId,
      event_name: eventName,
    });
  },

  logViewDocument: async (documentId: string, documentName: string) => {
    await Analytics.logEvent('view_document', {
      document_id: documentId,
      document_name: documentName,
    });
  },

  logViewProgram: async (eventId: string) => {
    await Analytics.logEvent('view_program', { event_id: eventId });
  },

  logViewMemorias: async (eventId?: string) => {
    await Analytics.logEvent('view_memorias', { event_id: eventId || 'all' });
  },

  // ==================== PERFIL Y OTROS ====================

  logEditProfile: async () => {
    await Analytics.logEvent('edit_profile');
  },

  logViewMyEvents: async () => {
    await Analytics.logEvent('view_my_events');
  },

  logViewMyCertificates: async () => {
    await Analytics.logEvent('view_my_certificates');
  },

  logViewSupport: async () => {
    await Analytics.logEvent('view_support');
  },

  // ==================== NOTIFICACIONES ====================

  logNotificationReceived: async (notificationId: string) => {
    await Analytics.logEvent('notification_received', { notification_id: notificationId });
  },

  logNotificationOpened: async (notificationId: string) => {
    await Analytics.logEvent('notification_opened', { notification_id: notificationId });
  },

  // ==================== MÉTODO GENÉRICO ====================

  /**
   * Registra cualquier evento personalizado
   */
  logEvent: async (eventName: string, params?: { [key: string]: any }) => {
    try {
      if (Platform.OS === 'web') {
        console.log(`[Analytics Web] ${eventName}`, params || {});
        return;
      }

      await analytics().logEvent(eventName, params);
      if (__DEV__) {
        console.log(`[Analytics] ${eventName}`, params || {});
      }
    } catch (error) {
      console.error(`[Analytics] Error logging ${eventName}:`, error);
    }
  },

  // ==================== CONTROL ====================

  setAnalyticsEnabled: async (enabled: boolean) => {
    try {
      if (Platform.OS !== 'web') {
        await analytics().setAnalyticsCollectionEnabled(enabled);
      }
      console.log('[Analytics] Colección habilitada:', enabled);
    } catch (error) {
      console.error('[Analytics] Error setAnalyticsEnabled:', error);
    }
  },
};

export default Analytics;

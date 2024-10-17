import React, { useState, useEffect } from "react";
import { View, StyleSheet, Dimensions, Alert, Text } from "react-native";
import { useTheme, Button, Card, Chip } from "react-native-paper";
import SurveyForm from "./SurveyForm";
import ResultsScreen from "./ResultsScreen";
import { db, ref, set, get } from "@/services/firebaseConfig";
import { Survey } from "@/services/api/surveyService";

const { width } = Dimensions.get("window");

interface CustomDrawerProps {
  onClose: () => void;
  surveyConfig: Survey[];
  userId: string;
}

const CustomDrawer: React.FC<CustomDrawerProps> = ({
  onClose,
  surveyConfig,
  userId,
}) => {
  const [answeredSurveys, setAnsweredSurveys] = useState<{
    [key: string]: boolean;
  }>({});
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null); // Encuesta seleccionada
  const theme = useTheme();

  useEffect(() => {
    // Verificar si el usuario ya respondió cada encuesta
    surveyConfig.forEach((survey) => {
      const surveyRef = ref(db, `survey-responses/${survey._id}/${userId}`);
      get(surveyRef).then((snapshot) => {
        if (snapshot.exists()) {
          setAnsweredSurveys((prev) => ({ ...prev, [survey._id]: true }));
        }
      });
    });
  }, [surveyConfig, userId]);

  const handleSurveyComplete = (
    surveyId: string,
    surveyData: Record<string, any>
  ) => {
    // Guarda la respuesta en Firebase
    const surveyRef = ref(db, `survey-responses/${surveyId}/${userId}`);
    set(surveyRef, {
      ...surveyData,
      completedAt: new Date().toISOString(),
    })
      .then(() => {
        setAnsweredSurveys((prev) => ({ ...prev, [surveyId]: true }));
        setSelectedSurvey(null); // Regresar a la lista después de completar la encuesta
      })
      .catch((error) => {
        console.error("Error al guardar los datos:", error);
      });
  };

  return (
    <View style={[styles.drawer, { backgroundColor: theme.colors.surface }]}>
      {selectedSurvey ? (
        // Mostrar el formulario o los resultados para la encuesta seleccionada
        <View style={styles.content}>
          {answeredSurveys[selectedSurvey._id] ? (
            selectedSurvey.questions.map((question) => (
              <ResultsScreen
                key={question._id}
                surveyId={selectedSurvey._id}
                question={question}
              />
            ))
          ) : (
            <SurveyForm
              surveyConfig={selectedSurvey}
              onComplete={(data) =>
                handleSurveyComplete(selectedSurvey._id, data)
              }
            />
          )}
        </View>
      ) : (
        // Lista de encuestas
        <View style={styles.content}>
          {surveyConfig.map((survey) => (
            <Card key={survey._id} style={styles.card}>
              <Card.Title title={survey.title} />

              <Card.Actions>
                {answeredSurveys[survey._id] ? (
                  <Chip mode="outlined" disabled style={styles.chip}>
                    Ya respondiste
                  </Chip>
                ) : survey.isOpen ? (
                  <Chip mode="outlined" style={styles.chip}>
                    Abierta
                  </Chip>
                ) : (
                  <Chip mode="outlined" style={styles.chip}>
                    Cerrada
                  </Chip>
                )}
                <Button
                  mode="text"
                  onPress={() => setSelectedSurvey(survey)}
                  disabled={!survey.isOpen && !answeredSurveys[survey._id]}
                >
                  {answeredSurveys[survey._id]
                    ? "Ver Resultados"
                    : "Responder Encuesta"}
                </Button>
              </Card.Actions>
            </Card>
          ))}
        </View>
      )}
      <Button mode="contained" onPress={onClose} style={styles.button}>
        Cerrar
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: width,
    elevation: 4,
    paddingVertical: 20,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  card: {
    marginVertical: 10,
    width: "100%",
  },
  chip: {
    marginRight: 10,
  },
  button: {
    marginTop: 20,
  },
});

export default CustomDrawer;

import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import {
  Button,
  RadioButton,
  Text,
  Divider,
  Checkbox,
  TextInput,
} from "react-native-paper";
import { Formik } from "formik";
import * as Yup from "yup";

interface SurveyConfig {
  title: string;
  questions: {
    _id: string;
    title: string;
    type: "radio" | "checkbox" | "text";
    options?: string[];
  }[];
}

interface SurveyFormProps {
  surveyConfig: SurveyConfig;
  onComplete: (values: { [key: string]: any }) => void;
}

const SurveyForm: React.FC<SurveyFormProps> = ({
  surveyConfig,
  onComplete,
}) => {
  // Generar el esquema de validación basado en la encuesta
  const validationSchema = Yup.object().shape(
    surveyConfig.questions.reduce(
      (acc: { [key: string]: Yup.StringSchema }, question) => {
        if (question.type !== "checkbox") {
          acc[question._id] = Yup.string().required("Este campo es obligatorio");
        }
        return acc;
      },
      {}
    )
  );

  // Inicializar valores de la encuesta
  const initialValues = surveyConfig.questions.reduce(
    (acc: { [key: string]: any }, question) => {
      acc[question._id] = question.type === "checkbox" ? [] : "";
      return acc;
    },
    {}
  );

  const handleSubmit = (values: { [key: string]: any }) => {
    console.log("Respuestas enviadas:", values);
    onComplete(values);
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ setFieldValue, values, errors, handleSubmit }) => (
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>{surveyConfig.title}</Text>
          <Divider style={styles.divider} />

          {surveyConfig.questions.map((question) => (
            <View key={question._id} style={styles.questionContainer}>
              <Text>{question.title}</Text>
              {question.type === "radio" && (
                <RadioButton.Group
                  onValueChange={(value) => setFieldValue(question._id, value)}
                  value={values[question._id]}
                >
                  {question.options?.map((option) => (
                    <RadioButton.Item
                      key={option}
                      label={option}
                      value={option}
                    />
                  ))}
                </RadioButton.Group>
              )}
              {question.type === "checkbox" &&
                question.options?.map((option) => (
                  <Checkbox.Item
                    key={option}
                    label={option}
                    status={
                      values[question._id].includes(option)
                        ? "checked"
                        : "unchecked"
                    }
                    onPress={() => {
                      const selected = values[question._id];
                      if (selected.includes(option)) {
                        setFieldValue(
                          question._id,
                          selected.filter((item: string) => item !== option)
                        );
                      } else {
                        setFieldValue(question._id, [...selected, option]);
                      }
                    }}
                  />
                ))}
              {question.type === "text" && (
                <TextInput
                  mode="outlined"
                  placeholder="Escribe tu respuesta"
                  value={values[question._id]}
                  onChangeText={(text) => setFieldValue(question._id, text)}
                />
              )}
              {/* {errors[question.id] && (
                <Text style={styles.error}>{errors[question.id]}</Text>
              )} */}
            </View>
          ))}

          <Button
            mode="contained"
            onPress={() => handleSubmit()}
            style={styles.button}
          >
            Enviar
          </Button>
        </ScrollView>
      )}
    </Formik>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: "bold",
  },
  divider: {
    marginVertical: 20,
  },
  questionContainer: {
    marginBottom: 20,
  },
  button: {
    marginTop: 20,
  },
  error: {
    color: "red",
    marginTop: 5,
  },
});

export default SurveyForm;

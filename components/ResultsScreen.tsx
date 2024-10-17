import React, { useEffect, useState } from "react";
import { View, Text, Dimensions, StyleSheet } from "react-native";
import { PieChart, BarChart } from "react-native-chart-kit";
import { db, ref, onValue } from "@/services/firebaseConfig";

const screenWidth = Dimensions.get("window").width;

interface ResultsScreenProps {
  surveyId: string;
  question: {
    _id: string;
    type: string;
    title: string;
    options?: string[];
  };
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({
  surveyId,
  question,
}) => {
  const [chartData, setChartData] = useState<
    {
      name: string;
      population: number;
      color: string;
      legendFontColor: string;
      legendFontSize: number;
    }[]
  >([]);

  useEffect(() => {
    const questionRef = ref(db, `survey-responses/${surveyId}`);
    const unsubscribe = onValue(questionRef, (snapshot) => {
      const data = snapshot.val();
      const results = data ? Object.values(data) : [];
      updateChartData(results);
    });

    return () => unsubscribe();
  }, [surveyId, question]);

  const updateChartData = (results: any[]) => {
    const counts: { [key: string]: number } = {};

    // Recorrer los resultados de cada usuario
    results.forEach((response) => {
      // Extraer la respuesta específica a la pregunta actual
      const answer = response[question._id];

      if (question.type === "radio" || question.type === "checkbox") {
        if (Array.isArray(answer)) {
          // En caso de checkbox (múltiples respuestas)
          answer.forEach((item: string) => {
            counts[item] = (counts[item] || 0) + 1;
          });
        } else if (typeof answer === "string") {
          // En caso de radio (una única respuesta)
          counts[answer] = (counts[answer] || 0) + 1;
        }
      } else if (question.type === "text" && answer) {
        // Contar respuestas de texto
        counts[answer] = (counts[answer] || 0) + 1;
      }
    });

    // Crear los datos para el gráfico
    if (question.type === "radio" || question.type === "checkbox") {
      setChartData(
        (question.options || []).map((option) => ({
          name: option,
          population: counts[option] || 0,
          color: generateRandomColor(),
          legendFontColor: "#7F7F7F",
          legendFontSize: 15,
        }))
      );
    } else if (question.type === "text") {
      setChartData(
        Object.keys(counts).map((answer) => ({
          name: answer,
          population: counts[answer],
          color: generateRandomColor(),
          legendFontColor: "#7F7F7F",
          legendFontSize: 15,
        }))
      );
    }
  };

  // Función para generar colores aleatorios para los gráficos
  const generateRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Resultados: {question.title}</Text>
      {question.type === "radio" || question.type === "checkbox" ? (
        <PieChart
          data={chartData}
          width={screenWidth}
          height={150}
          chartConfig={{
            backgroundColor: "#1cc910",
            backgroundGradientFrom: "#eff3ff",
            backgroundGradientTo: "#efefef",
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="population"
          backgroundColor="transparent"
          absolute
          paddingLeft="-30"
        />
      ) : (
        <BarChart
          data={{
            labels: chartData.map((item) => item.name),
            datasets: [{ data: chartData.map((item) => item.population) }],
          }}
          width={screenWidth}
          height={190}
          chartConfig={{
            backgroundColor: "#1cc910",
            backgroundGradientFrom: "#eff3ff",
            backgroundGradientTo: "#efefef",
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          verticalLabelRotation={0}
          yAxisLabel=""
          yAxisSuffix=""
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 15,
    marginBottom: 10,
  },
});

export default ResultsScreen;

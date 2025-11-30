import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  DragOverlayProvider,
  DropProvider,
  Draggable,
  Droppable,
} from "@/external-lib";
import { ExampleHeader } from "../ExampleHeader";

interface Card {
  id: string;
  title: string;
  color: string;
}

const initialCards: Card[] = [
  { id: "1", title: "Card 1", color: "#FF6B6B" },
  { id: "2", title: "Card 2", color: "#4ECDC4" },
  { id: "3", title: "Card 3", color: "#45B7D1" },
  { id: "4", title: "Card 4", color: "#FFA07A" },
  { id: "5", title: "Card 5", color: "#98D8C8" },
];

interface DragOverlayExampleProps {
  onBack: () => void;
}

export function DragOverlayExample({ onBack }: DragOverlayExampleProps) {
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [droppedCards, setDroppedCards] = useState<Card[]>([]);

  const handleDrop = (data: Card) => {
    setCards((prev) => prev.filter((card) => card.id !== data.id));
    setDroppedCards((prev) => [...prev, data]);
  };

  const handleReset = () => {
    setCards(initialCards);
    setDroppedCards([]);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <ExampleHeader
        title="Drag Overlay Example"
        onBack={onBack}
        description="Demonstrates the optional DragOverlay system for smooth drag-and-drop with root-level overlay rendering. The overlay appears above all content during drag operations."
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Drag Cards to Drop Zone</Text>
          <Text style={styles.sectionDescription}>
            Cards use the DragOverlay system for smooth dragging. The overlay
            renders at the root level using Modal, ensuring it appears above all
            content without z-index issues.
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          {cards.map((card) => (
            <Draggable key={card.id} data={card}>
              <View style={[styles.card, { backgroundColor: card.color }]}>
                <Text style={styles.cardText}>{card.title}</Text>
              </View>
            </Draggable>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Drop Zone</Text>
          <Droppable onDrop={handleDrop}>
            <View style={styles.dropZone}>
              {droppedCards.length === 0 ? (
                <Text style={styles.dropZoneText}>
                  Drop cards here to move them
                </Text>
              ) : (
                <View style={styles.droppedCardsContainer}>
                  {droppedCards.map((card) => (
                    <View
                      key={card.id}
                      style={[styles.droppedCard, { backgroundColor: card.color }]}
                    >
                      <Text style={styles.cardText}>{card.title}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </Droppable>
        </View>

        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <Text style={styles.infoText}>
            • DragOverlayProvider wraps the app to enable the overlay system
          </Text>
          <Text style={styles.infoText}>
            • Draggable components automatically use the overlay when available
          </Text>
          <Text style={styles.infoText}>
            • The overlay renders using Modal for root-level positioning
          </Text>
          <Text style={styles.infoText}>
            • Position updates happen on the UI thread for smooth performance
          </Text>
          <Text style={styles.infoText}>
            • Falls back to z-index approach if DragOverlayProvider is not used
          </Text>
        </View>
      </ScrollView>
    </GestureHandlerRootView>
  );
}

// Wrap the example with DragOverlayProvider
export function DragOverlayExampleWithProvider({
  onBack,
}: DragOverlayExampleProps) {
  return (
    <DragOverlayProvider
      renderDragOverlay={(data: Card) => {
        return (
          <View style={[styles.card, { backgroundColor: data.color }]}>
            <Text style={styles.cardText}>{data.title}</Text>
          </View>
        );
      }}
    >
      <DropProvider>
        <DragOverlayExample onBack={onBack} />
      </DropProvider>
    </DragOverlayProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    lineHeight: 20,
  },
  cardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  card: {
    width: 100,
    height: 120,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  dropZone: {
    minHeight: 200,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed",
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  dropZoneText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  droppedCardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    width: "100%",
  },
  droppedCard: {
    width: 80,
    height: 100,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  resetButton: {
    backgroundColor: "#4ECDC4",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  resetButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  infoSection: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    lineHeight: 20,
  },
});


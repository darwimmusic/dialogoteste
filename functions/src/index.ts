import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();
const rtdb = admin.database();

export const onLiveSessionEnd = functions.firestore
  .document("liveSessions/current")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    // Verifica se a aula terminou (isLive mudou de true para false)
    if (beforeData.isLive === true && afterData.isLive === false) {
      const channelName = beforeData.channelName;
      if (!channelName) {
        functions.logger.error("Channel name not found in session data.");
        return null;
      }

      functions.logger.log(`Live session ended for channel: ${channelName}. Archiving chat...`);

      try {
        // 1. Ler as mensagens do Realtime Database
        const chatRef = rtdb.ref(`liveChats/${channelName}`);
        const snapshot = await chatRef.once("value");
        const messages = snapshot.val();

        if (messages) {
          // 2. Salvar o histórico no Firestore
          const historyRef = db.collection("sessionHistory").doc(channelName);
          await historyRef.set({
            channelName: channelName,
            hostId: beforeData.hostId,
            hostName: beforeData.hostName,
            startedAt: beforeData.startedAt,
            endedAt: admin.firestore.FieldValue.serverTimestamp(),
            chat: messages,
          });
          functions.logger.log(`Successfully archived ${Object.keys(messages).length} messages.`);

          // 3. Limpar o chat do Realtime Database
          await chatRef.remove();
          functions.logger.log(`Cleared chat from Realtime Database for channel: ${channelName}.`);
        } else {
          functions.logger.log("No messages to archive for this session.");
        }

        return null;
      } catch (error) {
        functions.logger.error("Error archiving chat:", error);
        return null;
      }
    }

    return null;
  });

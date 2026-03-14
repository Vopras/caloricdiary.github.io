const WORKER_URL = "https://falling-sunset-3515.cristi-andreev2.workers.dev/"; // replace with your worker URL

app.component('chat', {
    props: {
        selectedDay: {
            type: String,
            required: true,
        }
    },
    data() {
        return {
            isOpen: false,
            messages: [],
            userInput: '',
            isLoading: false,
            pendingIngredients: null, // stores parsed ingredients waiting for confirmation
            selectedPhoto: null,
            selectedPhotoBase64: null,
            selectedPhotoMime: null,
        }
    },
    template: /*html*/`
    <div class="chat-widget">
        <!-- Toggle bubble -->
        <button class="chat-bubble" @click="isOpen = !isOpen">
            {{ isOpen ? '✕' : '🍽️' }}
        </button>

        <!-- Chat window -->
        <div class="chat-window" v-if="isOpen">
            <div class="chat-header">
                <span>Food Analyzer</span>
                <small>Upload a photo to estimate calories</small>
            </div>

            <!-- Messages -->
            <div class="chat-messages" ref="messageContainer">
                <div v-if="messages.length === 0" class="chat-empty">
                    Upload a food photo and I'll estimate the calories for you!
                </div>
                <div 
                    v-for="(msg, index) in messages" 
                    :key="index" 
                    :class="['chat-message', msg.role]"
                >
                    <img v-if="msg.image" :src="msg.image" class="chat-preview-img"/>
                    <span v-html="msg.text"></span>
                </div>
                <div v-if="isLoading" class="chat-message assistant">
                    <span class="typing">Analyzing...</span>
                </div>
            </div>

            <!-- Input area -->
            <div class="chat-input-area">
                <label class="photo-label" title="Upload photo">
                    📷
                    <input 
                        type="file" 
                        accept="image/*" 
                        style="display:none"
                        @change="handlePhotoSelect"
                        ref="photoInput"
                    >
                </label>
                <div class="chat-input-wrapper">
                    <div v-if="selectedPhoto" class="photo-preview-chip">
                        🖼️ Photo ready
                        <span @click="clearPhoto" style="cursor:pointer; margin-left:4px;">✕</span>
                    </div>
                    <input 
                        type="text"
                        v-model="userInput"
                        placeholder="Type a message..."
                        @keydown.enter="sendMessage"
                        :disabled="isLoading"
                    />
                </div>
                <button @click="sendMessage" :disabled="isLoading || (!userInput.trim() && !selectedPhoto)">
                    ➤
                </button>
            </div>
        </div>
    </div>
    `,
    methods: {
        async handlePhotoSelect(event) {
            const file = event.target.files[0];
            if (!file) return;

            this.selectedPhotoMime = file.type;
            this.selectedPhoto = URL.createObjectURL(file);

            // Convert to base64
            this.selectedPhotoBase64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result.split(",")[1]);
                reader.readAsDataURL(file);
            });

            event.target.value = "";
        },
        clearPhoto() {
            this.selectedPhoto = null;
            this.selectedPhotoBase64 = null;
            this.selectedPhotoMime = null;
        },
        async sendMessage() {
            const text = this.userInput.trim();
            if (!text && !this.selectedPhotoBase64) return;

            // Handle confirmation
            if (this.pendingIngredients && text) {
                const lower = text.toLowerCase();
                if (lower === 'yes' || lower === 'ok' || lower === 'save' || lower === 'yeah' || lower === 'y') {
                    await this.saveIngredients();
                    return;
                } else if (lower === 'no' || lower === 'cancel' || lower === 'nope') {
                    this.pendingIngredients = null;
                    this.addMessage('assistant', 'Okay, discarded! Upload another photo or describe what you ate.');
                    this.userInput = '';
                    return;
                }
            }

            this.addMessage('user', text || 'Analyze this food photo', this.selectedPhoto);
            this.userInput = '';
            this.isLoading = true;

            try {
                // ── Fetch staples from Firestore ──
                let referenceText = '';
                let portionsText = '';

                try {
                    const refDoc = await window.db.collection('reference').doc('referenced_foods').get();
                    if (refDoc.exists) {
                        const foods = refDoc.data();
                        referenceText = Object.entries(foods)
                            .map(([name, cal]) => `${name}: ${cal} cal/100g`)
                            .join(', ');
                    }
                } catch (e) { console.warn('Could not fetch reference foods', e); }

                try {
                    const portDoc = await window.db.collection('reference').doc('portions').get();
                    if (portDoc.exists && portDoc.data().list) {
                        portionsText = portDoc.data().list
                            .map(p => `${p.name} (${p.amount} ${p.unit} = ${p.weight}g, ${p.calories} cal/100g = ${Math.round(p.weight / 100 * p.calories)} cal total)`)
                            .join(', ');
                    }
                } catch (e) { console.warn('Could not fetch portions', e); }

                // ── Build system prompt with staples injected ──
                let systemPrompt = `You are a helpful nutrition assistant. When given a food photo, identify each food item and provide calorie estimates.`;

                if (referenceText) {
                    systemPrompt += `\n\nThe user has provided their own calorie reference data — ALWAYS use these values instead of guessing:\n${referenceText}`;
                }

                if (portionsText) {
                    systemPrompt += `\n\nThe user has also provided common portion sizes — use these to estimate weights accurately:\n${portionsText}`;
                }

                systemPrompt += `\n\nWhen you have an estimate ready, format it clearly and ask the user to confirm with yes/no.
                    If the user wants changes (e.g. "change chicken to 200g"), update accordingly and ask again.
                    When the user confirms, respond with ONLY a JSON block like this (nothing else after it):
                    CONFIRMED:
                    [{"ingredient": "chicken breast", "weight": 150, "calories": 165}]

                    Important: the "calories" field must always be calories per 100g, not total calories.`;

                // ── Build conversation history ──
                const historyText = this.messages.map(m =>
                    `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`
                ).join('\n');

                const promptText = systemPrompt
                    + (historyText ? '\n\nConversation so far:\n' + historyText : '')
                    + '\n\nUser\'s latest message: ' + (text || 'Please analyze the food in this photo.');

                const response = await fetch(WORKER_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        imageBase64: this.selectedPhotoBase64,
                        mimeType: this.selectedPhotoMime,
                        prompt: promptText
                    })
                });

                const data = await response.json();
                const replyText = data.candidates[0].content.parts[0].text;

                if (replyText.includes('CONFIRMED:')) {
                    const jsonPart = replyText.split('CONFIRMED:')[1].trim();
                    const cleaned = jsonPart.replace(/```json|```/g, '').trim();
                    this.pendingIngredients = JSON.parse(cleaned);
                    this.addMessage('assistant', '✅ Got it! Type <b>yes</b> to save this as a new meal, or tell me what to change.');
                } else {
                    this.addMessage('assistant', replyText.replace(/\n/g, '<br>'));
                }

                this.clearPhoto();

            } catch (error) {
                console.error('Chat error:', error);
                this.addMessage('assistant', 'Sorry, something went wrong: ' + error.message);
            } finally {
                this.isLoading = false;
                this.$nextTick(() => this.scrollToBottom());
            }
        },
        async saveIngredients() {
            if (!this.pendingIngredients) return;

            const mealName = `Photo meal ${new Date().toLocaleTimeString()}`;
            const collectionName = this.selectedDay.trim().replace(/\s+/g, '_');
            const mealDoc = mealName.trim().replace(/\s+/g, '_');

            try {
                await window.db.collection(collectionName).doc(mealDoc).set({
                    name: mealName,
                    groups: this.pendingIngredients.map(item => ({
                        ingredient: item.ingredient,
                        weight: String(item.weight),
                        calories: String(item.calories)
                    }))
                });

                this.addMessage('assistant', `✅ Saved as "<b>${mealName}</b>"! Refresh the meal list to see it.`);
                this.pendingIngredients = null;
                this.$emit('meal-saved'); // so parent can reload meals

            } catch (error) {
                console.error("Save error:", error);
                this.addMessage('assistant', 'Failed to save. Please try again.');
            }

            this.userInput = '';
        },
        addMessage(role, text, image = null) {
            this.messages.push({ role, text, image });
            this.$nextTick(() => this.scrollToBottom());
        },
        scrollToBottom() {
            const el = this.$refs.messageContainer;
            if (el) el.scrollTop = el.scrollHeight;
        }
    }
});
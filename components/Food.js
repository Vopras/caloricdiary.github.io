app.component('food', {
    emits: ['updateMeals'],
    props: {
        selectedDay: {
            type: String,
            required: true,
        }
    },
    data() {
        return {
            meals: [
                { name: '', groups: [{ ingredient: '', weight: '', calories: '' }] }
            ],
            preConfiguredMeals: [],
            analyzingPhoto: false, // loading state
        }
    },
    watch: {
        selectedDay: {
            immediate: true,
            handler(newVal, oldVal) {
                if (newVal !== oldVal || newVal) {
                    this.loadMeals();
                }
            }
        }
    },
    template:
    /*html*/
    `
    <div v-for="(meal, index) in meals" :key="index" class="meal-entry">
        <div class="meal-header">
            <input type="text" v-model="meal.name" placeholder="Meal Name" class="meal-name">
            <div class="meal-actions">
                <button class="btn-save" @click="saveMeal(meal, index)">Save</button>
                <button class="btn-delete" @click="deleteMeal(meal.name)">Delete</button>
                <input 
                    type="file" 
                    accept="image/*" 
                    :ref="'photoInput' + index"
                    style="display:none"
                    @change="handlePhotoUpload($event, index)"
                >
            </div>
        </div>
        <div class="fields-container">
            <div v-for="(group, gIndex) in meal.groups" :key="gIndex" class="input-group">
                <input class="foodIngredients" type="text" v-model="group.ingredient" placeholder="ingredient">
                <input class="foodIngredients" type="text" v-model="group.weight" placeholder="weight">
                <input class="foodIngredients" type="text" v-model="group.calories" placeholder="calories">
                <button class="removeIngredient" @click="deleteIngredient(index, gIndex)">Delete</button>
            </div>
        </div>
        <button @click="addGroup(index)">Add More Fields</button>
    </div>
    <button @click="addMeal">Add Meal</button>
    <button @click="loadPreConfiguredMeals">Add Meal(preconfigured)</button>
    <div v-if="preConfiguredMeals.length > 0" class="preconfiguredmeals">
        <button v-for="meal in preConfiguredMeals" @click="addPreConfiguredMeal(meal)">
            {{ meal.name }}
        </button>
    </div>
    `,
    methods: {
        async handlePhotoUpload(event, mealIndex) {
            const file = event.target.files[0];
            if (!file) return;

            this.analyzingPhoto = true;

            try {
                // Convert to base64
                const base64 = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result.split(",")[1]);
                    reader.readAsDataURL(file);
                });

                // Call Cloudflare Worker
                const response = await fetch(WORKER_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        imageBase64: base64,
                        mimeType: file.type
                    })
                });

                const data = await response.json();
                const rawText = data.candidates[0].content.parts[0].text;

                // Parse JSON from Gemini response
                const cleaned = rawText.replace(/```json|```/g, "").trim();
                const ingredients = JSON.parse(cleaned);

                // Replace meal groups with AI results
                this.meals[mealIndex].groups = ingredients.map(item => ({
                    ingredient: item.ingredient,
                    weight: String(item.weight),
                    calories: String(item.calories)
                }));

                // Auto-save
                this.saveMeal(this.meals[mealIndex], mealIndex);

            } catch (error) {
                console.error("Error analyzing photo:", error);
                alert("Failed to analyze photo. Please try again.");
            } finally {
                this.analyzingPhoto = false;
                // Reset file input
                event.target.value = "";
            }
        },

        // ... all your existing methods stay exactly the same
        addPreConfiguredMeal(meal) {
            this.meals.push(meal);
            this.$emit('updateMeals', this.meals);
        },
        async loadPreConfiguredMeals() {
            if (this.preConfiguredMeals.length > 0) {
                this.preConfiguredMeals = []
                return;
            }
            const collectionName = "preConfiguredMeals"
            var info;
            try {
                var data2 = await window.db.collection(collectionName).get();
                info = data2.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                this.preConfiguredMeals = info;
            } catch (error) {
                console.error("Error ", error);
                alert("Failed to get preconfigured meals.");
            }
        },
        deleteIngredient(mealIndex, groupIndex) {
            if (this.meals[mealIndex] && this.meals[mealIndex].groups) {
                this.meals[mealIndex].groups.splice(groupIndex, 1);
                this.saveMeal(this.meals[mealIndex], mealIndex);
            }
        },
        addGroup(mealIndex) {
            this.meals[mealIndex].groups.push({ ingredient: '', weight: '', calories: '' });
        },
        addMeal() {
            this.meals.push({ name: '', groups: [{ ingredient: '', weight: '', calories: '' }] });
        },
        async saveMeal(meal, mealIndex) {
            if (!meal.name.trim()) {
                alert("Meal name is required.");
                return;
            }
            const collectionName = this.selectedDay.trim().replace(/\s+/g, '_');
            const mealName = meal.name.trim().replace(/\s+/g, '_');
            try {
                await window.db.collection(collectionName).doc(mealName).set({
                    name: meal.name,
                    groups: meal.groups
                }, { merge: true });
            } catch (error) {
                console.error("Error saving or updating meal: ", error);
                alert("Failed to save or update meal.");
            }
        },
        async loadMeals() {
            const collectionName = this.selectedDay.trim().replace(/\s+/g, '_');
            try {
                const querySnapshot = await window.db.collection(collectionName).get();
                this.meals = querySnapshot.docs.map(doc => ({
                    name: doc.data().name || 'Unnamed Meal',
                    groups: doc.data().groups || []
                }));
                this.$emit('updateMeals', this.meals);
            } catch (error) {
                console.error("Error loading meals: ", error);
                this.meals = [];
            }
        },
        async deleteMeal(mealName) {
            const mealNameSanitized = mealName.trim().replace(/\s+/g, '_');
            try {
                await db.collection(this.selectedDay).doc(mealNameSanitized).delete();
                this.loadMeals();
            } catch (error) {
                console.error("Error deleting meal: ", error);
                alert("Failed to delete meal.");
            }
        }
    },
    mounted() {
        this.loadMeals();
    }
});
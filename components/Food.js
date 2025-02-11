app.component('food', {
    emits: ['updateMeals'], // Declare the custom event
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
        }
    },
    watch: {
        selectedDay: {
            immediate: true, // Also load meals on initial render
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
        <input type="text" v-model="meal.name" placeholder="Meal Name" class="meal-name">
        <button @click="saveMeal(meal, index)">Save Meal</button>
        <button @click="deleteMeal(meal.name)">Delete Meal</button>
        <div class="fields-container">
            <div v-for="(group, gIndex) in meal.groups" :key="gIndex" class="input-group">
                <input class="foodIngredients" type="text" v-model="group.ingredient" placeholder="ingredient">
                <input class="foodIngredients" type="text" v-model="group.weight" placeholder="weight">
                <input class="foodIngredients" type="text" v-model="group.calories" placeholder="calories">
                <button class="removeIngredient" @click="deleteIngredient(index, gIndex)"> Delete </button>
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
        addPreConfiguredMeal(meal) {
            this.meals.push(meal);
            this.$emit('updateMeals', this.meals); // Emit the updated meals
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
                console.log(info);
            } catch (error) {
                console.error("Error ", error);
                alert("Failed to get preconfigured meals.");
            }
        },
        deleteIngredient(mealIndex, groupIndex) {
            if (this.meals[mealIndex] && this.meals[mealIndex].groups) {
                this.meals[mealIndex].groups.splice(groupIndex, 1);
                this.saveMeal(this.meals[mealIndex], mealIndex);
                console.log(`Ingredient removed from meal ${mealIndex}`);
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
                console.log(`Meal ${meal.name} saved or updated successfully in collection '${collectionName}'.`);
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
                this.$emit('updateMeals', this.meals); // Emit the updated meals
                console.log(`Meals for ${this.selectedDay} loaded successfully.`);
            } catch (error) {
                console.error("Error loading meals: ", error);
                this.meals = [];
            }
        },
        async loadMealsForDay(selectedDay) {
            try {
                const querySnapshot = await db.collection(selectedDay).get();
                this.meals = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                console.log(`Meals for ${selectedDay} loaded successfully.`);
            } catch (error) {
                console.error("Error loading meals: ", error);
                this.meals = [];
            }
        },   
        async deleteMeal(mealName) {
            const mealNameSanitized = mealName.trim().replace(/\s+/g, '_');
            try {
                await db.collection(this.selectedDay).doc(mealNameSanitized).delete();
                console.log(`Meal ${mealName} deleted successfully.`);
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

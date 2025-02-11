app.component('reference', {
    template:
    /*html*/
    `
    <div class="reference_foods">
        <div class="current_reference_foods">
            <!-- Conditionally show the list if there are foods -->
            <ul v-if="Object.keys(foods).length > 0">
                <li v-for="(calories, food) in foods" :key="food">
                    {{ food }}: {{ calories }} calories per 100 grams
                    <button @click="deleteFood(food)">Delete</button>
                </li>
            </ul>
            <!-- Show a message if there are no foods -->
            <p v-else>No foods to display.</p>
        </div>
        
        <!-- Form for adding new food data -->
        <input v-model="newFood.name" placeholder="Food Name">
        <input v-model="newFood.calories" placeholder="Calories per 100g" type="number">
        <button @click="addFoodData" class="referenceButton">Add Food Data</button>
    </div>

    `,
    data() {
        return {
            foods: {}, // Holds the fetched food data
            newFood: { name: '', calories: null }, // For adding new food data
        }
    },
    computed: {
        referencedFoods() {
            // Format the raw data for display
            const formattedData = {};
            Object.keys(this.rawFoodData).forEach(food => {
              // Assuming the structure is like { foodName: calories }
              formattedData[food] = this.rawFoodData[food];
            });
            return formattedData;
        },
        foodCalories() {
            return this.foods;
        }
    },
    mounted() {
        this.fetchFoodData(); // Ensure this matches the actual method name
    },
    methods: {
        fetchFoodData() {
            const docRef = window.db.collection('reference').doc('referenced_foods'); // Adjust based on your Firestore instance reference
            docRef.get().then(doc => {
              if (doc.exists) {
                this.foods = doc.data();
              } else {
                console.log("No such document!");
              }
            }).catch(error => {
              console.log("Error getting document:", error);
            });
        },
        addFoodData() {
            const docRef = window.db.collection('reference').doc('referenced_foods'); // Adjust based on your Firestore instance reference
            docRef.set({
              [this.newFood.name]: this.newFood.calories
            }, { merge: true }).then(() => {
              console.log("Document successfully updated!");
              this.fetchFoodData(); // Refresh the displayed data
              this.newFood = { name: '', calories: null }; // Reset form
            }).catch(error => {
              console.error("Error updating document: ", error);
            });
        },
        async deleteFood(foodName) {
            const docRef = db.collection('reference').doc('referenced_foods');
            try {
                const doc = await docRef.get();
                if (doc.exists) {
                    let foodData = doc.data();
                    if (foodData.hasOwnProperty(foodName)) {
                        delete foodData[foodName]; // Remove the food item
                        await docRef.set(foodData); // Update the document with the modified data
                        console.log(`${foodName} deleted successfully.`);
                        this.fetchFoodData(); // Refresh the displayed data
                    }
                }
            } catch (error) {
                console.error("Error deleting food: ", error);
            }
        }
    },

})
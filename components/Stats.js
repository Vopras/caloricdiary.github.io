app.component('stats', {
    data() {
        return {
        //     meals: [
        //         { name: '', groups: [{ ingredient: '', weight: '', calories: '' }] }
        //       ]
        }
    },
    props: {
        selectedDay: {
            type: String,
            required: true,
        },
        meals: {
            type: Array,
            required: true,
        }
    },
    // watch: {
    //     selectedDay: {
    //         immediate: true, // Also load meals on initial render
    //         handler(newVal, oldVal) {
    //             if (newVal !== oldVal || newVal) {
    //                 this.getSelectedDayMeals();
    //             }
    //         }
    //     }
    // },
    template:
    /*html*/
    `
    <div class="stats"> 
        <div>
            <p> meals for {{selectedDay}} </p>
            <p> {{mealNames}} </p>
            <div v-for="(meal, index) in calories" :key="index" class="meals">
                <div id="mealAndCalories"> {{mealNames[index] + " " +  calories[index]}} </div>
            </div>
            <p> {{totalCalories}} </p>
        </div>
        <reference> </reference>
    </div>
    `,
    methods: {
        async getSelectedDayMeals() {
            const collectionName = this.selectedDay.trim().replace(/\s+/g, '_');
    
            try {
                const querySnapshot = await window.db.collection(collectionName).get();
                this.meals = querySnapshot.docs.map(doc => ({
                    name: doc.data().name || 'Unnamed Meal',
                    groups: doc.data().groups || []
                }));
                console.log(`Meals for ${this.selectedDay} loaded successfully.`);
            } catch (error) {
                console.error("Error loading meals: ", error);
                this.meals = []; // Reset or handle errors appropriately
            }
        }
    },
    mounted() {
        // this.getSelectedDayMeals();
    },
    computed: {
        // mealNames() {
        //     const names = []; // Declare as a local constant
        //     for (const meal of this.meals) { // Use 'for...of' for array iteration
        //         names.push(meal.name);
        //     }
        //     return names;
        // },
        // calories() {
        //     const calories = [];
        //     for (const meal of this.meals) {
        //         var mealCalories = 0;
        //         for (ingredients of meal.groups) {
        //             mealCalories += Math.round(ingredients.weight / 100 * ingredients.calories);
        //         }
        //         calories.push(mealCalories);
        //     }
        //     return calories;
        // },
        // totalCalories() {
        //     var total = 0;
        //     for (const calorie of this.calories) {
        //         total += calorie;
        //     }
        //     return total;
        // }
        mealNames() {
            return this.meals.map(meal => meal.name);
        },
        calories() {
            return this.meals.map(meal => {
                return meal.groups.reduce((total, group) => {
                    return total + Math.round(group.weight / 100 * group.calories);
                }, 0);
            });
        },
        totalCalories() {
            return this.calories.reduce((total, calories) => total + calories, 0);
        }
    }


})
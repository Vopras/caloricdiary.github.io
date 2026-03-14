app.component('stats', {
    data() {
        return {}
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
    template:
    /*html*/
    `
    <div class="stats"> 
        <div>
            <p> meals for {{selectedDay}} </p>
            <div v-for="(meal, index) in calories" :key="index" class="meals">
                <div id="mealAndCalories"> {{mealNames[index] + " " +  calories[index]}} </div>
            </div>
            <p> {{totalCalories}} </p>
        </div>
      
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
            } catch (error) {
                console.error("Error loading meals: ", error);
                this.meals = [];
            }
        }
    },
    mounted() {},
    computed: {
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
});
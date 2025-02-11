var db = window.db;
app.component('day', {
    data() {
        return {
            collectionNames: [], // Define collectionNames here
            totalCaloriesByDay: {}
        };
    },
    template:
    /*html*/
    `
    <div class='day'> 
        <ul> 
             <li v-for="name in collectionNames" :key="name"> 
                <button @click="handleButtonClick(name)">
                    {{ name }} 
                    <span :style="getCaloriesColor(totalCaloriesByDay[name])">
                        {{ totalCaloriesByDay[name] || 'Loading...' }}
                    </span>
                </button>
             </li> 
        </ul> 
    </div>
    `,
    methods: {
        async fetchCollectionNames() {
            try {
                const querySnapshot = await db.collection('collectionTracker').get();
                const collections = [];
                querySnapshot.forEach(doc => {
                    collections.push(doc.id);
                });
                
                const sortedCollections = collections.map(date => {
                    const parts = date.split('-');
                    return `${parts[2]}-${parts[1]}-${parts[0]}`;
                }).sort()
                .map(sortedDate => {
                    const parts = sortedDate.split('-');
                    return `${parts[2]}-${parts[1]}-${parts[0]}`;
                });
        
                this.collectionNames = sortedCollections.reverse(); 

                // Calculate total calories for each collection
                await this.calculateTotalCaloriesForAllDays();
            } catch (error) {
                console.error("Error fetching collection names: ", error);
            }
        },
        async calculateTotalCaloriesForAllDays() {
            const promises = this.collectionNames.map(name => this.calculateTotalCalories(name));
            await Promise.all(promises);
        },
        async calculateTotalCalories(collectionName) {
            try {
                const querySnapshot = await db.collection(collectionName).get();
                let totalCalories = 0;

                querySnapshot.forEach(doc => {
                    const meal = doc.data();
                    if (meal.groups) {
                        meal.groups.forEach(group => {
                            const weight = parseFloat(group.weight) || 0;
                            const calories = parseFloat(group.calories) || 0;
                            totalCalories += (weight / 100) * calories;
                        });
                    }
                });

                // Directly update the totalCaloriesByDay object
                this.totalCaloriesByDay = {
                    ...this.totalCaloriesByDay,
                    [collectionName]: Math.round(totalCalories)
                };
            } catch (error) {
                console.error(`Error calculating total calories for ${collectionName}: `, error);
            }
        },
        handleButtonClick(name) {
            this.$emit('collection-selected', name);
        },
        getCaloriesColor(calories) {
            if (calories >= 3000) {
                return { color: 'red' };
            } else if (calories <= 1000) {
                return { color: 'green' };
            } else {
                const red = Math.min(255, Math.max(0, ((calories - 1000) / 2000) * 255));
                const green = Math.min(255, Math.max(0, ((3000 - calories) / 2000) * 255));
                return { color: `rgb(${red},${green},0)` };
            }
        }
    },
    created() {
        this.fetchCollectionNames();
    }
});

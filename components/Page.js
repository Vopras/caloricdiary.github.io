app.component('page', {
    data() {
        return {
            today: [
                ('0' +  new Date().getDate()).slice(-2), // Add leading zero if needed and get the day
                ('0' + ( new Date().getMonth() + 1)).slice(-2), // Months are 0-based; add leading zero if needed
                new Date().getFullYear()
            ].join('-'), // Join to form dd-mm-yyyy
            meals: [] // Add this property to store the meals
        }   
    },
    template:
    /*html*/
    `
    <div class="container">
        <div class="first">
            <!-- Content for the first div -->
            <day @collection-selected="handleCollectionSelected"></day>
        </div>
        <div class="second">
            <!-- Content for the second div -->
            <food :selectedDay="today" @update-meals="handleUpdateMeals"></food>
        </div>
        <div class="third">
            <!-- Content for the third div -->
            <stats :meals="meals" :selectedDay="today"></stats>
        </div>
    </div>
    `,
    methods: {
        handleCollectionSelected(name) {
            this.today = name;
        },
        async checkIfDayExistsAndAdd() {
            const today2 = new Date();
            const today = [
                ('0' + today2.getDate()).slice(-2), // Add leading zero if needed and get the day
                ('0' + (today2.getMonth() + 1)).slice(-2), // Months are 0-based; add leading zero if needed
                today2.getFullYear()
            ].join('-'); // Join to form dd-mm-yyyy
            const dailyCollectionRef = window.db.collection(today); // Reference to the daily collection
            const todayDocRef = window.db.collection("collectionTracker").doc(today); // Reference to a doc in collectionTracker with today's date as ID
        
            try {
                const snapshot = await dailyCollectionRef.limit(1).get();
                if (snapshot.empty) {
                    await dailyCollectionRef.doc("snacks").set({
                        name: 'snacks',
                        groups: [{
                            ingredient: '',
                            weight: '',
                            calories: ''
                        }]
                    });
                    console.log(`Collection for ${today} created with specific document "inca_nimic".`);
                    await todayDocRef.set({
                        created: firebase.firestore.FieldValue.serverTimestamp(),
                        message: `Tracking document for the collection created on ${today}`
                    });
                    console.log(`Tracking document for ${today} added to collectionTracker.`);
                } else {
                    console.log(`Collection for ${today} already exists.`);
                }
            } catch (error) {
                console.error("Error checking or creating collection and tracking document: ", error);
            }
        },
        handleUpdateMeals(newMeals) {
            this.meals = newMeals;
        }
    },
    created() {
    },
    mounted() {
        this.checkIfDayExistsAndAdd();
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // Function to handle form submission
    async function handleSubmitForm(formId, endpoint, method = 'POST') {
        document.getElementById(formId).addEventListener('submit', async function(event) {
            event.preventDefault();
            const formData = new FormData(this);
            const requestData = Object.fromEntries(formData.entries());

            try {
                const url = method === 'GET' ? `${endpoint}/${requestData.summaryEventId}` : endpoint;
                const options = {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: method === 'POST' ? JSON.stringify(requestData) : null
                };

                const response = await fetch(url, options);
                const responseData = await response.json();
                alert(responseData.message);
                
                // Display ratings if available
                if (responseData.ratings) {
                    const ratingsDisplay = document.getElementById('ratingsDisplay');
                    // Round ratings to whole numbers
                    const avgRegistrationExperience = Math.round(responseData.ratings.avg_registration_experience);
                    const avgEventExperience = Math.round(responseData.ratings.avg_event_experience);
                    const avgBreakfastExperience = Math.round(responseData.ratings.avg_breakfast_experience);
                    const avgOverallRating = Math.round(responseData.ratings.avg_overall_rating);
                    
                    ratingsDisplay.innerHTML = `<h3>Ratings for Event ID: ${requestData.summaryEventId}</h3>
                                                <p>Registration Experience: ${avgRegistrationExperience}</p>
                                                <p>Event Experience: ${avgEventExperience}</p>
                                                <p>Breakfast Experience: ${avgBreakfastExperience}</p>
                                                <p>Overall Rating: ${avgOverallRating}</p>`;
                }

                // Display summary if available
                if (responseData.summary) {
                    const summaryDisplay = document.getElementById('summaryDisplay');
                    summaryDisplay.innerHTML = `<h3>Summary for Event ID: ${requestData.summaryEventId}</h3>
                                                <p>${responseData.summary}</p>`;
                }
                
                this.reset();
            } catch (error) {
                alert('An error occurred.');
                console.error(error);
            }
        });
    }

    // Function to generate summary
    async function generateSummary() {
        const eventId = document.getElementById('summaryEventId').value;
        try {
            const response = await fetch(`/generate_summary/${eventId}`);
            const responseData = await response.json();
            if (response.ok) {
                document.getElementById('summaryDisplay').innerHTML = `<h3>Summary for Event ID: ${eventId}</h3><p>${responseData.summary}</p>`;
            } else {
                alert(responseData.error || 'Failed to generate summary');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred while generating summary');
        }
    }

    // Function to retrieve ratings
    async function retrieveRatings() {
        const eventId = document.getElementById('ratingsEventId').value;
        try {
            const response = await fetch(`/retrieve_ratings/${eventId}`);
            const responseData = await response.json();
            if (response.ok) {
                const ratingsDisplay = document.getElementById('ratingsDisplay');
                ratingsDisplay.innerHTML = `<h3>Ratings for Event ID: ${eventId}</h3>
                                            <p>Registration Experience: ${responseData.ratings.avg_registration_experience}</p>
                                            <p>Event Experience: ${responseData.ratings.avg_event_experience}</p>
                                            <p>Breakfast Experience: ${responseData.ratings.avg_breakfast_experience}</p>
                                            <p>Overall Rating: ${responseData.ratings.avg_overall_rating}</p>`;
            } else {
                alert(responseData.error || 'Failed to retrieve ratings');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred while retrieving ratings');
        }
    }

    // Call function for each form
    handleSubmitForm('submitReviewForm', '/submit_review');
    handleSubmitForm('likeReviewForm', '/like_review');
    handleSubmitForm('reportReviewForm', '/report_review');
    handleSubmitForm('respondToReviewForm', '/respond_to_review');
    handleSubmitForm('paginationForm', '/reviews');
});
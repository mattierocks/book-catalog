var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var GenreSchema = Schema({
    name: { type: String, required: true, min: 3, max: 100 },
});

// Virtual for genre's URL
GenreSchema
    .virtual('url')
    .get(function() {
        return '/catalog/genre/' + this._id;
    });

// Virtual for genre detail
GenreSchema
    .virtual('url')
    .get(function() {
        return '/catalog/genre_books/' + this._id;
    });

// Export model
module.exports = mongoose.model('Genre', GenreSchema);
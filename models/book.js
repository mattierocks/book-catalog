var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var BookSchema = Schema({
    title: { type: String, require: true },
    author: { type: Schema.ObjectId, ref: 'Author', required: true },
    summary: { type: String, required: true },
    isbn: { type: String, required: true },
    genre: [{ type: Schema.ObjectId, ref: 'Genre' }]
});

// Virtual for book's URL
BookSchema
    .virtual('url')
    .get(function() {
        return '/catalog/book/' + this._id;
    });

// Virtual for book detail
BookSchema
    .virtual('url')
    .get(function() {
        return '/catalog/book_detail/' + this._id;
    });

// Export model
module.exports = mongoose.model('Book', BookSchema);
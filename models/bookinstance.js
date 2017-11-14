var moment = require('moment');
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var BookInstanceSchema = new Schema({
    book: { type: Schema.ObjectId, ref: 'Book', required: true }, // reference the associated book
    imprint: { type: String, required: true },
    status: { type: String, required: true, enum: ['Available', 'Maintenance', 'Loaned', 'Reserved'], default: 'Maintenance' },
    due_back: { type: Date, default: Date.now },
});

// Virtual for bookinstance' URL
BookInstanceSchema
    .virtual('url')
    .get(function() {
        return '/catalog/bookinstance/' + this._id;
    });

// Virtual for bookinstance due date
BookInstanceSchema
    .virtual('due_back_formatted')
    .get(function() {
        return moment(this.due_back).format('MMMM Do, YYYY');
    });

// Export model
module.exports = mongoose.model('BookInstance', BookInstanceSchema);
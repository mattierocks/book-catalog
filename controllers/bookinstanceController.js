var Book = require('../models/book');
var BookInstance = require('../models/bookinstance');

var async = require('async');

// Display list of all BookInstances
exports.bookinstance_list = function(req, res, next) {

    BookInstance.find()
        .populate('book')
        .exec(function(err, list_bookinstances) {
            if (err) { return next(err); }
            // Successful, so render
            res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances });
        });
};

// Display detail page for a specific BookInstance
exports.bookinstance_detail = function(req, res, next) {

    BookInstance.findById(req.params.id)
        .populate('book')
        .exec(function(err, bookinstance) {
            if (err) { return next(err); }
            //successful, so render
            res.render('bookinstance_detail', { title: 'Book:', bookinstance: bookinstance });
        });
};

// Display BookInstance create form on GET
exports.bookinstance_create_get = function(req, res, next) {

    Book.find({}, 'title')
        .exec(function(err, books) {
            if (err) { return next(err); }
            // Successful, so render
            res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books });
        });
};

//Handle BookInstance create on POST
exports.bookinstance_create_post = function(req, res, next) {

    req.checkBody('book', 'Book must be specified').notEmpty();
    req.checkBody('imprint', 'Imprint must be specified').notEmpty();
    req.checkBody('due_back', 'Invalid date').optional({ checkFalsy: true }).isDate();

    req.sanitize('book').escape();
    req.sanitize('imprint').escape();
    req.sanitize('status').escape();
    req.sanitize('book').trim();
    req.sanitize('imprint').trim();
    req.sanitize('status').trim();
    req.sanitize('due_back').toDate();

    var bookinstance = new BookInstance({
        book: req.body.book,
        imprint: req.body.imprint,
        status: req.body.status,
        due_back: req.body.due_back
    });

    var errors = req.validationErrors();
    if (errors) {

        Book.find({}, 'title')
            .exec(function(err, books) {
                if (err) { return next(err); }
                // Successful, so render
                res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id, errors: errors, bookinstance: bookinstance });
            });
        return;
    } else {
        // Data from form is valid

        bookinstance.save(function(err) {
            if (err) { return next(err); }
            // successful - redirect to new book-instance record
            res.redirect(bookinstance.url);
        });
    }
};

// Display BookInstance delete form on GET
exports.bookinstance_delete_get = function(req, res, next) {

    async.parallel({
        bookinstance: function(callback) {
            BookInstance.findById(req.params.id).exec(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        // Successful, so render
        res.render('bookinstance_delete', { title: 'Delete Book Instance', bookinstance: results.bookinstance });

    });
};

// Handle BookInstance delete on POST
exports.bookinstance_delete_post = function(req, res, next) {

    req.checkBody('bookinstanceid', 'Book Instance id must exist').notEmpty();

    async.parallel({
        bookinstance: function(callback) {
            BookInstance.findById(req.body.authorid).exec(callback);
        },
        bookinstance_books: function(callback) {
            Book.find({ 'bookinstance': req.params.id }).exec(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        // Success
        if (results.bookinstance_books.length > 0) {
            // Genre has books. Render in same way as for GET route
            res.render('bookinstance_delete', { title: 'Delete Book Instance', genre: results.genre, genre_books: results.genres_books });
            return;
        } else {
            // Genre has no books. Delete object and redirect to the list of authors.
            BookInstance.findByIdAndRemove(req.body.bookinstanceid, function deleteBookInstance(err) {
                if (err) { return next(err); }
                // Success - go to book instance list
                res.redirect('/catalog/bookinstance');
            });
        }
    });
};

// Display BookInstance update form on GET
exports.bookinstance_update_get = function(req, res, next) {

    req.sanitize('id').escape();
    req.sanitize('id').trim();

    // Get book and genres for form
    async.parallel({
        bookinstance: function(callback) {
            Book.findById(req.params.id).populate('author').populate('genre').exec(callback);
        },
        genres: function(callback) {
            Genre.find(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }

        // Mark our selected genres as checked
        for (var all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
            for (var book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter++) {
                if (results.genres[all_g_iter]._id.toString() == results.book.genre[book_g_iter]._id.toString()) {
                    results.genres[all_g_iter].checked = 'true';
                }
            }
        }
        res.render('bookinstance_form', { title: 'Update Book Instance', authors: results.authors, genres: results.genres, book: results.book });
    });
};

// Handle BookInstance update on POST
exports.bookinstance_update_post = function(req, res, next) {

    // Sanitize ID passed in
    req.sanitize('id').escape();
    req.sanitize('id').trim();

    // Check other data
    req.checkBody('book', 'Book must be specified').notEmpty();
    req.checkBody('imprint', 'Imprint must be specified').notEmpty();
    req.checkBody('due_back', 'Invalid date').optional({ checkFalsy: true }).isDate();

    req.sanitize('book').escape();
    req.sanitize('imprint').escape();
    req.sanitize('status').escape();
    req.sanitize('book').trim();
    req.sanitize('imprint').trim();
    req.sanitize('status').trim();
    req.sanitize('due_back').toDate();

    var bookinstance = new BookInstance({
        book: req.body.book,
        imprint: req.body.imprint,
        status: req.body.status,
        due_back: req.body.due_back
    });

    var errors = req.validationErrors();
    if (errors) {

        Book.find({}, 'title')
            .exec(function(err, books) {
                if (err) { return next(err); }
                // Successful, so render
                res.render('bookinstance_form', { title: 'Update BookInstance', book_list: books, selected_book: bookinstance.book._id, errors: errors, bookinstance: bookinstance });
            });
        return;
    } else {
        // Data from form is valid

        bookinstance.save(function(err) {
            if (err) { return next(err); }
            // successful - redirect to new book-instance record
            res.redirect(bookinstance.url);
        });
    }
};
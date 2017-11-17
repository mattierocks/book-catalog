var Book = require('../models/book');
var async = require('async');
var Author = require('../models/author');

// Display list of all Authors
exports.author_list = function(req, res, next) {

    Author.find()
        .sort([
            ['family_name', 'ascending']
        ])
        .exec(function(err, list_authors) {
            if (err) { return next(err); }
            // Successful, so render
            res.render('author_list', { title: 'Author List', author_list: list_authors });
        });
};

// Display detail page for a specific author
exports.author_detail = function(req, res, next) {

    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id)
                .exec(callback);
        },
        authors_books: function(callback) {
            Book.find({ 'author': req.params.id }, 'title summary')
                .exec(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        // Successful, so render
        res.render('author_detail', { title: 'Author Detail', author: results.author, author_books: results.authors_books });

    });
};

// Display author create form on GET
exports.author_create_get = function(req, res, next) {
    res.render('author_form', { title: 'Create Author' });
};

// Handle Author create on POST
exports.author_create_post = function(req, res, next) {

    req.checkBody('first_name', 'First name must be specified.').notEmpty();
    req.checkBody('family_name', 'Family name must be specified.').notEmpty();
    req.checkBody('family_name', 'Family name mst be alphanumeric text.').isAlpha();
    req.checkBody('date_of_birth', 'Invalid date').optional({ checkFalsy: true }).isDate();
    req.checkBody('date_of_death', 'Invalid date').optional({ checkFalsy: true }).isDate();

    req.sanitize('first_name').escape();
    req.sanitize('family_name').escape();
    req.sanitize('first_name').trim();
    req.sanitize('family_name').trim();
    req.sanitize('date_of_birth').toDate();
    req.sanitize('date_of_death').toDate();

    var errors = req.validationErrors();

    var author = new Author({
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        date_of_birth: req.body.date_of_birth,
        date_of_death: req.body.date_of_death
    });

    if (errors) {
        res.render('author_form', { title: 'Create Author', author: author, errors: errors });
        return;
    } else {
        // Data from form is valid

        author.save(function(err) {
            if (err) { return next(err); }
            // Successful - redirect to new author record
            res.redirect(author.url);
        });
    }
};

// Display Author delete form on GET
exports.author_delete_get = function(req, res, next) {

    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id).exec(callback);
        },
        authors_books: function(callback) {
            Book.find({ 'author': req.params.id }).exec(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        // Successful, so render
        res.render('author_delete', { title: 'Delete Author', author: results.author, author_books: results.authors_books });

    });
};

// Handle Author delete on POST
exports.author_delete_post = function(req, res, next) {

    req.checkBody('authorid', 'Author id must exist').notEmpty();

    async.parallel({
        author: function(callback) {
            Author.findById(req.body.authorid).exec(callback);
        },
        authors_books: function(callback) {
            Book.find({ 'author': req.body.authorid }, 'title summary').exec(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        // Success
        if (results.authors_books.length > 0) {
            // Author has books. Render in same way as for GET route
            res.render('author_delete', { title: 'Delete Author', author: results.author, author_books: results.authors_books });
            return;
        } else {
            // Author has no books. Delete object and redirect to the list of authors.
            Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err) {
                if (err) { return next(err); }
                // Success - go to author list
                res.redirect('/catalog/authors');
            });
        }
    });
};

// Display Author update form on GET
exports.author_update_get = function(req, res, next) {

    req.sanitize('id').escape();
    req.sanitize('id').trim();

    // Get book and genres for form
    async.parallel({
        book: function(callback) {
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
        res.render('author_form', { title: 'Update Author', authors: results.authors, genres: results.genres, book: results.book });
    });
};

// Handle Author update on POST
exports.author_update_post = function(req, res, next) {

    // Sanitize ID passed in
    req.sanitize('id').escape();
    req.sanitize('id').trim();

    // Check other data
    req.checkBody('first_name', 'First name must be specified.').notEmpty();
    req.checkBody('family_name', 'Family name must be specified.').notEmpty();
    req.checkBody('family_name', 'Family name mst be alphanumeric text.').isAlpha();
    req.checkBody('date_of_birth', 'Invalid date').optional({ checkFalsy: true }).isDate();
    req.checkBody('date_of_death', 'Invalid date').optional({ checkFalsy: true }).isDate();

    req.sanitize('first_name').escape();
    req.sanitize('family_name').escape();
    req.sanitize('first_name').trim();
    req.sanitize('family_name').trim();
    req.sanitize('date_of_birth').toDate();
    req.sanitize('date_of_death').toDate();

    var author = new Author({
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        date_of_birth: req.body.date_of_birth,
        date_of_death: req.body.date_of_death
    });

    var errors = req.validationErrors();
    if (errors) {
        // Re-render book with error information
        // Get all authors and genres for form
        async.parallel({
            authors: function(callback) {
                Author.find(callback);
            },
            genres: function(callback) {
                Genre.find(callback);
            },
        }, function(err, results) {
            if (err) { return next(err); }

            // Mark our selected genres as checked
            for (i = 0; i < results.genres.length; i++) {
                if (book.genre.indexOf(results.genres[i]._id) > -1) {
                    results.genres[i].checked = 'true';
                }
            }
            res.render('author_form', { title: 'Update Author', authors: results.authors, genres: results.genres, book: book, errors: errors });
        });
    } else {
        // Data from form is valid. Update the record.
        Author.findByIdAndUpdate(req.params.id, author, {}, function(err, theauthor) {
            if (err) { return nextTick(err); }
            // Successful - redirect to the book detail page
            res.redirect(theauthor.url);
        });
    }

};
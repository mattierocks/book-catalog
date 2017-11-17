var Book = require('../models/book');
var async = require('async');
var Genre = require('../models/genre');

// Display list of all Genres
exports.genre_list = function(req, res, next) {

    Genre.find()
        .sort([
            ['name', 'ascending']
        ])
        .exec(function(err, list_genres) {
            if (err) { return next(err); }
            // Successful, so render
            res.render('genre_list', { title: 'Genre List', genre_list: list_genres });
        });
};

// Display detail page for a specific Genre
exports.genre_detail = function(req, res, next) {

    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id)
                .exec(callback);
        },

        genre_books: function(callback) {
            Book.find({ 'genre': req.params.id })
                .exec(callback);
        },

    }, function(err, results) {
        if (err) { return next(err); }
        // Successful, so render
        res.render('genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books });
    });
};

// Display Genre create form on GET
exports.genre_create_get = function(req, res, next) {
    res.render('genre_form', { title: 'Create Genre' });
};

// Handle Genre create on POST
exports.genre_create_post = function(req, res, next) {

    // Check that the name field is not empty
    req.checkBody('name', 'Genre name required').notEmpty();

    // Trim and escape the name field
    req.sanitize('name').escape();
    req.sanitize('name').trim();

    // Run the validators
    var errors = req.validationErrors();

    // Create a new genre object with escaped and trimmed data
    var genre = new Genre({ name: req.body.name });

    if (errors) {
        // If there are errors render the form again, passing the previously entered values and errors
        res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors });
        return;
    } else {
        // Data from form is valid
        // Check if genre with same name already exists
        Genre.findOne({ 'name': req.body.name })
            .exec(function(err, found_genre) {
                console.log('found_genre: ' + found_genre);
                if (err) { return next(err); }

                if (found_genre) {
                    // Genre exists, redirect to its detail page
                    res.redirect(found_genre.url);
                } else {

                    genre.save(function(err) {
                        if (err) { return next(err); }
                        // Genre saved. Redirect to detail page
                        res.redirect(genre.url);
                    });
                }
            });
    }
};

// Display Genre delete form on GET
exports.genre_delete_get = function(req, res, next) {

    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id).exec(callback);
        },
        genres_books: function(callback) {
            Book.find({ 'genre': req.params.id }).exec(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        // Successful, so render
        res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genres_books });

    });
};

// Handle Genre delete on POST
exports.genre_delete_post = function(req, res, next) {

    req.checkBody('genreid', 'Genre id must exist').notEmpty();

    async.parallel({
        genre: function(callback) {
            Genre.findById(req.body.authorid).exec(callback);
        },
        genres_books: function(callback) {
            Book.find({ 'genre': req.params.id }).exec(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        // Success
        if (results.genres_books.length > 0) {
            // Genre has books. Render in same way as for GET route
            res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genres_books });
            return;
        } else {
            // Genre has no books. Delete object and redirect to the list of authors.
            Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err) {
                if (err) { return next(err); }
                // Success - go to author list
                res.redirect('/catalog/genres');
            });
        }
    });
};

// Display Genre update form on GET
exports.genre_update_get = function(req, res, next) {

    req.sanitize('id').escape();
    req.sanitize('id').trim();

    // Get book, authors for form
    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id).populate('author').populate('genre').exec(callback);
        },
        authors: function(callback) {
            Author.find(callback);
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
        res.render('genre_form', { title: 'Update Genre', authors: results.authors, genres: results.genres, book: results.book });
    });
};

// Handle Genre update on POST
exports.genre_update_post = function(req, res, next) {

    // Sanitize ID passed in
    req.sanitize('id').escape();
    req.sanitize('id').trim();

    // Check other data
    req.checkBody('title', 'Title must not be empty.').notEmpty();
    req.checkBody('author', 'Author must not be empty.').notEmpty();
    req.checkBody('summary', 'Summary must not be empty.').notEmpty();
    req.checkBody('isbn', 'ISBN must not be empty.').notEmpty();

    req.sanitize('title').escape();
    req.sanitize('author').escape();
    req.sanitize('summary').escape();
    req.sanitize('isbn').escape();
    req.sanitize('title').trim();
    req.sanitize('author').trim();
    req.sanitize('summary').trim();
    req.sanitize('isbn').trim();
    req.sanitize('genre').escape();

    var genre = new Genre({ name: req.body.name });

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
            res.render('genre_form', { title: 'Update Genre', authors: results.authors, genres: results.genres, book: book, errors: errors });
        });
    } else {
        // Data from form is valid. Update the record.
        Genre.findByIdAndUpdate(req.params.id, genre, {}, function(err, thegenre) {
            if (err) { return nextTick(err); }
            // Successful - redirect to the genre detail page
            res.redirect(thegenre.url);
        });
    }

};
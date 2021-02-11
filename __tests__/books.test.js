process.env.NODE_ENV = "test"

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let book_id;

beforeEach(async () => {
  let result = await db.query(`
    INSERT INTO books (isbn, amazon_url,author,language,pages,publisher,title,year)   
    VALUES(
        '0691161206', 
        'http://a.co/dugYeC5', 
        'Michelle Obama', 
        'English', 
        448,  
        'Crown Publishing Group', 
        'Becoming',
        2018) 
    RETURNING isbn`);

  book_id = result.rows[0].isbn
});

describe("POST /books", () => {
  test("Adds new book to database", async () => {
    const response = await request(app)
        .post(`/books`)
        .send({
          isbn: '0582375253',
          amazon_url: "http://a.co/eobPtX3",
          author: "Barack Obama",
          language: "english",
          pages: 768,
          publisher: "Crown Publishing Group",
          title: "A Promised Land",
          year: 2020
        });
    expect(response.statusCode).toBe(201);
    expect(response.body.book).toHaveProperty("isbn");
  });

  test("Prevents creating book without required data", async () => {
    const response = await request(app)
        .post(`/books`)
        .send({
            isbn: '0583864053',
            author: "Barack Obama",
            publisher: "Crown Publishing Group",
            year: 2000
        });
    expect(response.statusCode).toBe(400);
  });
});

describe("GET /books", () => {
  test("Gets list of books in database", async () => {
    const response = await request(app).get(`/books`);
    const books = response.body.books;
    expect(books).toHaveLength(1);
    expect(books[0]).toHaveProperty("isbn");
    expect(books[0]).toHaveProperty("amazon_url");
    expect(books[0]).toHaveProperty("title");
  });
});

describe("GET /books/:isbn", () => {
  test("Get a single book by isbn", async () => {
    const response = await request(app)
        .get(`/books/${book_id}`)
    expect(response.statusCode).toBe(200);
    expect(response.body.book).toHaveProperty("isbn");
    expect(response.body.book.isbn).toBe(book_id);
  });

  test("Responds with 404 if book can not be found", async () => {
    const response = await request(app)
        .get(`/books/3697510896`)
    expect(response.statusCode).toBe(404);
  });
});

describe("PUT /books/:isbn", () => {
  test("Updates a single book", async () => {
    const response = await request(app)
        .put(`/books/${book_id}`)
        .send({
          isbn: "0691161206",
          amazon_url: "http://a.co/pcb58Rc",
          author: "Michael Jackson",
          language: "english",
          pages: 369,
          publisher: "Neverland Publishing House",
          title: "Do You Remember The Time?",
          year: 2008
        });
    expect(response.statusCode).toBe(200);
    expect(response.body.book.title).toBe("Do You Remember The Time?");
  });

  test("Prevents updating a bad book", async () => {
    const response = await request(app)
        .put(`/books/${book_id}`)
        .send({
          amazon_url: "https://a.co/rts69Be",
          author: 145484, // integer instead of string
          language: "english",
          pages: 999,
          publisher: "Moonwalker Publications",
          title: "The Way You Make Me Feel",
          year: 1988
        });
    expect(response.statusCode).toBe(400);
  });

  test("Responds with 404 if book can not be found", async () => {
    const response = await request(app)
        .put(`/books/0987654321`);
    expect(response.statusCode).toBe(400);
  });
});

describe("DELETE /books/:isbn", () => {
  test("Deletes a book by isbn", async () => {
    const response = await request(app)
        .delete(`/books/${book_id}`)
    expect(response.body).toEqual({ message: "Book deleted" });
  });
});

afterEach(async function () {
  await db.query("DELETE FROM books");
});

afterAll(async function () {
  await db.end()
});
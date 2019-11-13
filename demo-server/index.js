const express = require('express');
const faker = require('faker');
const cors = require('cors');

const app = express();

app.use(cors());

let nextId = 1;

const makeItem = () => {
  nextId += 1;

  return {
    id: nextId,
    name: faker.commerce.productName(),
    price: faker.commerce.price(),
  }
}

const items = [...new Array(5)].map(makeItem);

app.get('/', (req, res) => {
  res.status(200).json(items);
});

app.listen(3000, () => {
  // eslint-disable-next-line no-console
  console.log('------ listening');

  setInterval(() => {
    // Randomly remove items from the array.
    if (items.length > 3 && Math.random() > 0.5) {
      items.splice(Math.floor(Math.random() * items.length), 1);
    }

    // Randomly add items from the array.
    if (items.length < 5 && Math.random() > 0.5) {
      items.push(makeItem());
    }

    // Randomly update an item in the array.
    if (Math.random() > 0.5) {
      items[Math.floor(Math.random() * items.length)].price = faker.commerce.price();
    }
  }, 1000);
});

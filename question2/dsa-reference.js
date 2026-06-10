// =============================================
// DSA & OOP CHEAT SHEET — Assessment Template
// =============================================

// ---- ARRAYS ----
const arr = [5, 3, 8, 1, 9, 2];

// Sort ascending
arr.sort((a, b) => a - b);

// Find max/min
const max = Math.max(...arr);
const min = Math.min(...arr);

// Two-pointer pattern
function twoSum(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left < right) {
    const sum = arr[left] + arr[right];
    if (sum === target) return [left, right];
    else if (sum < target) left++;
    else right--;
  }
  return null;
}

// Sliding window
function maxSubarraySum(arr, k) {
  let sum = arr.slice(0, k).reduce((a, b) => a + b, 0);
  let max = sum;
  for (let i = k; i < arr.length; i++) {
    sum += arr[i] - arr[i - k];
    max = Math.max(max, sum);
  }
  return max;
}

// ---- HASHMAPS (frequency count) ----
function frequencyCount(arr) {
  const map = {};
  for (const val of arr) map[val] = (map[val] || 0) + 1;
  return map;
}

// ---- STACK ----
class Stack {
  constructor() { this.data = []; }
  push(val) { this.data.push(val); }
  pop() { return this.data.pop(); }
  peek() { return this.data[this.data.length - 1]; }
  isEmpty() { return this.data.length === 0; }
}

// ---- QUEUE ----
class Queue {
  constructor() { this.data = []; }
  enqueue(val) { this.data.push(val); }
  dequeue() { return this.data.shift(); }
  front() { return this.data[0]; }
  isEmpty() { return this.data.length === 0; }
}

// ---- LINKED LIST ----
class ListNode {
  constructor(val) {
    this.val = val;
    this.next = null;
  }
}
class LinkedList {
  constructor() { this.head = null; }
  append(val) {
    const node = new ListNode(val);
    if (!this.head) { this.head = node; return; }
    let curr = this.head;
    while (curr.next) curr = curr.next;
    curr.next = node;
  }
  toArray() {
    const result = [];
    let curr = this.head;
    while (curr) { result.push(curr.val); curr = curr.next; }
    return result;
  }
}

// ---- BINARY SEARCH ----
function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    else if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

// ---- RECURSION / FIBONACCI ----
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Memoized version
function fibMemo(n, memo = {}) {
  if (n in memo) return memo[n];
  if (n <= 1) return n;
  memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
  return memo[n];
}

// ---- OOP CONCEPTS ----
class Animal {
  constructor(name, sound) {
    this.name = name;
    this.sound = sound;
  }
  speak() {
    return `${this.name} says ${this.sound}`;
  }
}

class Dog extends Animal {
  constructor(name) {
    super(name, 'Woof');
  }
  fetch(item) {
    return `${this.name} fetches the ${item}!`;
  }
}

// Encapsulation with private fields
class BankAccount {
  #balance;
  constructor(initialBalance) {
    this.#balance = initialBalance;
  }
  deposit(amount) {
    if (amount > 0) this.#balance += amount;
  }
  withdraw(amount) {
    if (amount <= this.#balance) this.#balance -= amount;
    else throw new Error('Insufficient funds');
  }
  getBalance() { return this.#balance; }
}

// Interfaces via duck typing / polymorphism
class Shape {
  area() { throw new Error('area() must be implemented'); }
}
class Circle extends Shape {
  constructor(r) { super(); this.r = r; }
  area() { return Math.PI * this.r * this.r; }
}
class Rectangle extends Shape {
  constructor(w, h) { super(); this.w = w; this.h = h; }
  area() { return this.w * this.h; }
}

// ---- USEFUL UTILITIES ----
const isPalindrome = (str) => str === str.split('').reverse().join('');
const reverseString = (str) => str.split('').reverse().join('');
const removeDuplicates = (arr) => [...new Set(arr)];

module.exports = {
  twoSum, maxSubarraySum, frequencyCount, binarySearch,
  fibonacci, fibMemo, Stack, Queue, LinkedList,
  Animal, Dog, BankAccount, Circle, Rectangle,
  isPalindrome, reverseString, removeDuplicates
};

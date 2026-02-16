# Task: gen-dict-word_length-4807 | Score: 100% | 2026-02-12T14:01:57.191000

text = input()
words = text.split()
unique_words = sorted(list(set(words)))
for word in unique_words:
  print(word, len(word))
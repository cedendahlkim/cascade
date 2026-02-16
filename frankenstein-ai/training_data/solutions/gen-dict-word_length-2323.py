# Task: gen-dict-word_length-2323 | Score: 100% | 2026-02-12T17:17:16.632509

text = input()
words = text.split()
unique_words = sorted(list(set(words)))
for word in unique_words:
  print(word, len(word))
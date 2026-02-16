# Task: gen-dict-word_length-5622 | Score: 100% | 2026-02-12T13:28:27.108458

text = input()
words = text.split()
unique_words = sorted(list(set(words)))
for word in unique_words:
  print(word, len(word))
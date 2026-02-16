# Task: gen-dict-word_length-2441 | Score: 100% | 2026-02-12T20:54:50.925563

text = input()
words = text.split()
unique_words = sorted(list(set(words)))
for word in unique_words:
    print(word, len(word))
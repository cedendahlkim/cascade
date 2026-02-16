# Task: gen-dict-word_length-5015 | Score: 100% | 2026-02-12T20:55:09.668497

text = input()
words = text.split()
unique_words = sorted(list(set(words)))
for word in unique_words:
    print(word, len(word))
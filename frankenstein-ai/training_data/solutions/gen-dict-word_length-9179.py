# Task: gen-dict-word_length-9179 | Score: 100% | 2026-02-12T19:14:15.191606

text = input()
words = text.split()
unique_words = sorted(list(set(words)))
for word in unique_words:
    print(word, len(word))
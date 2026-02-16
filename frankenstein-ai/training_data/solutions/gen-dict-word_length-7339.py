# Task: gen-dict-word_length-7339 | Score: 100% | 2026-02-12T19:56:10.845230

text = input()
words = text.split()
unique_words = sorted(list(set(words)))
for word in unique_words:
    print(word, len(word))
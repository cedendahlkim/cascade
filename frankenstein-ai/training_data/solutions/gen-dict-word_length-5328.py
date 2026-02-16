# Task: gen-dict-word_length-5328 | Score: 100% | 2026-02-12T12:14:20.619740

text = input()
words = text.split()
unique_words = sorted(list(set(words)))
for word in unique_words:
    print(word, len(word))
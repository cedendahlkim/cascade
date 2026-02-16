# Task: gen-dict-word_length-4406 | Score: 100% | 2026-02-12T19:14:30.038500

text = input()
words = text.split()
unique_words = sorted(list(set(words)))
for word in unique_words:
    print(word, len(word))
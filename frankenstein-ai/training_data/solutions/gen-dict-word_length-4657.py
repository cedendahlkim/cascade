# Task: gen-dict-word_length-4657 | Score: 100% | 2026-02-12T17:28:46.512988

text = input()
words = text.split()
unique_words = sorted(list(set(words)))
for word in unique_words:
    print(word, len(word))
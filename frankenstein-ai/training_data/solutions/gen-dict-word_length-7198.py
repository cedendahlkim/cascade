# Task: gen-dict-word_length-7198 | Score: 100% | 2026-02-12T15:55:35.273370

text = input()
words = text.split()
unique_words = sorted(list(set(words)))
for word in unique_words:
    print(word, len(word))
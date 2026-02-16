# Task: gen-dict-word_length-1475 | Score: 100% | 2026-02-12T12:16:47.161677

text = input()
words = text.split()
unique_words = sorted(list(set(words)))
for word in unique_words:
    print(word, len(word))
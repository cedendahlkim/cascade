# Task: gen-dict-word_length-4289 | Score: 100% | 2026-02-12T12:32:28.801034

text = input()
words = text.split()
unique_words = sorted(list(set(words)))
for word in unique_words:
    print(word, len(word))
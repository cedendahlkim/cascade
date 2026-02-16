# Task: gen-dict-word_length-2499 | Score: 100% | 2026-02-10T15:43:04.743708

text = input()
words = text.split()
unique_words = sorted(list(set(words)))
for word in unique_words:
    print(word, len(word))